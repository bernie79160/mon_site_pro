#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
info() { echo "[INFO] $*"; }

check_port() {
  local port="$1"
  local name="$2"
  if ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq ":${port}$"; then
    ok "$name actif (port $port)"
  else
    warn "$name inactif (port $port)"
  fi
}

info "Etat du serveur central"
check_port 3001 "API backend"
check_port 8080 "Interface web"

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    state="$(docker inspect -f '{{.State.Status}}' mon_site_pro_postgres 2>/dev/null || true)"
    if [ "$state" = "running" ]; then
      ok "PostgreSQL Docker actif (container mon_site_pro_postgres)"
    elif [ -n "$state" ]; then
      warn "PostgreSQL Docker present mais etat=$state"
    else
      warn "Container mon_site_pro_postgres introuvable"
    fi
  else
    warn "Docker installe mais daemon indisponible"
  fi
else
  warn "Docker non installe"
fi

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -n "$LAN_IP" ]; then
  info "URL élèves : http://${LAN_IP}:8080"
fi
info "URL locale : http://localhost:8080"
info "API locale : http://localhost:3001"

if [ -d "$ROOT_DIR/.launcher/logs" ]; then
  info "Logs : $ROOT_DIR/.launcher/logs"
fi

if [ -f "$BACKEND_DIR/.env" ]; then
  info "Config backend : $BACKEND_DIR/.env"
fi
