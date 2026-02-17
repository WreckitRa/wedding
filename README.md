# Wedding / Event Invites & RSVP

A scalable app for creating **event links** (wedding, party, etc.) and **collecting guests**.  
Supports **main admin** (create events), **event admin** (manage one event: public link + dedicated invite links per guest), and **guest-facing** invitation + RSVP flow.

## Features

- **Main admin**: Create new events (each gets a unique slug and public URL).
- **Event admin**: Per event —
  - **Public link**: One URL anyone can open; they enter their name and RSVP.
  - **Dedicated links**: Add guests; each gets a unique invite link (`/e/:slug/invite/:token`).
- **Guest experience**: Same design for all events — welcome, invitation card, details, playlist, RSVP (with optional songs, message, reaction).

## Tech stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router.
- **Backend**: Node.js, Express, SQLite (optional swap to Postgres later).
- **Auth**: JWT (admin only); no auth for guests.

---

## Run locally

### 1. Backend (API + DB)

```bash
cd server
cp .env.example .env   # optional: set PORT, JWT_SECRET, MAIN_ADMIN_*)
npm install
npm run init-db       # creates DB + main admin user (default: admin@example.com / changeme)
npm run dev           # start API on http://localhost:3001
```

Optional: seed the sample event (e.g. raphael-christine):

```bash
SEED_SLUG=raphael-christine node scripts/seed-event.js
```

### 2. Frontend

```bash
# from project root
npm install
npm run dev           # Vite dev server (proxies /api to backend)
```

- Open **http://localhost:5173**
- **Admin**: http://localhost:5173/admin — sign in (e.g. `admin@example.com` / `changeme`), then create events and manage guests.
- **Public event page**: http://localhost:5173/e/raphael-christine (or your event slug).
- **Dedicated invite**: http://localhost:5173/e/raphael-christine/invite/:token (token from “Add guest” in event admin).

### 3. Build for production

```bash
npm run build         # frontend → dist/
cd server && npm start   # serves API + static files from ../dist if present
```

---

## Hosting on a web server

- **Single server**: Build the frontend (`npm run build`), then run the Node server. It serves the API under `/api` and the built SPA from `dist/` for all other routes. Set `PORT` and `JWT_SECRET` in the environment.
- **Separate front/back**:  
  - Deploy the Node app (e.g. Railway, Render, Fly.io) and set `VITE_API_URL` to that API base URL when building the frontend.  
  - Deploy the built frontend (e.g. Netlify, Vercel, or any static host) with client-side routing support (redirect all routes to `index.html`).
- **Database**: Default is SQLite file under `server/data/`. For scale, point `SQLITE_PATH` to a persistent volume, or replace with Postgres and update `server/db` to use it.

---

## Env vars (server)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3001`) |
| `SQLITE_PATH` | Path to SQLite DB file |
| `JWT_SECRET` | Secret for admin JWT (set in production) |
| `MAIN_ADMIN_EMAIL` | Main admin email (used by `init-db`) |
| `MAIN_ADMIN_PASSWORD` | Main admin password (used by `init-db`) |
| `OPENAI_API_KEY` | Optional; for AI-generated color palettes (theme “Generate from words”) |

### Env vars (frontend, optional)

Create a `.env` in the **project root** (next to `package.json`) for Vite:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL when different from same origin (e.g. `https://api.example.com`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional; [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) key with **Places** enabled. When set, the invitation form’s “Map link” uses in-app place search and auto-fills the link when you select a place. Without it, you get a “Find on map” link that opens Google Maps in a new tab. |

---

## URL structure

| Path | Who | Description |
|------|-----|-------------|
| `/admin` | Anyone | Admin login |
| `/admin/events` | Admin | List events, create new |
| `/admin/events/:eventSlug` | Event admin | Manage guests, view RSVPs, copy public/dedicated links |
| `/e/:eventSlug` | Guests | Public event page (enter name, then view + RSVP) |
| `/e/:eventSlug/invite/:token` | Guests | Dedicated invite (pre-filled guest name, view + RSVP) |
