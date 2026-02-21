import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import multer from "multer";
import { authMiddleware, requireMainAdmin, requireEventAdmin, signToken } from "../middleware/auth.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use data/uploads so uploads persist when Railway volume is mounted at server/data
const uploadsDir = path.join(__dirname, "..", "data", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const uploadMoments = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(uploadsDir, req.params.eventSlug);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${nanoid(10)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /^image\//.test(file.mimetype);
    cb(null, !!ok);
  },
});

const uploadInvitation = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(uploadsDir, req.params.eventSlug, "invitation");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${file.fieldname}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /^image\//.test(file.mimetype);
    cb(null, !!ok);
  },
});

/** POST /api/admin/palette — generate wedding invitation color palette from a short theme description (e.g. "gold and rose"). Requires OPENAI_API_KEY. */
async function generatePaletteWithOpenAI(themeDescription) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  const prompt = `You are a wedding invitation design expert. Given a short theme description, return a cohesive color palette for a wedding invitation.

Theme description: "${themeDescription}"

Return a JSON object with exactly these keys, all values must be valid hex colors (e.g. "#B8860B"):
- primaryColor (main accent)
- secondaryColor (supporting accent)
- backgroundColor (page background, keep light for readability)
- textColor (body text, dark for contrast)
- headingColor (titles/couple name)
- linkColor (links)
- buttonBgColor (primary buttons e.g. RSVP)
- buttonTextColor (text on buttons, usually white or light)
- borderColor (dividers/borders)

Choose elegant, harmonious colors that match the theme. For "gold and rose" for example: warm golds, blush rose, cream background, dark brown text.

Also include exactly one heading font for titles/couple name. Key: fontHeading. Value must be exactly one of: "Pinyon Script", "Great Vibes", "Dancing Script", "Cinzel", "Cormorant Garamond". Pick the one that best matches the theme (e.g. script for romantic, serif for classic). Return only the JSON object, no markdown or explanation.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");
  const palette = JSON.parse(content);
  const hexKeys = ["primaryColor", "secondaryColor", "backgroundColor", "textColor", "headingColor", "linkColor", "buttonBgColor", "buttonTextColor", "borderColor"];
  const allowedHeadingFonts = ["Pinyon Script", "Great Vibes", "Dancing Script", "Cinzel", "Cormorant Garamond"];
  const out = {};
  for (const k of hexKeys) {
    const v = palette[k];
    if (v && /^#[0-9A-Fa-f]{6}$/.test(String(v).trim())) out[k] = String(v).trim();
    else if (v && /^[0-9A-Fa-f]{6}$/.test(String(v).trim())) out[k] = "#" + String(v).trim();
  }
  const rawHeading = palette.fontHeading && String(palette.fontHeading).trim();
  if (rawHeading && allowedHeadingFonts.includes(rawHeading)) out.fontHeading = rawHeading;
  else if (rawHeading) {
    const match = allowedHeadingFonts.find((f) => f.toLowerCase() === rawHeading.toLowerCase());
    if (match) out.fontHeading = match;
  }
  return out;
}

export function createAdminRouter(db) {
  const router = Router();
  router.use(authMiddleware);

  // ——— Palette (admin only, uses OPENAI_API_KEY) ———
  router.post("/palette", async (req, res) => {
    const { theme } = req.body || {};
    const description = typeof theme === "string" ? theme.trim() : "";
    if (!description) return res.status(400).json({ error: "theme string required" });
    try {
      const palette = await generatePaletteWithOpenAI(description);
      return res.json({ palette });
    } catch (e) {
      return res.status(500).json({ error: e.message || "Failed to generate palette" });
    }
  });

  // ——— Early access / sign up access (main_admin only) ———
  router.get("/early-access", requireMainAdmin, (req, res) => {
    const rows = db.prepare(
      "SELECT id, name, email, event_type AS eventType, plan, city, created_at AS createdAt FROM early_access_leads ORDER BY created_at DESC"
    ).all();
    res.json(rows);
  });

  // ——— Main admin: users & events ———

  // POST /api/admin/events — create event (main_admin only). Optionally create event owner with ownerEmail + ownerPassword (new user gets access); or pass ownerId (existing user); else creator is owner.
  router.post("/events", requireMainAdmin, async (req, res) => {
    const { slug, name, config, ownerId, ownerEmail, ownerPassword } = req.body || {};
    if (!slug || !name) return res.status(400).json({ error: "slug and name required" });
    let owner = ownerId || req.user.userId;
    let createdOwner = null;
    if (ownerEmail && ownerPassword) {
      if (!ownerEmail.trim() || !ownerPassword) return res.status(400).json({ error: "ownerEmail and ownerPassword required when creating event owner" });
      const newUserId = nanoid();
      const hash = await bcrypt.hash(ownerPassword, 10);
      try {
        db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'event_admin')").run(newUserId, ownerEmail.trim(), hash);
      } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Event owner email already in use" });
        throw e;
      }
      owner = newUserId;
      createdOwner = { id: newUserId, email: ownerEmail.trim() };
    }
    const id = nanoid();
    const configStr = typeof config === "object" ? JSON.stringify(config) : (config || "{}");
    try {
      db.prepare(
        "INSERT INTO events (id, slug, name, config, created_by, owner_id) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id, slug, name, configStr, req.user.userId, owner);
      if (createdOwner) {
        db.prepare("INSERT INTO event_admins (event_id, user_id) VALUES (?, ?)").run(id, owner);
      }
    } catch (e) {
      if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Slug already exists" });
      throw e;
    }
    res.status(201).json({ id, slug, name, ownerId: owner, createdOwner: createdOwner || undefined });
  });

  // GET /api/admin/events — main_admin sees all; event owners see events they own; others see events where they are in event_admins
  router.get("/events", (req, res) => {
    if (req.user.role === "main_admin") {
      const rows = db.prepare(
        "SELECT id, slug, name, created_at, created_by, owner_id FROM events ORDER BY created_at DESC"
      ).all();
      return res.json(rows);
    }
    const rows = db.prepare(
      `SELECT DISTINCT e.id, e.slug, e.name, e.created_at, e.created_by, e.owner_id
       FROM events e
       LEFT JOIN event_admins ea ON ea.event_id = e.id AND ea.user_id = ?
       WHERE e.owner_id = ? OR e.created_by = ? OR ea.user_id IS NOT NULL
       ORDER BY e.created_at DESC`
    ).all(req.user.userId, req.user.userId, req.user.userId);
    res.json(rows);
  });

  // ——— Event admin: single event ———

  // POST /api/admin/events/:eventSlug/upload — upload up to 5 moment images
  router.post(
    "/events/:eventSlug/upload",
    requireEventAdmin(db),
    (req, res, next) => {
      uploadMoments.array("images", 5)(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });
        next();
      });
    },
    (req, res) => {
      const eventSlug = req.params.eventSlug;
      const files = req.files || [];
      const base = `/uploads/${eventSlug}`;
      const urls = files.map((f) => `${base}/${f.filename}`);
      res.json({ urls });
    }
  );

  // POST /api/admin/events/:eventSlug/upload-invitation — upload card invitation images (front, back, envelope)
  router.post(
    "/events/:eventSlug/upload-invitation",
    requireEventAdmin(db),
    (req, res, next) => {
      uploadInvitation.fields([
        { name: "front", maxCount: 1 },
        { name: "back", maxCount: 1 },
        { name: "envelope", maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });
        next();
      });
    },
    (req, res) => {
      const eventSlug = req.params.eventSlug;
      const base = `/uploads/${eventSlug}/invitation`;
      const out = {};
      const files = req.files || {};
      for (const key of ["front", "back", "envelope"]) {
        const arr = files[key];
        if (arr && arr[0]) out[key] = `${base}/${arr[0].filename}`;
      }
      res.json(out);
    }
  );

  // GET /api/admin/events/:eventSlug — event detail + guest count, rsvp count. main_admin also gets ownerId, ownerEmail.
  router.get("/events/:eventSlug", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId || req.params.eventSlug;
    const event = db.prepare("SELECT id, slug, name, config, created_at, owner_id, created_by FROM events WHERE id = ? OR slug = ?").get(eventId, eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const guests = db.prepare("SELECT COUNT(*) AS c FROM guests WHERE event_id = ?").get(event.id);
    const rsvps = db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE event_id = ?").get(event.id);
    const coming = db.prepare(
      `SELECT COALESCE(SUM(1 + CASE WHEN COALESCE(TRIM(partner_name), '') != '' THEN 1 ELSE 0 END + COALESCE(extra_guests, 0)), 0) AS c
       FROM rsvps WHERE event_id = ? AND attendance = 'yes'`
    ).get(event.id);
    const config = typeof event.config === "string" ? JSON.parse(event.config) : event.config;
    const out = { ...event, config, guestCount: guests.c, rsvpCount: rsvps.c, comingCount: Number(coming?.c ?? 0) };
    if (req.user.role === "main_admin") {
      const ownerId = event.owner_id || event.created_by;
      if (ownerId) {
        const owner = db.prepare("SELECT id, email FROM users WHERE id = ?").get(ownerId);
        if (owner) {
          out.ownerId = owner.id;
          out.ownerEmail = owner.email;
        }
      }
    }
    res.json(out);
  });

  // PATCH /api/admin/events/:eventSlug — update event. name/slug: main_admin only; config: any event admin.
  router.patch("/events/:eventSlug", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const { name, config, slug: newSlug, confirmRemoveGuestsAndRsvps } = req.body || {};
    const isMainAdmin = req.user.role === "main_admin";

    if (config !== undefined) {
      const configStr = typeof config === "object" ? JSON.stringify(config) : config;
      db.prepare("UPDATE events SET config = ? WHERE id = ?").run(configStr, eventId);
    }
    if (name !== undefined) {
      if (!isMainAdmin) return res.status(403).json({ error: "Only the system admin can change the event name" });
      db.prepare("UPDATE events SET name = ? WHERE id = ?").run(name, eventId);
    }

    if (newSlug !== undefined) {
      if (!isMainAdmin) return res.status(403).json({ error: "Only the system admin can change the event URL" });
      const normalized = String(newSlug).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (!normalized || normalized.length < 2) {
        return res.status(400).json({ error: "Slug must be at least 2 characters and only letters, numbers, and hyphens" });
      }
      const current = db.prepare("SELECT slug FROM events WHERE id = ?").get(eventId);
      if (current.slug === normalized) {
        return res.json({ ok: true });
      }
      const existing = db.prepare("SELECT id FROM events WHERE slug = ? AND id != ?").get(normalized, eventId);
      if (existing) {
        return res.status(400).json({ error: "That URL is already used by another event" });
      }
      const guestCount = db.prepare("SELECT COUNT(*) AS c FROM guests WHERE event_id = ?").get(eventId).c;
      const rsvpCount = db.prepare("SELECT COUNT(*) AS c FROM rsvps WHERE event_id = ?").get(eventId).c;
      if (guestCount > 0 || rsvpCount > 0) {
        if (confirmRemoveGuestsAndRsvps !== true) {
          return res.status(400).json({
            error: "Event has guests or RSVPs",
            requireConfirm: true,
            guestCount,
            rsvpCount,
          });
        }
        db.prepare("DELETE FROM rsvps WHERE event_id = ?").run(eventId);
        db.prepare("DELETE FROM guests WHERE event_id = ?").run(eventId);
      }
      db.prepare("UPDATE events SET slug = ? WHERE id = ?").run(normalized, eventId);
      return res.json({ ok: true, slug: normalized });
    }

    res.json({ ok: true });
  });

  // PATCH /api/admin/events/:eventSlug/owner — update event owner login (main_admin only). Body: { email?, newPassword? }
  router.patch("/events/:eventSlug/owner", requireMainAdmin, async (req, res) => {
    const eventId = req.params.eventSlug;
    const event = db.prepare("SELECT id, owner_id, created_by FROM events WHERE id = ? OR slug = ?").get(eventId, eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const ownerId = event.owner_id || event.created_by;
    if (!ownerId) return res.status(400).json({ error: "Event has no owner" });
    const { email: newEmail, newPassword } = req.body || {};
    if (!newEmail?.trim() && !newPassword) {
      return res.status(400).json({ error: "Provide email and/or newPassword to update" });
    }
    if (newEmail?.trim()) {
      const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(newEmail.trim(), ownerId);
      if (existing) return res.status(409).json({ error: "That email is already in use" });
      db.prepare("UPDATE users SET email = ? WHERE id = ?").run(newEmail.trim(), ownerId);
    }
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, ownerId);
    }
    res.json({ ok: true });
  });

  // DELETE /api/admin/events/:eventSlug — delete event (main_admin only; cascades to guests, rsvps, event_admins)
  router.delete("/events/:eventSlug", requireEventAdmin(db), (req, res) => {
    if (req.user.role !== "main_admin") {
      return res.status(403).json({ error: "Only system admin can delete events" });
    }
    const eventId = req.eventId;
    db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
    res.json({ ok: true });
  });

  // GET /api/admin/events/:eventSlug/guests — list guests with first_opened_at and has_rsvp
  router.get("/events/:eventSlug/guests", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const rows = db.prepare(
      `SELECT g.id, g.token, g.name, g.partner_name AS partnerName, g.max_extra_guests AS maxExtraGuests,
              g.first_opened_at AS firstOpenedAt, g.created_at AS createdAt,
              (SELECT 1 FROM rsvps r WHERE r.guest_id = g.id AND r.event_id = g.event_id LIMIT 1) AS hasRsvp
       FROM guests g
       WHERE g.event_id = ?
       ORDER BY g.name`
    ).all(eventId);
    const out = rows.map((r) => ({
      ...r,
      hasRsvp: !!r.hasRsvp,
    }));
    res.json(out);
  });

  // POST /api/admin/events/:eventSlug/guests — add guest (generates token for dedicated link)
  router.post("/events/:eventSlug/guests", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const { name, partnerName, maxExtraGuests } = req.body || {};
    if (!name) return res.status(400).json({ error: "name required" });
    const id = nanoid();
    const token = nanoid(12);
    db.prepare(
      "INSERT INTO guests (id, event_id, token, name, partner_name, max_extra_guests) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, eventId, token, name, partnerName || null, maxExtraGuests ?? null);
    res.status(201).json({
      id,
      token,
      name,
      partnerName: partnerName || null,
      maxExtraGuests: maxExtraGuests ?? null,
      inviteUrl: `/e/${req.params.eventSlug}/invite/${token}`,
    });
  });

  // PATCH /api/admin/events/:eventSlug/guests/:guestId — update guest
  router.patch("/events/:eventSlug/guests/:guestId", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const { name, partnerName, maxExtraGuests } = req.body || {};
    const updates = [];
    const values = [];
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (partnerName !== undefined) {
      updates.push("partner_name = ?");
      values.push(partnerName || null);
    }
    if (maxExtraGuests !== undefined) {
      updates.push("max_extra_guests = ?");
      values.push(maxExtraGuests === null || maxExtraGuests === "" ? null : Number(maxExtraGuests));
    }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.guestId, eventId);
    const result = db.prepare(
      `UPDATE guests SET ${updates.join(", ")} WHERE id = ? AND event_id = ?`
    ).run(...values);
    if (result.changes === 0) return res.status(404).json({ error: "Guest not found" });
    res.json({ ok: true });
  });

  // DELETE /api/admin/events/:eventSlug/guests/:guestId
  router.delete("/events/:eventSlug/guests/:guestId", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const result = db.prepare("DELETE FROM guests WHERE id = ? AND event_id = ?").run(req.params.guestId, eventId);
    if (result.changes === 0) return res.status(404).json({ error: "Guest not found" });
    res.json({ ok: true });
  });

  // GET /api/admin/events/:eventSlug/rsvps — list RSVPs
  router.get("/events/:eventSlug/rsvps", requireEventAdmin(db), (req, res) => {
    const eventId = req.eventId;
    const rows = db.prepare(
      `SELECT id, guest_id, guest_name, partner_name, attendance, extra_guests, song1, song2, reaction, message, submission_time
       FROM rsvps WHERE event_id = ? ORDER BY submission_time DESC`
    ).all(eventId);
    res.json(rows);
  });

  // POST /api/admin/users — create user (main_admin only; for event_admin or another main_admin)
  router.post("/users", requireMainAdmin, async (req, res) => {
    const { email, password, role } = req.body || {};
    if (!email || !password || !role) return res.status(400).json({ error: "email, password, role required" });
    if (!["main_admin", "event_admin"].includes(role)) return res.status(400).json({ error: "role must be main_admin or event_admin" });
    const id = nanoid();
    const hash = await bcrypt.hash(password, 10);
    try {
      db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(id, email, hash, role);
    } catch (e) {
      if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "Email already exists" });
      throw e;
    }
    res.status(201).json({ id, email, role });
  });

  // POST /api/admin/events/:eventSlug/admins — assign event_admin to this event (main_admin only)
  router.post("/events/:eventSlug/admins", requireMainAdmin, (req, res) => {
    const event = db.prepare("SELECT id FROM events WHERE slug = ?").get(req.params.eventSlug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    try {
      db.prepare("INSERT INTO event_admins (event_id, user_id) VALUES (?, ?)").run(event.id, userId);
    } catch (e) {
      if (e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") return res.status(409).json({ error: "Already assigned" });
      throw e;
    }
    res.status(201).json({ ok: true });
  });

  return router;
}
