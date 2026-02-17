-- Users: main_admin can create events; event_admin can manage assigned events only
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('main_admin', 'event_admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Events: one per wedding/party; slug is used in URLs. created_by = system admin who created it; owner_id = event owner who can manage guests (defaults to created_by).
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  config TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  owner_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Event admins: which users can manage which events (for role = event_admin)
CREATE TABLE IF NOT EXISTS event_admins (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- Guests: optional; when present they get a dedicated link (token). first_opened_at = when they first opened the invite link.
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  name TEXT NOT NULL,
  partner_name TEXT,
  max_extra_guests INTEGER,
  first_opened_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, token)
);

CREATE INDEX IF NOT EXISTS idx_guests_event_token ON guests(event_id, token);

-- RSVPs: one per submission; guest_id NULL for public-link RSVPs (we store name in guest_name)
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  partner_name TEXT,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'no')),
  extra_guests INTEGER NOT NULL DEFAULT 0,
  song1 TEXT,
  song2 TEXT,
  reaction TEXT,
  message TEXT,
  submission_time TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest ON rsvps(guest_id);

-- Early access signups from the landing page (Get early access / Request access)
CREATE TABLE IF NOT EXISTS early_access_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT,
  plan TEXT,
  city TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access_leads(created_at);
