# Deploying the frontend on Vercel

The **frontend** (React + Vite, repo root) goes on Vercel. The **backend** (`server/`, Express on port 4555) is a long-running
process (live price stream, 60-second automation worker, email) so it can NOT run on Vercel's serverless functions. Host it on an
always-on service (Railway, Render, Fly.io, a VPS) over **HTTPS**.

## 1. Import the project in Vercel
1. Vercel Dashboard -> **Add New... -> Project** -> import the GitHub repo `CodeCraft4/alpaca-bot`.
2. Settings (Vercel reads `vercel.json`, these should already be filled):
   - Framework Preset: **Vite**
   - Root Directory: **`./`** (the repo root; do NOT pick `server/`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables** (Production + Preview):

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | your backend's public HTTPS URL, e.g. `https://abnb-backend.up.railway.app` (no trailing slash) |

   `VITE_API_URL` is the **only** variable the frontend needs. It is just a URL. Never put keys or passwords in any `VITE_*` variable:
   Vite copies them into the public JavaScript.
4. Deploy. `vercel.json` rewrites every path to `index.html`, so page refreshes on `/orders`, `/history`, `/settings` work.

## 2. Backend (separate host)
Run `server/` on an always-on host and set these there (same names as the local `.env`, see `.env.example`):

- `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`, `ALPACA_API_BASE_URL`, `ALPACA_TRADING_ENV=paper`
- `DATABASE_URL` (Supabase session pooler string), `SUPABASE_URL`
- `GROQ_API_KEY`, `ANALYSIS_PROVIDER=groq`, `FINNHUB_API_KEY`
- `SMTP_*`, `EMAIL_FROM`, `ALERT_NOTIFICATION_EMAIL`
- `AUTOMATION_ENABLED=true`, `AUTOMATION_DRY_RUN=false`
- **`FRONTEND_ORIGIN`** = your Vercel URL(s), comma separated, e.g.
  `https://alpaca-bot.vercel.app,https://alpaca-bot-git-main-yourname.vercel.app`
  (CORS: the browser is only allowed to call the backend from these origins.)
- **`API_PUBLIC_URL`** = the backend's public URL (email buttons "Edit target / Wait / Sell" point here).
- `APP_URL` = your Vercel URL (the "Open dashboard" buttons in emails).

Start command: `npm install && npm run start` inside `server/` (uses `tsx`; or `npm run migrate` once for the database).

## 3. Check it works
- Open `https://<backend>/api/health` -> `{"status":"ok", "alpaca":"ok", "database":"ok", ...}`
- Open the Vercel site -> Settings page -> *System Status* shows Backend / Alpaca / Supabase as connected.
- If the dashboard is empty and the browser console shows a CORS error, `FRONTEND_ORIGIN` on the backend does not include the exact Vercel URL.
- If it shows "Mixed Content", the backend is on `http://`. It must be `https://`.

## Security notes
- The backend has **no login yet**. Anyone who knows the backend URL can place paper orders. Before sharing the URL publicly add
  authentication (Supabase Auth) or keep the URL private.
- Keep `ALPACA_TRADING_ENV=paper` and `ALLOW_LIVE=false` until auth exists.
