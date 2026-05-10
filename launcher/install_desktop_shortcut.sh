#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
START_SCRIPT="$ROOT_DIR/launcher/start_formateur.sh"
STOP_SCRIPT="$ROOT_DIR/launcher/stop_formateur.sh"

if [ ! -x "$START_SCRIPT" ]; then
  chmod +x "$START_SCRIPT"
fi

if [ ! -x "$STOP_SCRIPT" ]; then
  chmod +x "$STOP_SCRIPT"
fi

DESKTOP_DIR="$HOME/Desktop"
if [ -d "$HOME/Bureau" ]; then
  DESKTOP_DIR="$HOME/Bureau"
fi

mkdir -p "$DESKTOP_DIR"

LAUNCHER_FILE="$DESKTOP_DIR/Mon Site Pro - Serveur central.desktop"
STOP_FILE="$DESKTOP_DIR/Mon Site Pro - Arreter serveur.desktop"

cat > "$LAUNCHER_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Mon Site Pro (Serveur central)
Comment=Demarre Docker, base, API et ouvre l'application
Exec=\"$START_SCRIPT\"
Terminal=true
Icon=utilities-terminal
Categories=Education;
EOF

cat > "$STOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Mon Site Pro (Arreter serveur)
Comment=Arrete API, interface et PostgreSQL Docker
Exec=\"$STOP_SCRIPT\"
Terminal=true
Icon=process-stop
Categories=Education;
EOF

chmod +x "$LAUNCHER_FILE" "$STOP_FILE"

printf '[INFO] Raccourcis crees:\n- %s\n- %s\n' "$LAUNCHER_FILE" "$STOP_FILE"
