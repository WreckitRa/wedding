import { Router } from "express";
import { nanoid } from "nanoid";

/** Public routes: no auth */

export function createEventsRouter(db) {
  const router = Router();

  // GET /api/events — list public event slugs/names (for admin dropdown or landing)
  router.get("/", (req, res) => {
    const rows = db.prepare(
      "SELECT id, slug, name, created_at FROM events ORDER BY created_at DESC"
    ).all();
    res.json(rows);
  });

  // GET /api/events/:slug — public event details by slug (for guest page)
  router.get("/:slug", (req, res) => {
    const row = db.prepare(
      "SELECT id, slug, name, config FROM events WHERE slug = ?"
    ).get(req.params.slug);
    if (!row) return res.status(404).json({ error: "Event not found" });
    const config = typeof row.config === "string" ? JSON.parse(row.config) : row.config;
    res.json({ id: row.id, slug: row.slug, name: row.name, config });
  });

  // GET /api/events/:slug/guest/:token — get guest by token (dedicated link)
  router.get("/:slug/guest/:token", (req, res) => {
    const event = db.prepare("SELECT id FROM events WHERE slug = ?").get(req.params.slug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const guest = db.prepare(
      "SELECT id, token, name, partner_name AS partnerName, max_extra_guests AS maxExtraGuests FROM guests WHERE event_id = ? AND token = ?"
    ).get(event.id, req.params.token);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    res.json(guest);
  });

  // POST /api/events/:slug/guest/:token/opened — record that guest opened the invite link (idempotent)
  router.post("/:slug/guest/:token/opened", (req, res) => {
    const event = db.prepare("SELECT id FROM events WHERE slug = ?").get(req.params.slug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const guest = db.prepare("SELECT id, first_opened_at FROM guests WHERE event_id = ? AND token = ?").get(event.id, req.params.token);
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    if (!guest.first_opened_at) {
      db.prepare("UPDATE guests SET first_opened_at = datetime('now') WHERE id = ?").run(guest.id);
    }
    res.json({ ok: true });
  });

  // POST /api/events/:slug/rsvp — submit RSVP (works for both public and dedicated)
  router.post("/:slug/rsvp", (req, res) => {
    const event = db.prepare("SELECT id FROM events WHERE slug = ?").get(req.params.slug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const {
      guestId,
      guestName,
      partnerName,
      attendance,
      extraGuests = 0,
      favoriteSongs = [],
      reaction,
      message,
    } = req.body || {};
    if (!guestName || !attendance) {
      return res.status(400).json({ error: "guestName and attendance required" });
    }
    const id = nanoid();
    db.prepare(
      `INSERT INTO rsvps (id, event_id, guest_id, guest_name, partner_name, attendance, extra_guests, song1, song2, reaction, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      event.id,
      guestId || null,
      guestName,
      partnerName || null,
      attendance,
      Number(extraGuests) || 0,
      favoriteSongs[0] || null,
      favoriteSongs[1] || null,
      reaction || null,
      message || null
    );
    res.status(201).json({ success: true, id });
  });

  // GET /api/events/:slug/rsvp-status — check if already RSVP'd (by guestId for dedicated, or by guestName for public we could add later)
  router.get("/:slug/rsvp-status", (req, res) => {
    const event = db.prepare("SELECT id FROM events WHERE slug = ?").get(req.params.slug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const { guestId } = req.query;
    if (guestId) {
      const guest = db.prepare("SELECT id FROM guests WHERE event_id = ? AND (id = ? OR token = ?)").get(event.id, guestId, guestId);
      if (!guest) return res.json({ found: false });
      const rsvp = db.prepare("SELECT 1 FROM rsvps WHERE event_id = ? AND guest_id = ?").get(event.id, guest.id);
      return res.json({ found: !!rsvp });
    }
    res.json({ found: false });
  });

  return router;
}
