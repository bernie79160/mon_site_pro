#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
STATE_DIR="$ROOT_DIR/.launcher"
LOG_DIR="$STATE_DIR/logs"
RUN_DIR="$STATE_DIR/run-macos"

mkdir -p "$LOG_DIR" "$RUN_DIR"

info() { echo "[INFO] $*"; }
err() { echo "[ERREUR] $*" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Commande manquante: $1"
    exit 1
  fi
}

is_port_open() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

start_bg() {
  local name="$1"
  local pid_file="$2"
  shift 2
  nohup "$@" >"$LOG_DIR/${name}.log" 2>&1 &
  echo $! > "$pid_file"
}

info "Verification des prerequis..."
require_cmd docker
require_cmd npm
require_cmd node
require_cmd python3
require_cmd lsof

if ! docker info >/dev/null 2>&1; then
  err "Docker ne repond pas. Ouvrez Docker Desktop puis relancez."
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
  info "Copie de .env.example vers .env"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  info "Installation des dependances backend..."
  (cd "$BACKEND_DIR" && npm install)
fi

info "Demarrage PostgreSQL (Docker)..."
(cd "$BACKEND_DIR" && docker compose up -d postgres)

info "Synchronisation Prisma (generate + migrate deploy)..."
(cd "$BACKEND_DIR" && npx prisma generate >/dev/null)
(cd "$BACKEND_DIR" && npx prisma migrate deploy >/dev/null || true)

if is_port_open 3001; then
  info "API deja active sur 3001."
else
  info "Demarrage API Fastify..."
  (cd "$BACKEND_DIR" && start_bg "api-macos" "$RUN_DIR/api.pid" npm run start)
fi

if is_port_open 8080; then
  info "Interface web deja active sur 8080."
else
  info "Demarrage interface web..."
  (cd "$ROOT_DIR" && start_bg "frontend-macos" "$RUN_DIR/frontend.pid" python3 -m http.server 8080 --bind 0.0.0.0)
fi

sleep 1

if ! is_port_open 3001; then
  err "API indisponible (voir $LOG_DIR/api-macos.log)"
  exit 1
fi

if ! is_port_open 8080; then
  err "Interface indisponible (voir $LOG_DIR/frontend-macos.log)"
  exit 1
fi

info "✅ Serveur central demarre"
info "- Interface locale: http://localhost:8080"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -n "$LAN_IP" ]; then
  info "- Interface eleves: http://${LAN_IP}:8080"
fi
info "- API: http://localhost:3001"

open "http://localhost:8080" || true
