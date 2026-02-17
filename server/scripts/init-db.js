import "dotenv/config";
import db from "../db/index.js";
import bcrypt from "bcryptjs";

const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "admin@example.com";
const mainAdminPassword = process.env.MAIN_ADMIN_PASSWORD || "changeme";

const userId = "main-admin-1";
const hash = await bcrypt.hash(mainAdminPassword, 10);

db.prepare(
  `INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'main_admin')`
).run(userId, mainAdminEmail, hash);

console.log("Database initialized.");
console.log("Main admin:", mainAdminEmail, "| Password: (set via MAIN_ADMIN_PASSWORD or default 'changeme')");
