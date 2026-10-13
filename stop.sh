#!/usr/bin/env bash
# Menghentikan semua aplikasi Wiseape yang dijalankan oleh start.sh.
# Pemakaian: ./stop.sh [-f]   (-f = paksa dengan SIGKILL)

SIG="TERM"; [ "${1:-}" = "-f" ] && SIG="KILL"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PORTS=(3000 4000 4001 4002 5173)   # client, WAS API, HRIS API, Report Designer API, Vite

# 1) Hentikan start.sh yang masih berjalan (agar trap-nya ikut membersihkan child)
for pid in $(pgrep -f "$ROOT/start.sh|[ /]start.sh" 2>/dev/null); do
  [ "$pid" != "$$" ] && kill "-$SIG" "$pid" 2>/dev/null
done

# 2) Hentikan proses yang listen di port-port aplikasi beserta parent-nya
#    (node --watch / npm run adalah parent dari proses yang memegang port)
pids=()
for port in "${PORTS[@]}"; do
  for pid in $(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null); do
    pids+=("$pid")
    ppid=$(ps -o ppid= -p "$pid" | tr -d ' ')
    if [ -n "$ppid" ] && ps -o command= -p "$ppid" | grep -Eq 'node|npm|vite'; then
      pids+=("$ppid")
    fi
    echo "port $port -> PID $pid"
  done
done

if [ ${#pids[@]} -eq 0 ]; then
  echo "Tidak ada aplikasi Wiseape yang berjalan."
else
  # urutkan unik, hentikan parent dulu agar watcher tidak me-restart child
  for pid in $(printf '%s\n' "${pids[@]}" | sort -un); do
    kill "-$SIG" "$pid" 2>/dev/null
  done
  sleep 1
  for port in "${PORTS[@]}"; do
    lsof -ti tcp:"$port" -sTCP:LISTEN >/dev/null 2>&1 && echo "Port $port masih aktif — coba: ./stop.sh -f"
  done
  echo "Selesai."
fi
