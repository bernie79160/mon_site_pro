#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist-launcher"
KEEP_COUNT="${1:-5}"

if ! [[ "$KEEP_COUNT" =~ ^[0-9]+$ ]]; then
  echo "[ERREUR] KEEP_COUNT doit être un entier" >&2
  exit 1
fi

if [ ! -d "$DIST_DIR" ]; then
  echo "[INFO] Aucun dossier dist-launcher à nettoyer"
  exit 0
fi

cleanup_os() {
  local os="$1"
  mapfile -t files < <(ls -1t "$DIST_DIR"/mon-site-pro-serveur-central-${os}-* 2>/dev/null | grep -v -- '-latest' || true)
  if [ "${#files[@]}" -le "$KEEP_COUNT" ]; then
    echo "[INFO] ${os}: rien à supprimer (${#files[@]} <= $KEEP_COUNT)"
    return
  fi

  echo "[INFO] ${os}: suppression des anciennes archives..."
  for ((i=KEEP_COUNT; i<${#files[@]}; i++)); do
    rm -f "${files[$i]}"
    echo "  - supprimé: $(basename "${files[$i]}")"
  done
}

cleanup_os linux
cleanup_os windows
cleanup_os macos

echo "[OK] Nettoyage terminé"
