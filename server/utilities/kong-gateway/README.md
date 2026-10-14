# Kong gateway

Kong (3.9, PostgreSQL mode) in front of the Wiseape services.

| Route (via `http://localhost:8000`) | Service | Upstream |
|---|---|---|
| `/was`     | `WASAPI`         | WAS API `:4000` |
| `/hris`    | `HRISAPI`        | HRIS API `:4001` |
| `/report`  | `REPORTAPI`      | Report Designer API `:4002` |
| `/utilities` | `UTILITIESAPI`  | Utilities API `:4003` |
| `/event-messaging` | `EVENTMESSAGINGAPI` | Event Messaging API `:4004` |
| `/desktop` | `WISEDESKTOPAPI` | client Express server `:3000` |

Two more routes are **host-based** and exist only so the web UIs can be embedded in the app:

| Host (via `http://<host>:8000`) | Service | Upstream |
|---|---|---|
| `kong-manager.localhost` | `KONGMANAGER` | Kong Manager (`localhost:8002` inside the Kong container) |
| `kafka-ui.localhost`     | `KAFKAUI`     | Kafka UI (`host.docker.internal:8085`) |

Both UIs send `X-Frame-Options` (`sameorigin` / `DENY`), so browsers refuse to show them in an
iframe (WiseWebView). These routes remove that header (`response-transformer`). `*.localhost`
resolves to 127.0.0.1 in browsers, so each UI keeps its own origin.

Consequences to know about:
- Kong's proxy ports (8000/8443) are bound to `127.0.0.1` in `docker-compose.yml`, so these UIs
  (Kafka UI has no login) are not reachable from the network. Do not widen that without adding auth.
- `KONG_ADMIN_GUI_URL` is `http://kong-manager.localhost:8000`: the Admin API only accepts CORS calls
  from that one origin, so Kong Manager must be opened at **http://kong-manager.localhost:8000**.
  `http://localhost:8002` still serves the page but it can no longer reach the Admin API.
- The Admin API itself stays on `127.0.0.1:8001` and is NOT routed through the proxy.

All path routes use `strip_path: true` (`/hris/api/employees` reaches HRIS as `/api/employees`).
Upstream hosts are `host.docker.internal`, because Kong runs in a container.

Files: `docker-compose.yml` (Kong + its database + a one-shot decK helper),
`kong.yml` (the declarative configuration = single source of truth).

## Starting a new Kong and loading the configuration

```bash
cd server/utilities/kong-gateway
docker compose up -d                          # Kong + database (first start runs migrations)
docker compose --profile tools run --rm deck  # loads kong.yml into Kong
curl http://localhost:8000/was                # -> WAS API server info
```

`deck gateway sync` is idempotent: running it again changes nothing, and it
makes Kong match `kong.yml` exactly (**it also deletes** services/routes that are
not in the file, e.g. ones added by hand in Kong Manager).

On Linux add `extra_hosts: ["host.docker.internal:host-gateway"]` to the `kong`
service, otherwise Kong cannot reach the services running on the host.

## Changing the configuration

Edit `kong.yml` and run the `deck` command again. To see what would change first:

```bash
docker compose --profile tools run --rm deck gateway diff /config/kong.yml --kong-addr http://kong:8001
```

If you changed Kong by hand (Kong Manager / Admin API) and want to keep it, export it
back into the file instead:

```bash
docker run --rm -v "$PWD":/work -w /work kong/deck:v1.68.0 \
  gateway dump -o kong.yml --kong-addr http://host.docker.internal:8001
```
(The dump contains ids and timestamps; review it before committing.)

## Notes
- Kong's own data (DB volume `kong_data`) is separate from this file: deleting the
  volume resets Kong, and `kong.yml` restores the routes.
- The database password in `docker-compose.yml` is a development default; change it
  before using this anywhere shared.
