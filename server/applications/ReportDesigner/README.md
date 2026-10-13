# Wiseape Report Designer - Backend

Express REST API (Node.js, CommonJS) that stores report definitions in a PostgreSQL metadata database (`pg`, no ORM) and runs reports against user-defined PostgreSQL, MySQL or SQL Server connections.

## Run

```
cp .env.example .env   # fill in values
npm install
npm run dev            # node --watch --env-file=.env app.js
npm start              # node --env-file=.env app.js
```

Tables (`rd_database_types`, `rd_connections`, `rd_report_groups`, `rd_reports`) are created idempotently on startup, and database types are seeded.

## Environment variables (`.env`, never committed)

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Metadata PostgreSQL database |
| `PORT` | HTTP port (default 4002) |
| `CONNECTION_SECRET` | 32+ random bytes (hex). Key source for AES-256-GCM encryption of stored connection passwords. Changing it makes stored passwords unreadable. |

## Endpoints (all JSON: `{success, data}` or `{success:false, message}`)

- `GET /api` - endpoint index
- `GET /api/database-types`
- `GET|POST /api/connections`, `GET|PUT|DELETE /api/connections/:id` (DELETE returns 409 if reports use it; passwords are never returned, only `hasPassword`; an empty/omitted password on PUT keeps the stored one)
- `POST /api/connections/test` (optional `id` reuses stored password; returns `{ok,message}` with HTTP 200 even on bad credentials)
- `GET /api/connections/:id/tables`
- `GET /api/connections/:id/columns?table=schema.name`
- `POST /api/connections/:id/query-columns` body `{query}`
- `GET|POST /api/report-groups`, `GET|PUT|DELETE /api/report-groups/:id` (DELETE 409 unless `?force=true`)
- `GET /api/report-groups/:id/reports`
- `GET|POST /api/reports` (`?groupId=`), `GET|PUT|DELETE /api/reports/:id`
- `GET /api/reports/:id/data` and `POST /api/reports/preview` -> `{columns, rows, sql, chart}`

## Security notes

- Custom queries must be a single read-only `SELECT`/`WITH` statement; comments are stripped and DML/DDL keywords are rejected.
- Table and column names are validated against the target database's catalog and always quoted per dialect; aggregates are whitelisted (`sum, avg, count, min, max, count_distinct`).
- Row limit is always applied (`LIMIT`/`TOP`) and capped at 5000. Connection timeout ~8s, statement timeout ~30s.
- Note: for SQL Server, custom queries containing a top-level `ORDER BY` without `TOP` are rejected by the server when used as a subquery.
