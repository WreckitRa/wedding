import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirnameServer = path.dirname(fileURLToPath(import.meta.url));
// Load .env from server/ if present; never override existing env (e.g. Railway's SQLITE_PATH)
dotenv.config({ path: path.join(__dirnameServer, ".env"), override: false });
dotenv.config({ path: path.join(__dirnameServer, "..", ".env"), override: false });

import express from "express";
import cors from "cors";
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
