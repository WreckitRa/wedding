# Deploy on Railway and use your own domain

This guide deploys the **full app** (frontend + API) on [Railway](https://railway.app) and connects a domain you manage elsewhere (e.g. Hostinger) to it.

---

## 1. Deploy on Railway

### 1.1 Create a project

1. Go to [railway.app](https://railway.app) and sign in (GitHub is easiest).
2. **New Project** → **Deploy from GitHub repo** and select this repository.
3. Railway will add a service. We’ll configure build and start so one service runs both the Vite frontend and the Node server.

### 1.2 Configure the service

In the service **Settings** (or **Variables**):

- **Root Directory:** leave empty (repo root).
- **Build Command:**  
  `npm run deploy:build`  
  (Installs deps, builds the frontend into `dist/`, then installs server deps in `server/`.)
- **Start Command:**  
  `npm start`  
  (Runs `node server/index.js` from repo root; the server serves `dist/` and the API.)
- **Watch Paths:** leave default so pushes to the repo trigger a new deploy.

### 1.3 Environment variables

In the same service, open **Variables** and add:

| Variable               | Required | Example / notes |
|------------------------|----------|------------------|
| `JWT_SECRET`           | Yes      | Long random string (32+ chars). |
| `MAIN_ADMIN_EMAIL`     | Yes      | Admin login email. |
| `MAIN_ADMIN_PASSWORD`  | Yes      | Admin login password. |
| `PORT`                 | No       | Railway sets this automatically. |
| `SQLITE_PATH`          | No       | Default `./data/wedding.db`. |
| `OPENAI_API_KEY`       | No       | Only if you use “Generate from words” in Theme. |

Do **not** set `VITE_API_URL`; the app is served from the same origin on Railway.

### 1.4 Persist data (SQLite + uploads)

The server uses `server/data/` for the SQLite database and uploads. So that data survives redeploys:

1. In the service, go to **Settings** → **Volumes** (or **Storage**).
2. Add a volume and mount it at:  
   `server/data`  
   (path relative to the app root).
3. Redeploy once so the DB and uploads use the volume.

### 1.5 Deploy and get the URL

1. Trigger a deploy (push to the connected branch or use **Deploy** in Railway).
2. In the service, open **Settings** → **Networking** (or **Domains**) and add a **Public URL** (e.g. **Generate domain**). You’ll get something like `your-app.up.railway.app`.
3. Open that URL; you should see the app (landing, then you can use admin and events).

---

## 2. Use your own domain (e.g. domain from Hostinger)

You keep the domain where it is (e.g. Hostinger). You only change **DNS** so the domain points to Railway.

### 2.1 Add the domain in Railway

1. In your Railway service → **Settings** → **Networking** / **Domains**.
2. Click **Custom Domain** and enter your domain, e.g. `yourdomain.com` and/or `www.yourdomain.com`.
3. Railway will show the **CNAME target** you must use (e.g. `your-app.up.railway.app` or a dedicated target like `xxx.railway.app`). Copy it.

### 2.2 Point the domain to Railway from Hostinger

In **Hostinger**: open **hPanel** → **Domains** → your domain → **DNS / Name Servers** (or **Manage DNS**).

- **For `www` (e.g. www.yourdomain.com)**  
  - Type: **CNAME**  
  - Name: `www`  
  - Target / Points to: the **exact** CNAME target Railway gave you (e.g. `your-app.up.railway.app`).  
  - TTL: 14400 or default.

- **For root (e.g. yourdomain.com)**  
  - Some registrars don’t allow a CNAME on the root. Options:
    - If Hostinger supports **CNAME flattening** or an **ALIAS/ANAME** record for `@`, use that and point it to the same Railway CNAME target.
    - Otherwise, use **only** `www.yourdomain.com` on Railway and redirect root to `www` in Hostinger if available, or add the root domain in Railway and follow the exact record type Hostinger offers for root (they may show an A record or a special CNAME).

Remove or avoid conflicting A/AAAA records for the same name you’re pointing to Railway.

### 2.3 Wait for DNS and SSL

- DNS can take from a few minutes up to 24–48 hours.
- Railway will issue an HTTPS certificate for your custom domain automatically once DNS resolves.
- In Railway, the domain will show as “Active” or “Verified” when it’s ready.

### 2.4 Optional: redirect root to www

If you only set up `www` in Railway, you can add a redirect in Hostinger (e.g. “Redirect domain” or “URL redirect”) so `yourdomain.com` → `https://www.yourdomain.com`.

---

## Checklist

- [ ] Railway project created and repo connected.
- [ ] Build: `npm run deploy:build`, Start: `npm start`.
- [ ] Variables set: `JWT_SECRET`, `MAIN_ADMIN_EMAIL`, `MAIN_ADMIN_PASSWORD`.
- [ ] Volume mounted at `server/data`.
- [ ] Public URL works (`*.up.railway.app`).
- [ ] Custom domain added in Railway; CNAME (and root if supported) set in Hostinger to Railway’s target.
- [ ] DNS propagated; HTTPS works on your domain.

---

## Env reference (server)

| Variable              | Required | Description |
|-----------------------|----------|-------------|
| `PORT`                | No       | Set by Railway. |
| `SQLITE_PATH`         | No       | Default `./data/wedding.db`. |
| `JWT_SECRET`          | Yes      | Long random string. |
| `MAIN_ADMIN_EMAIL`     | Yes      | Admin login. |
| `MAIN_ADMIN_PASSWORD`  | Yes      | Admin password. |
| `OPENAI_API_KEY`       | No       | For theme “Generate from words”. |
