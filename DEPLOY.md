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
[DB] Using database at: /data/wedding.db
```

If you see a path inside the project (e.g. `.../server/data/wedding.db`) and you’re on Railway, the DB is not on a volume and will reset on each deploy. Set `SQLITE_PATH` as above.
