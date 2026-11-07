# Deploying the frontend on Vercel

This repo (`alpaca-bot`) is **only the dashboard** (React + Vite). The backend is a separate repo, `alapaca-server`, deployed on
Railway (see the README of that repo). The two are connected by one variable.

## 1. Import the project
Vercel -> Add New -> Project -> `CodeCraft4/alpaca-bot`
- Framework Preset **Vite**, Root Directory **`./`**, Build Command `npm run build`, Output Directory `dist` (`vercel.json` already says this).

## 2. Environment variables: ONLY ONE
Settings -> Environment Variables (Production **and** Preview):

| Name | Value |
|---|---|
| `VITE_API_URL` | your backend URL, e.g. `https://alapaca-server-production.up.railway.app` (no trailing slash) |

**Do not add anything else.** In particular:
- Do **not** paste the backend `.env` here. The frontend needs no keys, and `NODE_ENV=development` in Vercel turns the site into a
  slow development build whose API check misbehaves.
- Never put secrets in a `VITE_*` variable: Vite copies them into the public JavaScript.

After changing a variable, **Redeploy** (Vite bakes `VITE_API_URL` into the JavaScript at build time).

## 3. Backend side
The backend variable `FRONTEND_ORIGIN` must be exactly this site's URL (e.g. `https://alpaca-bot-drab.vercel.app`, no trailing slash),
otherwise the browser blocks the calls (CORS).

## Troubleshooting
- **Red banner "Cannot reach the backend: Backend URL is not set"** -> `VITE_API_URL` is missing; add it and redeploy.
- **"The backend did not answer with JSON (HTTP 200)"** -> `VITE_API_URL` is missing/wrong, so `/api/...` hit Vercel itself. Also check that no
  `NODE_ENV` variable exists in the Vercel project.
- **CORS error in the browser console** -> fix `FRONTEND_ORIGIN` on the backend and redeploy the backend.
- **"Mixed Content"** -> the backend URL must be `https://`.
- Check the backend directly: `https://<backend>/api/health` must show `alpaca: ok, database: ok`.
