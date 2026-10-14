# Kong gateway

Kong (3.9, PostgreSQL mode) in front of the Wiseape services.

| Route (via `http://localhost:8000`) | Service | Upstream |
|---|---|---|
| `/was`     | `WASAPI`         | WAS API `:4000` |
| `/hris`    | `HRISAPI`        | HRIS API `:4001` |
| `/report`  | `REPORTAPI`      | Report Designer API `:4002` |
| `/desktop` | `WISEDESKTOPAPI` | client Express server `:3000` |

All routes use `strip_path: true` (`/hris/api/employees` reaches HRIS as `/api/employees`).
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
