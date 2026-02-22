import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirnameServer = path.dirname(fileURLToPath(import.meta.url));
// Load .env from server/ if present; never override existing env (e.g. Railway's SQLITE_PATH)
dotenv.config({ path: path.join(__dirnameServer, ".env"), override: false });
dotenv.config({ path: path.join(__dirnameServer, "..", ".env"), override: false });

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import db, { persistentDataDir } from "./db/index.js";
import { createAuthRouter } from "./routes/auth.js";
import { createEventsRouter } from "./routes/events.js";
import { createEarlyAccessRouter } from "./routes/earlyAccess.js";
import { createAdminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.set("trust proxy", 1); // so req.protocol is correct behind Railway/reverse proxies (for og:image URL)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// One-time seed: create main admin if none exists. Call from browser after first deploy on Railway.
// GET /api/admin/seed-main-admin?secret=YOUR_SEED_SECRET (set SEED_MAIN_ADMIN_SECRET in Railway)
app.get("/api/admin/seed-main-admin", (req, res) => {
  const secret = process.env.SEED_MAIN_ADMIN_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(404).json({ error: "Not found" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE role = 'main_admin' LIMIT 1").get();
  if (existing) {
    return res.json({ ok: true, message: "Main admin already exists" });
  }
  const email = process.env.MAIN_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.MAIN_ADMIN_PASSWORD || "changeme";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'main_admin')"
  ).run("main-admin-1", email, hash);
  res.json({ ok: true, message: "Main admin created. You can log in at /admin with MAIN_ADMIN_EMAIL and MAIN_ADMIN_PASSWORD." });
});

// GET /api/place-maps-url?placeId=ChIJ... — returns Google's exact map URL (Places API New). Uses key from X-Google-Api-Key header (same as Maps JS key) or GOOGLE_PLACES_API_KEY env.
app.get("/api/place-maps-url", async (req, res) => {
  const placeId = req.query.placeId;
  const key = req.get("X-Google-Api-Key")?.trim() || process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!placeId || typeof placeId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(placeId)) {
    return res.status(400).json({ error: "Missing or invalid placeId" });
  }
  if (!key) {
    return res.status(503).json({ error: "Place map URL not configured" });
  }
  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const resp = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "googleMapsUri",
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status === 404 ? 404 : 502).json({ error: "Place not found or API error", details: text.slice(0, 200) });
    }
    const data = await resp.json();
    const mapUrl = data.googleMapsUri ?? data.googleMapsLinks?.placeUri;
    if (!mapUrl) return res.status(502).json({ error: "No map URL in response" });
    res.json({ url: mapUrl });
  } catch (e) {
    console.error("[place-maps-url]", e);
    res.status(500).json({ error: "Failed to fetch place map URL" });
  }
});

app.use("/api/auth", createAuthRouter(db));
app.use("/api/events", createEventsRouter(db));
app.use("/api/early-access", createEarlyAccessRouter(db));
app.use("/api/admin", createAdminRouter(db));

// Uploaded images: same persistent dir as DB so they survive deploys (e.g. volume at /data with SQLITE_PATH=/data/wedding.db)
const uploadsPath = path.join(persistentDataDir, "uploads");
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
  } catch (_) {}
}
app.use("/uploads", express.static(uploadsPath));

// Optional: serve frontend build (for single-server deploy)
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));

// Invite URL meta injection: crawlers (WhatsApp, etc.) don't run JS, so we inject og:* into HTML for /e/:slug and /e/:slug/invite/:token
const INVITE_PATH_RE = /^\/e\/([^/]+)(?:\/invite\/([^/]+))?\/?$/;
const SITE_NAME = "DearGuest";
// Exact strings from index.html so we can replace them reliably (built index may differ slightly from source)
const DEFAULT_TITLE = "DearGuest | Your guestlist runs itself";
const DEFAULT_DESC_FULL = "One link. Guests RSVP, you see who opened and who's pending. Smart reminders by WhatsApp and email—no chasing. Built for weddings and events.";
const DEFAULT_DESC_OG = "One link. Guests RSVP, you see who opened and who's pending. Smart reminders by WhatsApp and email. Built for weddings and events.";

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const m = req.path.match(INVITE_PATH_RE);
  if (!m) {
    return res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) res.status(404).json({ error: "Not found" });
    });
  }
  const eventSlug = m[1];
  const event = db.prepare("SELECT id, slug, name, config FROM events WHERE slug = ?").get(eventSlug);
  if (!event) {
    return res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) res.status(404).json({ error: "Not found" });
    });
  }
  const config = typeof event.config === "string" ? JSON.parse(event.config) : event.config || {};
  const shareMeta = config.shareMeta || {};
  // Use share form values exactly when set; otherwise fall back to couple/event name or defaults
  const customTitle = shareMeta.title && shareMeta.title.trim();
  const fullTitle = customTitle
    ? escapeHtml(customTitle)
    : (config.coupleNames || event.name)
      ? `${escapeHtml(config.coupleNames || event.name)} — ${SITE_NAME}`
      : DEFAULT_TITLE;
  const description = (shareMeta.description && shareMeta.description.trim()) || "You're invited — view your invitation and RSVP.";
  const origin = `${req.protocol}://${req.get("host") || req.hostname}`.replace(/\/$/, "");
  let imageUrl = shareMeta.image && shareMeta.image.trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = origin + (imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl);
  }
  const indexPath = path.join(distPath, "index.html");
  fs.readFile(indexPath, "utf8", (err, html) => {
    if (err) {
      return res.sendFile(indexPath, (e) => (e ? res.status(404).json({ error: "Not found" }) : null));
    }
    const safeDesc = escapeHtml(description);
    // Replace exact default strings so we don't depend on regex matching built HTML structure (fullTitle is already safe)
    let out = html
      .split(DEFAULT_TITLE).join(fullTitle)
      .split(DEFAULT_DESC_FULL).join(safeDesc)
      .split(DEFAULT_DESC_OG).join(safeDesc);
    if (imageUrl) {
      const imgTag = `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`;
      const twitterImg = `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`;
      if (!out.includes("og:image")) {
        out = out.replace(/(<meta property="og:type"[^>]*\/?>)/, `$1\n    ${imgTag}`);
      } else {
        out = out.replace(/<meta property="og:image" content="[^"]*"\/?>/, imgTag);
      }
      if (!out.includes("twitter:image")) {
        out = out.replace(/(<meta name="twitter:description"[^>]*\/?>)/, `$1\n    ${twitterImg}`);
      } else {
        out = out.replace(/<meta name="twitter:image" content="[^"]*"\/?>/, twitterImg);
      }
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(out);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
