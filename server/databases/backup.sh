#!/usr/bin/env bash
# Backs up every Wiseape PostgreSQL database to plain .sql files in this folder.
#
#   ./backup.sh            # all databases
#   ./backup.sh hris       # one: was | hris | report | utilities | kong
#
# Connection settings are read from each application's own .env (DB_HOST, DB_PORT, DB_NAME,
# DB_USER, DB_PASSWORD), so no credentials live in this script. Needs `pg_dump` (version >= the
# server's, i.e. PostgreSQL 17 client tools for a 17 server) and, for Kong, a running `kong-db`
# container. See README.md for restoring.
#
# Session tokens (wiseape_sessions) are deliberately NOT dumped: they are live credentials and are
# worthless after a restore anyway (users just log in again).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
APPS="$HERE/../applications"

declare -a FAILED=()

# pg_dump 17 writes settings that servers older than 17 (the Wiseape server is PostgreSQL 15)
# reject, which would abort a restore -- drop them so the dump restores on PostgreSQL >= 13.
strip_newer_settings() {
  grep -v -e '^SET transaction_timeout' -e '^\\restrict ' -e '^\\unrestrict ' "$1" > "$1.tmp" && mv "$1.tmp" "$1"
}

# dump_app <label> <app folder> [extra pg_dump args]   -- uses that app's .env
dump_app() {
  local label="$1" dir="$APPS/$2" env_file="$APPS/$2/.env"
  shift 2
  if [ ! -f "$env_file" ]; then echo "[$label] SKIP: $env_file not found"; FAILED+=("$label"); return; fi
  (
    set -a; . "$env_file"; set +a
    out="$HERE/${DB_NAME}.sql"
    echo "[$label] dumping database '${DB_NAME}' from ${DB_HOST}:${DB_PORT:-5432} ..."
    PGPASSWORD="${DB_PASSWORD:-}" pg_dump --host "$DB_HOST" --port "${DB_PORT:-5432}" --username "$DB_USER" \
      --dbname "$DB_NAME" --no-owner --no-privileges --clean --if-exists --format plain "$@" --file "$out" \
      && strip_newer_settings "$out" \
      && echo "[$label] -> ${out##*/} ($(wc -c < "$out" | tr -d ' ') bytes)"
  ) || { echo "[$label] FAILED"; FAILED+=("$label"); }
}

# Kong's own database lives in the kong-db container (server/utilities/kong-gateway).
dump_kong() {
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx kong-db; then
    echo "[kong] SKIP: container kong-db is not running"; FAILED+=("kong"); return
  fi
  echo "[kong] dumping database 'kong' from container kong-db ..."
  docker exec kong-db pg_dump --username kong --dbname kong --no-owner --no-privileges --clean --if-exists \
    > "$HERE/kong.sql" && echo "[kong] -> kong.sql ($(wc -c < "$HERE/kong.sql" | tr -d ' ') bytes)" \
    || { echo "[kong] FAILED"; FAILED+=("kong"); }
}

TARGET="${1:-all}"
case "$TARGET" in all|was)       dump_app was WiseapeApplicationSystem --exclude-table-data=wiseape_sessions ;; esac
case "$TARGET" in all|hris)      dump_app hris HRIS ;; esac
case "$TARGET" in all|report)    dump_app report ReportDesigner ;; esac
case "$TARGET" in all|utilities) dump_app utilities Utilities ;; esac
case "$TARGET" in all|kong)      dump_kong ;; esac

[ ${#FAILED[@]} -eq 0 ] && { echo "Done."; exit 0; }
echo "Failed/skipped: ${FAILED[*]}"; exit 1
