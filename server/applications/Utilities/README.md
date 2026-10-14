# Wiseape Utilities API

Express + Sequelize + PostgreSQL service storing links to external admin tools (Kong Manager, Kafka Manager). Default port **4003**.

## Run
    cp .env.example .env   # fill in DB credentials
    npm install
    npm run dev            # or: npm start

On startup the service connects to PostgreSQL; if the database does not exist it tries to create it through the `postgres` maintenance database (requires CREATEDB, otherwise it stops with a message). Tables are created with `sequelize.sync()` and seeds are applied for any type that has no links yet (Kong Manager (local) -> http://localhost:8002, Kafka UI (local) -> http://localhost:8085).

## Environment variables
| Var | Description |
|---|---|
| `DB_HOST`, `DB_PORT` | PostgreSQL host / port |
| `DB_NAME` | Database name (default `wise-utilities`) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password (required, no default) |
| `PORT` | HTTP port (default 4003) |
| `DB_LOGGING` | `true` to log SQL |

## Endpoints
Success: `{success:true,data}`; errors: `{success:false,message}` (400 validation, 404 not found, 409 duplicate type+name, 500).

- `GET /` server info; `GET /api` endpoint index
- `GET /api/link-types` -> kong_manager, kafka_manager
- `GET /api/links?type=` list (default first, then name); invalid type -> 400
- `GET /api/links/:id`
- `POST /api/links` body `{type,name,url,description,isDefault}`; url must be http/https
- `PUT /api/links/:id` body `{name,url,description,isDefault}` (type cannot change)
- `DELETE /api/links/:id`

Only one link per type can be the default; saving a link with `isDefault: true` clears the flag on the others of that type.
