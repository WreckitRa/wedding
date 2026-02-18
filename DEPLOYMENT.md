# Deployment (Railway, etc.)

## Why the database resets on deploy

The app uses **SQLite** and, by default, stores the database at `server/data/wedding.db`. On platforms like **Railway**, each deploy runs a **new container** with an **empty filesystem**. So after every push you get a fresh container and a new empty database — that’s why your DB appears to “reset”.

**Fix:** store the SQLite file on **persistent storage** and point the app at it with `SQLITE_PATH`.

---

## Railway: use a Volume

1. **Create a Volume**
   - In your Railway project, open your **service** (the app).
   - Go to **Variables** or **Settings** and find **Volumes** (or add a Volume in the dashboard).
   - Create a new Volume and **mount** it at a path, e.g. `/data`.

2. **Set the database path**
   - Add a variable:
     - **Name:** `SQLITE_PATH`
     - **Value:** `/data/wedding.db`  
     (or another path inside the mounted volume, e.g. `/data/db/wedding.db`)

3. **Redeploy**
   - Trigger a new deploy. The app will create or use the SQLite file at `/data/wedding.db`. That path lives on the Volume, so it **persists across deploys**.

After this, pushes to GitHub will redeploy the app but **not** wipe the database, because the DB file is on the Volume, not on the container’s ephemeral disk.

---

## Other env vars (Railway / production)

Set these in your Railway service **Variables**:

| Variable | Description |
|----------|-------------|
| `SQLITE_PATH` | **Required for persistence.** Path to the SQLite file (e.g. `/data/wedding.db`) on a mounted volume. |
| `PORT` | Railway usually sets this automatically. |
| `JWT_SECRET` | Strong secret for auth (e.g. 32+ random characters). |
| `MAIN_ADMIN_EMAIL` | Main admin login email. |
| `MAIN_ADMIN_PASSWORD` | Main admin password (use a strong one). |

---

## Quick checklist

- [ ] Volume created and mounted (e.g. at `/data`).
- [ ] `SQLITE_PATH` set to a path on that volume (e.g. `/data/wedding.db`).
- [ ] `JWT_SECRET`, `MAIN_ADMIN_EMAIL`, `MAIN_ADMIN_PASSWORD` set.
- [ ] Redeploy once; DB will persist on future deploys.
