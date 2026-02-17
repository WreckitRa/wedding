import { Router } from "express";
import { nanoid } from "nanoid";

/** Public route: no auth. Used by the landing page "Get early access" forms. */
export function createEarlyAccessRouter(db) {
  const router = Router();

  router.post("/", (req, res) => {
    const { name, email, eventType, plan, city } = req.body || {};
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    const id = nanoid();
    db.prepare(
      `INSERT INTO early_access_leads (id, name, email, event_type, plan, city)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      trimmedName,
      trimmedEmail,
      typeof eventType === "string" ? eventType.trim() || null : null,
      typeof plan === "string" ? plan.trim() || null : null,
      typeof city === "string" ? city.trim() || null : null
    );
    res.status(201).json({ success: true, id });
  });

  return router;
}
