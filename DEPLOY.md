# Deploying to Railway

The app uses **SQLite** for the database. On Railway, the container filesystem is **ephemeral**: anything not on a Volume is lost on every deploy. If you don’t point the DB to a Volume, you get a fresh (empty) database on each deploy.

## Fix: Use a persistent Volume

1. **Create a Volume** (Railway project → your service → **Variables** → **Volumes** → **Add Volume**).
2. **Mount path**: use e.g. `/data` (Railway will create this directory and persist it across deploys).
3. **Set the env var** in Railway (Variables):
   ```bash
   SQLITE_PATH=/data/wedding.db
   ```
4. Redeploy. The app will create `wedding.db` on the volume; it will persist across deploys.

After the first deploy with the volume, you’ll need to seed or recreate your admin user and events (the volume starts empty). For future deploys, the same DB file is reused.

## Other env vars (Railway Variables)

- `PORT` – set by Railway automatically; you can leave it unset.
- `JWT_SECRET` – required; use a long random string.
- `MAIN_ADMIN_EMAIL` / `MAIN_ADMIN_PASSWORD` – for the main admin login.
- Optional: `OPENAI_API_KEY` for theme palette generation; `VITE_*` vars (e.g. `VITE_API_URL`) if the frontend calls a different API URL.

## Check logs

On deploy, you should see in the logs:

```text
[DB] SQLITE_PATH from env: set
[DB] Using database at: /data/wedding.db
```

**If you see `SQLITE_PATH from env: NOT set`** even though you set it in Railway: (1) Add the variable on the **service** that runs the app (Variables for that service). (2) Name exactly `SQLITE_PATH`. (3) **Redeploy** after adding it. — If you see a path inside the project (e.g. `.../server/data/wedding.db`) and you’re on Railway, the DB is not on a volume and will reset on each deploy. Set `SQLITE_PATH` as above.

## Creating the main admin (first login)

`railway run node server/scripts/init-db.js` runs **locally** with Railway’s env, so `/data` doesn’t exist and the script fails. Use the **seed endpoint** instead so the app creates the admin on the server (where the DB volume exists).

1. In Railway **Variables**, set **SEED_MAIN_ADMIN_SECRET** to a long random string (e.g. `openssl rand -hex 24`). Keep it secret.
2. Set **MAIN_ADMIN_EMAIL** and **MAIN_ADMIN_PASSWORD** (the credentials you’ll use to log in).
3. After the first deploy, open in a browser (once):
   ```
   https://your-app.up.railway.app/api/admin/seed-main-admin?secret=YOUR_SEED_SECRET
   ```
4. You should see `{"ok":true,"message":"Main admin created. ..."}`. Then go to **/admin** and log in with that email and password.
5. (Optional) Remove **SEED_MAIN_ADMIN_SECRET** from Variables after seeding, or leave it; the endpoint only creates an admin if none exists.

## Railway CLI when a version manager shadows it

If you use asdf/mise and get "No version is set for command railway", use the npm scripts instead (they run the Homebrew `railway` binary):

- **Log in:** `npm run railway -- login`
- **Link project:** `npm run railway -- link`
