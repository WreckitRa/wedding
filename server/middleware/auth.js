import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = payload;
  next();
}

/** Require main_admin role. Use after authMiddleware. */
export function requireMainAdmin(req, res, next) {
  if (req.user?.role !== "main_admin") {
    return res.status(403).json({ error: "Forbidden: main admin only" });
  }
  next();
}

/** Require main_admin, event owner (created_by or owner_id), or event_admin for the given event. Use after authMiddleware. */
export function requireEventAdmin(db) {
  return (req, res, next) => {
    const eventSlugOrId = req.params.eventId || req.params.eventSlug;
    if (!eventSlugOrId) return res.status(400).json({ error: "Missing event" });
    const event = db.prepare("SELECT id, created_by, owner_id FROM events WHERE id = ? OR slug = ?").get(eventSlugOrId, eventSlugOrId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    req.eventId = event.id;
    if (req.user?.role === "main_admin") return next();
    const ownerId = event.owner_id || event.created_by;
    if (ownerId === req.user.userId) return next();
    const allowed = db.prepare("SELECT 1 FROM event_admins WHERE event_id = ? AND user_id = ?").get(event.id, req.user.userId);
    if (!allowed) return res.status(403).json({ error: "Forbidden: not admin for this event" });
    next();
  };
}
