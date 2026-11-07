# Deploying the backend (`server/`) on Railway

Railway runs the backend as a normal always-on Node process, so everything works as it does locally:
the automatic target-selling worker (every 60 s), the "3 days, target not reached" emails, and the live price stream.
**No cron job is needed** (that was only for Vercel).

## 0. The code is already on GitHub
Repo `CodeCraft4/alpaca-bot`, folder `server/`. Nothing else to push. (`.env` is git-ignored: secrets go into Railway, not into git.)

## 1. Create the service
1. Railway -> **New Project -> Deploy from GitHub repo** -> pick `CodeCraft4/alpaca-bot`.
2. Open the service -> **Settings**:
   - **Root Directory: `server`**
   - Build: automatic (Node is detected). Start command: `npm start` (also set in `server/railway.json`).
   - **Region:** a US East region (closest to Alpaca, Finnhub and your Supabase project in `ca-central-1`).
   - **Networking -> Generate Domain** -> you get `https://<name>.up.railway.app`. This is your backend URL.
3. **Variables** tab -> add (values from your local `.env`):

```
ALPACA_API_KEY_ID=...            ALPACA_API_SECRET_KEY=...
ALPACA_API_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_BASE_URL=https://data.alpaca.markets/v2
ALPACA_TRADING_ENV=paper         ALLOW_LIVE=false
DATABASE_URL=...                 SUPABASE_URL=...
ANALYSIS_PROVIDER=groq           GROQ_API_KEY=...     GROQ_MODEL=openai/gpt-oss-120b
FINNHUB_API_KEY=...
TRADING_SYMBOL=ABNB              DEFAULT_PROFIT_TARGET_PCT=5     HOLDING_REVIEW_DAYS=3
AUTOMATION_ENABLED=true          AUTOMATION_DRY_RUN=false        AUTOMATION_INTERVAL_SEC=60
SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=...  SMTP_PASS=...  EMAIL_FROM=...
ALERT_NOTIFICATION_EMAIL=...
NOTIONAL_TOP_UP=0.01
FRONTEND_ORIGIN=https://<your-frontend>.vercel.app           (comma separate several)
API_PUBLIC_URL=https://<name>.up.railway.app                 (email buttons point here)
APP_URL=https://<your-frontend>.vercel.app                   (links inside emails)
```
   - **Do not set `PORT`**: Railway injects it and the server reads it.
   - **Do not set `VERCEL`** and do not set `NODE_ENV` yourself.
   - `DATABASE_URL`: the normal Supabase **session pooler (port 5432)** is fine here (one long-lived server). Encode special
     characters in the password (`!` -> `%21`, `$` -> `%24`).
   - `CRON_SECRET` is not needed on Railway.

## 2. Check it
- Deployments tab: the build must finish and the health check (`/api/health`) must go green.
- Open `https://<name>.up.railway.app/api/health` -> `{"status":"ok","alpaca":"ok","database":"ok",...}`

## 3. Connect the frontend (Vercel)
Frontend project -> Settings -> Environment Variables -> `VITE_API_URL=https://<name>.up.railway.app` (no trailing slash) ->
**Redeploy** (Vite bakes the value in at build time). Then make sure the backend's `FRONTEND_ORIGIN` is exactly the frontend URL.

## 4. IMPORTANT: run only ONE backend
The automation worker sells when a target is hit. If two backends run against the same Supabase + Alpaca account
(for example Railway **and** your laptop, or Railway and a Vercel backend), both can try to sell the same order.
Once Railway works:
- stop the local backend (`npm start` on your PC), or set `AUTOMATION_ENABLED=false` in the local `.env`;
- delete/disable the Vercel backend project and any cron-job.org pinger that calls `/api/cron/automation`.

## 5. Optional hardening
- The backend has **no login yet**: anyone who knows the Railway URL can place paper orders. Keep the URL private or add auth
  (Supabase Auth) before sharing it.
- Keep `ALPACA_TRADING_ENV=paper` and `ALLOW_LIVE=false`.
- Rotate any key that was ever pasted into a chat.
