import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../middleware/auth.js";

export function createAuthRouter(db) {
  const router = Router();

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });

  return router;
}
