# ALPHACA-ABNB: Backend Integration Plan

Rule: **one phase at a time**. Har phase ke end par tests pass hon aur tum approve karo, tab agla shuru.
Status: `[ ]` todo, `[~]` in progress, `[x]` done.

## Current state (baseline)
- Frontend-only React/Vite app. Dummy data removed (types in `src/types/trading.ts`).
- `src/services/alpacaService.ts` already exists and calls Alpaca **directly from the browser** (keys in the `VITE_` bundle). It is untested.
- No backend, no database, no auth, no tests, no git.

## Architecture decision (Phase 1 decides this)
Alpaca secret keys must not live in the browser. Target:

```
React UI  ->  small backend (Node/Express or Hono)  ->  Alpaca API
                         |-> Supabase (history, settings)
                         |-> Email/Discord (alerts)
                         |-> scheduler (auto exit, reviews)
```
Paper trading ke liye browser-direct chal jata hai, isliye Phase 2-3 pehle bina backend ke verify honge. Phase 1 mein hum backend proxy banate hain taake live trading kabhi unsafe na ho.

---

## Phase 0: Safety net `[ ]`
- `git init`, first commit, `.env` ignored confirm.
- Install **Vitest** (+ Testing Library, MSW for API mocking). Add `npm test`.
- Fix the 3 placeholders: `187.56` price, `100.0` cash, hardcoded "Connected" badges, hardcoded email default.
- **Test:** `npm run build`, `npm test` (smoke test: app renders), lint clean.
- **Needs from you:** nothing.

## Phase 1: Backend proxy + secrets `[ ]`
- `server/` folder (Express/Hono, TypeScript). Keys move to server-only `.env` (no `VITE_` prefix).
- Routes: `GET /api/health`, then thin pass-through routes for Alpaca (added per phase).
- Frontend calls `/api/*` via Vite proxy; `alpacaService.ts` switches from Alpaca URL to our API.
- Hard guard: server refuses live URL unless `ALPACA_TRADING_ENV=live` AND `ALLOW_LIVE=true`.
- **Test:** unit test for env guard; `curl /api/health`; confirm no secret in `dist/` bundle (grep).
- **Needs from you:** nothing new (we rename existing vars).

## Phase 2: Account + connection status `[ ]`
- `GET /api/account` -> equity, cash, buying power, account status.
- Replace hardcoded sidebar "Connected" badges with real status (Alpaca ok / DB ok).
- **Test:** mocked-Alpaca unit tests (ok, 401 bad key, network down); manual check against real paper account.
- **Needs:** valid `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY` (paper).

## Phase 3: Market data (live ABNB price + chart) `[ ]`
- Latest price, daily change, market clock (open/closed), bars for 1D/1W/1M/3M/1Y.
- Polling first; WebSocket stream later (optional, Phase 3b).
- **Test:** timeframe -> correct Alpaca params; empty-bars handling; market-closed state; manual visual check.
- **Needs:** `ALPACA_DATA_BASE_URL`, feed = `iex` (free). Confirm you do not have paid SIP.

## Phase 4: Positions + Overview numbers `[ ]`
- `GET /api/positions` mapped to `OpenPosition`. Equity, unrealized/realized P/L from real data.
- **Test:** mapping tests (fractional qty, short, zero positions); Overview renders empty + populated.
- **Needs:** nothing new. (Place 1 small paper buy manually in Alpaca dashboard to have data.)

## Phase 5: Orders: read + place + cancel `[ ]`
- List orders, place market/limit (qty or dollar amount), cancel.
- Server-side validation: symbol whitelist (ABNB), daily investment limit, `manualBuyOnly`, kill switch.
- Bracket orders for profit target / stop loss (Alpaca-native) instead of faking in the UI.
- **Test:** validation unit tests (limit exceeded, kill switch on, market closed); integration test against paper API; manual UI run of New/Cancel/Edit modals.
- **Needs:** nothing new.

## Phase 6: Sell / close position `[ ]`
- Close position via Alpaca, record exit reason (manual / target / stop).
- **Test:** close full + partial; closing non-existent position; UI confirmation modal.

## Phase 7: Persistence (Supabase) `[ ]`
- Tables: `settings`, `trades` (completed), `activity_log`, `orders_cache`.
- Settings page reads/writes DB (currently resets on refresh). Trade History reads DB.
- Sync job: pull filled orders from Alpaca -> build completed trades (entry/exit pairing, P/L).
- **Test:** migration applies cleanly; trade-pairing unit tests (partial fills, multiple buys); settings round-trip.
- **Needs:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only).

## Phase 8: Trade History + stats `[ ]`
- Filters, pagination, P/L chart, distribution, win rate from DB data.
- **Test:** stats math tests (win rate, avg win/loss, profit factor) with known fixtures.

## Phase 9: Automation engine `[ ]`
- Scheduler on server: check positions, auto profit-target exit, auto stop-loss exit, holding-period review, emergency kill switch.
- Respect settings toggles; every action logged to `activity_log`.
- **Test:** time-mocked unit tests for each rule; dry-run mode first (logs only), then paper execution.
- **Needs:** where to host the worker (Railway? your local machine?).

## Phase 10: Notifications `[ ]`
- Email for target/stop/manual sell/rejected/daily summary, per settings toggles.
- **Test:** template rendering tests; send test email to your address; toggle off = no send.
- **Needs:** email provider key (Resend / SMTP) + sender address; optional Discord/Telegram webhook.

## Phase 11: AI Market Analysis `[ ]`
- Server calls Claude API with recent bars/news -> sentiment, confidence, summary. Cached (e.g. 15 min).
- Always shows disclaimer; never triggers trades.
- **Test:** schema validation of model output; fallback when API fails; cache hit test.
- **Needs:** `ANTHROPIC_API_KEY`.

## Phase 12: Auth + hardening `[ ]`
- Login (Supabase Auth), protect `/api/*`, rate limiting, CORS, error boundaries, deploy.
- **Test:** unauthenticated request -> 401; end-to-end smoke (Playwright) on core flow.
- **Needs:** deploy target decision.

---

## `.env` summary (what I need from you, by phase)
| Phase | Variable | Where |
|---|---|---|
| 2 | `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY` (paper) | server `.env` |
| 3 | Confirm data feed = IEX | none |
| 7 | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server `.env` |
| 10 | Email provider key + from-address | server `.env` |
| 11 | `ANTHROPIC_API_KEY` | server `.env` |

Never paste real keys in chat; just put them in `.env` and tell me the variable name is set.

## Working agreement
- I implement exactly one phase per instruction, then run its tests and report pass/fail honestly.
- No live-money trading code path is enabled until you say so explicitly.
