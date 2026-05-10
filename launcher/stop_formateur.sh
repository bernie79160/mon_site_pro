#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
RUN_DIR="$ROOT_DIR/.launcher/run"

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*"; }

stop_pid_file() {
  local pid_file="$1"
  local name="$2"

  if [ ! -f "$pid_file" ]; then
    return 0
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"

  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    info "Arrêt $name (PID $pid)..."
    kill "$pid" 2>/dev/null || true
  else
    warn "$name déjà arrêté."
  fi

  rm -f "$pid_file"
}

stop_pid_file "$RUN_DIR/api.pid" "API"
stop_pid_file "$RUN_DIR/frontend.pid" "Frontend"

API_PIDS="$(pgrep -f "$ROOT_DIR/backend/src/server.js" || true)"
if [ -n "$API_PIDS" ]; then
  info "Arrêt API détectée hors PID launcher..."
  while IFS= read -r pid; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done <<< "$API_PIDS"
fi

FRONT_PIDS="$(pgrep -f "python3 -m http.server 8080 --bind 0.0.0.0" || true)"
if [ -n "$FRONT_PIDS" ]; then
  info "Arrêt frontend détecté hors PID launcher..."
  while IFS= read -r pid; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done <<< "$FRONT_PIDS"
fi

kill_port_processes() {
  local port="$1"
  local found="0"

  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      if [ "$found" = "0" ]; then
        info "Arrêt des processus sur le port $port..."
        found="1"
      fi
      kill "$pid" 2>/dev/null || true
    fi
  done < <(ss -ltnp 2>/dev/null | awk -v p=":$port" '$4 ~ p {print $0}' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
}

kill_port_processes 3001
kill_port_processes 8080

if command -v docker >/dev/null 2>&1; then
  info "Arrêt PostgreSQL Docker..."
  (cd "$BACKEND_DIR" && docker compose stop postgres >/dev/null 2>&1 || true)
fi

info "✅ Arrêt terminé"
