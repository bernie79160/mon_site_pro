#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
STATE_DIR="$ROOT_DIR/.launcher"
LOG_DIR="$STATE_DIR/logs"
RUN_DIR="$STATE_DIR/run"

mkdir -p "$LOG_DIR" "$RUN_DIR"

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*"; }
err()  { echo "[ERREUR] $*" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Commande manquante: $1"
    exit 1
  fi
}

is_port_open() {
  local port="$1"
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq ":${port}$"
}

start_background() {
  local name="$1"
  local pid_file="$2"
  shift 2

  nohup "$@" >"$LOG_DIR/${name}.log" 2>&1 &
  echo $! > "$pid_file"
}

info "Vérification des prérequis..."
require_cmd docker
require_cmd npm
require_cmd node
require_cmd python3
require_cmd ss

if ! docker info >/dev/null 2>&1; then
  err "Docker est installé mais le daemon ne répond pas. Ouvrez Docker puis relancez."
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
  info "Fichier .env absent, copie depuis .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  info "Installation dépendances backend..."
  (cd "$BACKEND_DIR" && npm install)
fi

info "Démarrage PostgreSQL (Docker)..."
(cd "$BACKEND_DIR" && docker compose up -d postgres)

info "Attente de PostgreSQL..."
ready=0
for _ in $(seq 1 30); do
  if docker exec mon_site_pro_postgres pg_isready -U postgres -d mon_site_pro >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  warn "PostgreSQL n'a pas confirmé sa disponibilité à temps (on continue)."
fi

info "Synchronisation Prisma (generate + migrate deploy)..."
(cd "$BACKEND_DIR" && npx prisma generate >/dev/null)
(cd "$BACKEND_DIR" && npx prisma migrate deploy >/dev/null || true)

if is_port_open 3001; then
  info "API déjà active sur le port 3001."
else
  info "Démarrage API Fastify..."
  (
    cd "$BACKEND_DIR"
    start_background "api" "$RUN_DIR/api.pid" npm run start
  )
fi

if is_port_open 8080; then
  info "Serveur web déjà actif sur le port 8080."
else
  info "Démarrage interface web..."
  (
    cd "$ROOT_DIR"
    start_background "frontend" "$RUN_DIR/frontend.pid" python3 -m http.server 8080 --bind 0.0.0.0
  )
fi

sleep 1

if ! is_port_open 3001; then
  err "API non accessible sur le port 3001. Consultez: $LOG_DIR/api.log"
  exit 1
fi

if ! is_port_open 8080; then
  err "Interface non accessible sur le port 8080. Consultez: $LOG_DIR/frontend.log"
  exit 1
fi

LOCAL_URL="http://localhost:8080"
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
LAN_URL=""
if [ -n "$LAN_IP" ]; then
  LAN_URL="http://${LAN_IP}:8080"
fi

info "✅ Serveur central démarré"
info "- Interface locale : $LOCAL_URL"
if [ -n "$LAN_URL" ]; then
  info "- Interface élèves : $LAN_URL"
fi
info "- API : http://localhost:3001"
info "- Logs : $LOG_DIR"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$LOCAL_URL" >/dev/null 2>&1 || true
fi
