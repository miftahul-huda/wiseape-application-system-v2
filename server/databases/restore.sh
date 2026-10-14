#!/usr/bin/env bash
# Restores a database from its .sql backup in this folder.
#
#   ./restore.sh hris            # was | hris | report | utilities | kong
#
# Target settings come from the application's .env (DB_HOST, DB_PORT, DB_NAME, DB_USER,
# DB_PASSWORD) -- edit/override those first if you want to restore somewhere else.
# The dumps use --clean --if-exists: restoring DROPS and recreates the tables that are in the
# dump, inside the target database. The database itself must already exist (see README.md).
set -eu
HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
APPS="$HERE/../applications"
KEY="${1:-}"

restore_app() { # <app folder>
  local env_file="$APPS/$1/.env"
  [ -f "$env_file" ] || { echo "$env_file not found"; exit 1; }
  ( set -a; . "$env_file"; set +a
    file="$HERE/${DB_NAME}.sql"
    [ -f "$file" ] || { echo "backup $file not found"; exit 1; }
    echo "Restoring ${file##*/} into '${DB_NAME}' on ${DB_HOST}:${DB_PORT:-5432} ..."
    read -r -p "This overwrites the tables of that database. Continue? [y/N] " answer
    [ "$answer" = "y" ] || { echo "Cancelled."; exit 1; }
    PGPASSWORD="${DB_PASSWORD:-}" psql --host "$DB_HOST" --port "${DB_PORT:-5432}" --username "$DB_USER" \
      --dbname "$DB_NAME" --set ON_ERROR_STOP=1 --single-transaction --quiet --file "$file" )
  echo "Done."
}

case "$KEY" in
  was)       restore_app WiseapeApplicationSystem ;;
  hris)      restore_app HRIS ;;
  report)    restore_app ReportDesigner ;;
  utilities) restore_app Utilities ;;
  kong)
    echo "Stop Kong first so it does not write while its tables are replaced:"
    echo "  (cd ../utilities/kong-gateway && docker compose stop kong)"
    read -r -p "Kong stopped and kong-db running? Continue? [y/N] " answer
    [ "$answer" = "y" ] || { echo "Cancelled."; exit 1; }
    docker exec -i kong-db psql --username kong --dbname kong --set ON_ERROR_STOP=1 --single-transaction --quiet < "$HERE/kong.sql"
    echo "Done. Start Kong again: (cd ../utilities/kong-gateway && docker compose start kong)" ;;
  *) echo "usage: ./restore.sh was|hris|report|utilities|kong"; exit 1 ;;
esac
