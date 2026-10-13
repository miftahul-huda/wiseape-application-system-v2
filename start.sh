#!/usr/bin/env bash
# Menjalankan semua aplikasi Wiseape (server + client).
#
# Pemakaian:
#   ./start.sh [semua|server|client|was|hris|vite] [--prod]
#
#   semua   (default) WAS API + HRIS API + client Express + Vite dev
#   server  WAS API + HRIS API
#   client  client Express + Vite dev
#   was     hanya WiseapeApplicationSystem API   (port 4000)
#   hris    hanya HRIS API                       (port 4001)
#   vite    hanya Vite dev server                (port 5173)
#   --prod  pakai "npm start" (tanpa watch) dan tanpa Vite
#
# Tekan Ctrl+C untuk menghentikan semuanya.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

TARGET="semua"
MODE="dev"
for arg in "$@"; do
  case "$arg" in
    --prod) MODE="start" ;;
    semua|all|server|client|was|hris|vite) TARGET="$arg" ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Argumen tidak dikenal: $arg"; exit 1 ;;
  esac
done

PIDS=()

run() { # run <nama> <direktori> <perintah npm...>
  local name="$1" dir="$2"; shift 2
  if [ ! -d "$dir/node_modules" ]; then
    echo "[$name] node_modules belum ada, menjalankan npm install..."
    (cd "$dir" && npm install) || { echo "[$name] npm install gagal"; return; }
  fi
  echo "[$name] mulai -> log: .logs/$name.log"
  (cd "$dir" && exec "$@") >"$LOG_DIR/$name.log" 2>&1 &
  PIDS+=($!)
}

wait_port() { # wait_port <nama> <port> [detik]
  local name="$1" port="$2" max="${3:-60}" i=0
  printf "[%s] menunggu port %s" "$name" "$port"
  while ! (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; do
    i=$((i+1))
    if [ "$i" -ge "$max" ]; then echo " -> timeout (lanjut)"; return 1; fi
    printf "."; sleep 1
  done
  echo " siap"
}

cleanup() {
  echo; echo "Menghentikan semua proses..."
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null; done
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM

WAS="$ROOT/server/applications/WiseapeApplicationSystem"
HRIS="$ROOT/server/applications/HRIS"
CLIENT="$ROOT/client"

case "$TARGET" in
  semua|all|server|was) run was  "$WAS"  npm run "$MODE" ;;
esac
case "$TARGET" in
  semua|all|server|hris) run hris "$HRIS" npm run "$MODE" ;;
esac
# Client membutuhkan WAS API (4000) saat startup; tunggu dulu agar tidak ECONNREFUSED.
case "$TARGET" in
  semua|all|server|was) wait_port was 4000 ;;
esac
case "$TARGET" in
  semua|all|server|hris) wait_port hris 4001 ;;
esac
case "$TARGET" in
  semua|all|client) run client "$CLIENT" npm run "$MODE" ;;
esac
if [ "$MODE" = "dev" ]; then
  case "$TARGET" in
    semua|all|client) wait_port client 3000 ;;
  esac
  case "$TARGET" in
    semua|all|client|vite) run vite "$CLIENT" npm run dev:web ;;
  esac
fi

[ ${#PIDS[@]} -eq 0 ] && { echo "Tidak ada proses yang dijalankan."; exit 1; }

cat <<EOF

Berjalan:
  WAS API   http://localhost:4000
  HRIS API  http://localhost:4001
  Client    http://localhost:3000
  Vite      http://localhost:5173
Log: $LOG_DIR/*.log   |   Ctrl+C untuk berhenti
EOF

tail -n 0 -F "$LOG_DIR"/*.log &
PIDS+=($!)
wait
