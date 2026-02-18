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
