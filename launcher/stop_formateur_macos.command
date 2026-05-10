#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
RUN_DIR="$ROOT_DIR/.launcher/run-macos"

info() { echo "[INFO] $*"; }

stop_pid_file() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file" || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

stop_pid_file "$RUN_DIR/api.pid"
stop_pid_file "$RUN_DIR/frontend.pid"

for port in 3001 8080; do
  pids="$(lsof -t -iTCP:$port -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    info "Arret des processus sur port $port..."
    while IFS= read -r pid; do
      [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
    done <<< "$pids"
  fi
done

if command -v docker >/dev/null 2>&1; then
  info "Arret PostgreSQL Docker..."
  (cd "$BACKEND_DIR" && docker compose stop postgres >/dev/null 2>&1 || true)
fi

info "✅ Arret termine"
