# Running Wiseape Application System (WAS)

WAS now runs as **two separate processes**:

| Process | Location | Port | Role |
|---|---|---|---|
| **Server** (REST API) | `server/applications/WiseapeApplicationSystem/` | `4000` | Postgres access, business logic, control-event dispatch. No UI. |
| **Client** (frontend) | `client/` | `3000` | Static desktop UI. Talks to the server over HTTP/CORS. |

They are independent Node/Express apps with their own `package.json`, `.env`, and `node_modules` — install and run each separately. Start the **server first** (the client will still boot with the server down, but every desktop icon/app fetch will fail until it's up).

## Prerequisites

- Node.js 18+ (uses `node --env-file=.env`, no `dotenv` package needed)
- Network access to the PostgreSQL database used by `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`

## 1. Run the server (REST API)

```bash
cd server/applications/WiseapeApplicationSystem
npm install
```

Create `.env` (copy `.env.example` and fill in real values):

```bash
cp .env.example .env
```

```
DB_HOST=your-postgres-host
DB_NAME=wiseape-application-system
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_PORT=5432
PORT=4000
```

Start it:

```bash
npm run dev     # node --watch --env-file=.env app.js -- restarts on file changes
# or
npm start       # node --env-file=.env app.js -- no auto-restart
```

You should see:

```
Wiseape Application System REST API running on http://localhost:4000
```

Verify it's actually answering:

```bash
curl http://localhost:4000/api/apps
curl http://localhost:4000/api/menus
```

## 2. Run the client (frontend)

In a **second terminal**:

```bash
cd client
npm install
```

Create `.env` (copy `.env.example` and adjust if needed):

```bash
cp .env.example .env
```

```
PORT=3000
API_BASE_URL=http://localhost:4000
```

`API_BASE_URL` must point at wherever the server from step 1 is actually reachable (same value it printed on startup). Start it:

```bash
npm run dev     # node --watch --env-file=.env app.js
# or
npm start
```

You should see:

```
Wiseape Application System running on http://localhost:3000
```

Open **http://localhost:3000** in a browser, register/log in, and use the desktop as normal.

## How the two talk to each other

The browser **never** talks to the REST API server (port 4000) directly —
it only ever calls the client's own routes on port 3000. `API_BASE_URL` is
read purely server-side, inside the *client* Node process
(`process.env.API_BASE_URL`, consumed by the `Api*Repository` classes in
`client/system/`), and is never exposed to the browser — there's no
`/config.js` route or `window.*` global carrying it.

- The browser fetches its own data (`/api/apps`, `/api/menus`, `/api/themes`,
  `/api/auth/*`, `/api/applications/run`, `/api/applications/:appId/events`,
  `/app-assets/:appId/icon.svg`) from `client/app.js` on **port 3000**.
- `client/app.js` — server-side, in the client process — then forwards
  whatever it needs to the REST API on port 4000, via the `Api*Repository`
  classes, using `API_BASE_URL` to know where to send it.
- The REST API has `cors()` enabled with default (wide-open) settings, but
  since nothing in the browser calls it directly, this mainly just makes it
  convenient to hit the REST API from `curl`/Postman/etc. during development.
- Login/session/control-event calls from the browser send
  `Authorization: Bearer <token>` to the **client**, which re-validates it
  against the REST API's `/session` endpoint on every single request (it
  does not cache who you are between requests) — see
  `client/app.js#resolveSession`.

## Running both on one machine, quickly

```bash
# terminal 1
cd server/applications/WiseapeApplicationSystem && npm run dev

# terminal 2
cd client && npm run dev
```

## Troubleshooting

- **"Could not reach the server" on the login screen** — the server isn't running, or `API_BASE_URL` in `client/.env` doesn't match the port/host the server is actually listening on. Restart the client after changing `.env` (env vars are only read at process start).
- **Port already in use** — another `node --env-file=.env app.js` from a previous session is still running. Find and stop it: `pkill -f "node --env-file=.env app.js"`, or change `PORT` in the relevant `.env`.
- **CORS error in the browser console** — confirm you're hitting the server's real port in `API_BASE_URL`; the server allows all origins by default, so this usually means the URL itself is wrong (typo, wrong port, `http` vs `https`).
- **"Application X not found" on launch** — there's no row for that `appId`
  in the `wiseape_apps` table (or it wasn't returned by `/api/apps`). There
  is no separate app registry file to update — any row whose
  `app_start_point` (e.g. `applications/Notes/AppNotes.js:AppNotes`) points
  at a real, `require()`-able file/class in `client/applications/` works
  automatically; `client/system/WiseApplicationSystem.js#resolveApplicationClass`
  loads it directly from that column at launch time.
- **App icon shows the fallback glyph instead of the real icon** — the file
  isn't at `client/applications/<AppName>/assets/icons/icon.svg` (checked via
  `GET /app-assets/:appId/icon.svg`), or the folder doesn't match the app's
  `app_start_point`. This is expected/harmless — the fallback glyph from the
  database is deliberately what shows until the real file is confirmed to load.
- **Database connection errors on server start** — double check `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_PORT` in `server/applications/WiseapeApplicationSystem/.env`; the server needs direct network access to that Postgres instance.
