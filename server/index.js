import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirnameServer = path.dirname(fileURLToPath(import.meta.url));
// Load .env from server/ if present; never override existing env (e.g. Railway's SQLITE_PATH)
dotenv.config({ path: path.join(__dirnameServer, ".env"), override: false });
dotenv.config({ path: path.join(__dirnameServer, "..", ".env"), override: false });

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import db from "./db/index.js";
import { createAuthRouter } from "./routes/auth.js";
import { createEventsRouter } from "./routes/events.js";
import { createEarlyAccessRouter } from "./routes/earlyAccess.js";
import { createAdminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
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

// Uploaded moment images (per-event)
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Optional: serve frontend build (for single-server deploy)
const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
