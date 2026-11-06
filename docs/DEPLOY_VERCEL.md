# Deploying on Vercel (frontend + backend)

One GitHub repo, **two Vercel projects**:

| Project | Root Directory | What it is |
|---|---|---|
| `abnb-frontend` | `./` (repo root) | React + Vite dashboard |
| `abnb-backend` | `server` | Express API (runs as a serverless function) |

## 1. Backend project (create this first)
Vercel -> Add New -> Project -> `CodeCraft4/alpaca-bot` -> **Root Directory: `server`** (it detects *Express*).
Add the environment variables (Production, and Preview if you use it), same names as the local `.env`:

```
NODE_ENV=production
ALPACA_API_KEY_ID=...            ALPACA_API_SECRET_KEY=...
ALPACA_API_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_BASE_URL=https://data.alpaca.markets/v2
ALPACA_TRADING_ENV=paper         ALLOW_LIVE=false
DATABASE_URL=...                 SUPABASE_URL=...
GROQ_API_KEY=...                 ANALYSIS_PROVIDER=groq      GROQ_MODEL=openai/gpt-oss-120b
FINNHUB_API_KEY=...
TRADING_SYMBOL=ABNB              DEFAULT_PROFIT_TARGET_PCT=5   HOLDING_REVIEW_DAYS=3
AUTOMATION_ENABLED=true          AUTOMATION_DRY_RUN=false
SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=...  SMTP_PASS=...  EMAIL_FROM=...
ALERT_NOTIFICATION_EMAIL=...
NOTIONAL_TOP_UP=0.01
CRON_SECRET=<long random string>
FRONTEND_ORIGIN=https://<your-frontend>.vercel.app        (comma separate several; see step 3)
API_PUBLIC_URL=https://<this-backend>.vercel.app          (email buttons point here)
APP_URL=https://<your-frontend>.vercel.app                (links inside emails)
```

**DATABASE_URL on Vercel:** use the Supabase **transaction pooler** (port **6543**) instead of 5432, because serverless opens
many short connections:
`postgresql://postgres.<ref>:<URL-ENCODED-PASSWORD>@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`
(encode special characters in the password: `!` -> `%21`, `$` -> `%24`, `@` -> `%40`).

Deploy, then open `https://<backend>.vercel.app/api/health`. It must show `alpaca: ok, database: ok`.

## 2. Frontend project
Add New -> Project -> same repo -> **Root Directory: `./`** (Vite is detected, `vercel.json` is already in the repo).
Environment variable (the only one):

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<backend>.vercel.app`  (no trailing slash) |

Deploy. This is the "connection": the browser calls the backend at `VITE_API_URL`.
Never put keys in any `VITE_*` variable (they become public JavaScript).

## 3. Close the loop (CORS)
Copy the frontend URL (and the preview URL, if you use previews) into the backend variable `FRONTEND_ORIGIN`
(comma separated, no trailing slash), then **redeploy the backend**. Without this the browser blocks the calls (CORS error).

## 4. The automatic target-selling and review emails need a cron (IMPORTANT)
A serverless function does not run in the background, so the worker that checks targets every minute and sends the
"3 days, target not reached" emails does **not** run by itself on Vercel. Something must call
`GET /api/cron/automation` every minute. Pick one:

- **Vercel Cron** (Pro plan only for every-minute; Hobby plans allow once a day and **reject** a deployment that asks for more).
  Add to `server/vercel.json`:
  ```json
  { "crons": [{ "path": "/api/cron/automation", "schedule": "* * * * *" }] }
  ```
  Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
- **Free external pinger** (cron-job.org, UptimeRobot, GitHub Actions): call every minute
  `https://<backend>.vercel.app/api/cron/automation` with the header `Authorization: Bearer <CRON_SECRET>`
  (or the URL `...?key=<CRON_SECRET>` if the tool cannot send headers).

Without a cron, orders, sells, the dashboard and emails on order events still work, but a target that is reached will
**not** auto-sell, and the review emails will not be sent.

## 5. What behaves differently on Vercel
- **Live price stream** is a long-lived connection. A serverless function ends it after its maximum duration (about 5 minutes on
  current plans); the browser reconnects by itself and the page also falls back to polling every 5 s.
- Background work after a response (saving the order, activity log, the "order placed" email, the delayed sync) uses
  `waitUntil`, so it finishes even though the response was already sent.
- Cold starts add a few hundred ms to the first request after idle time. The functions run in a US region by default, which is
  usually **closer to Alpaca, Finnhub and Supabase** than a home connection, so orders are often faster.

## Security notes
- The backend has **no login yet**: anyone who knows the backend URL can place paper orders. Keep the URL private, or add
  authentication (Supabase Auth) before sharing it. `CRON_SECRET` only protects the cron endpoint.
- Keep `ALPACA_TRADING_ENV=paper` and `ALLOW_LIVE=false`.
- Rotate any key that was ever pasted into a chat or a ticket.
