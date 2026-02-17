import "dotenv/config";
import db from "../db/index.js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const weddingPath = path.join(__dirname, "..", "..", "src", "data", "wedding.json");
const wedding = JSON.parse(readFileSync(weddingPath, "utf-8"));

const slug = process.env.SEED_SLUG || "raphael-christine";
const eventId = nanoid();
const mainAdminId = "main-admin-1";

db.prepare(
  "INSERT OR IGNORE INTO events (id, slug, name, config, created_by) VALUES (?, ?, ?, ?, ?)"
).run(
  eventId,
  slug,
  wedding.coupleNames || "Wedding",
  JSON.stringify(wedding),
  mainAdminId
);

console.log("Seeded event:", slug, "id:", eventId);
