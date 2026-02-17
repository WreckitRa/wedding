import Database from "better-sqlite3";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "wedding.db");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function runSchema() {
  const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
}

function runMigrations() {
  try {
    const eventsCols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
    if (!eventsCols.includes("owner_id")) {
      db.exec("ALTER TABLE events ADD COLUMN owner_id TEXT REFERENCES users(id)");
      db.exec("UPDATE events SET owner_id = created_by WHERE owner_id IS NULL");
    }
  } catch (_) {}
  try {
    const guestCols = db.prepare("PRAGMA table_info(guests)").all().map((c) => c.name);
    if (!guestCols.includes("first_opened_at")) {
      db.exec("ALTER TABLE guests ADD COLUMN first_opened_at TEXT");
    }
  } catch (_) {}
  try {
    db.prepare("SELECT 1 FROM early_access_leads LIMIT 1").get();
  } catch (_) {
    db.exec(`
      CREATE TABLE early_access_leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        event_type TEXT,
        plan TEXT,
        city TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access_leads(created_at);
    `);
  }
}

runSchema();
runMigrations();

export default db;
