#!/usr/bin/env bash
set -euo pipefail

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
info() { echo "[INFO] $*"; }

is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

info "Etat du serveur central"
if is_listening 3001; then ok "API backend active (port 3001)"; else warn "API backend inactive (port 3001)"; fi
if is_listening 8080; then ok "Interface web active (port 8080)"; else warn "Interface web inactive (port 8080)"; fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  state="$(docker inspect -f '{{.State.Status}}' mon_site_pro_postgres 2>/dev/null || true)"
  if [ "$state" = "running" ]; then
    ok "PostgreSQL Docker actif"
  elif [ -n "$state" ]; then
    warn "PostgreSQL Docker etat=$state"
  else
    warn "Container PostgreSQL introuvable"
  fi
else
  warn "Docker indisponible"
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -n "$LAN_IP" ]; then
  info "URL eleves: http://${LAN_IP}:8080"
fi
info "URL locale: http://localhost:8080"
info "API locale: http://localhost:3001"
