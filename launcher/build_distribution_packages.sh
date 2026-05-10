#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist-launcher"
TMP_DIR="$DIST_DIR/.tmp"
VERSION="${DIST_VERSION:-$(date +%Y%m%d-%H%M)}"
ARCHIVE_WITH_ZIP="0"

if ! [[ "$VERSION" =~ ^[A-Za-z0-9._-]+$ ]]; then
   echo "[ERREUR] Version invalide: $VERSION" >&2
   echo "Format autorisé: lettres/chiffres/._-" >&2
   exit 1
fi

mkdir -p "$DIST_DIR" "$TMP_DIR"
rm -rf "$TMP_DIR"/*

copy_common() {
  local target="$1"
  mkdir -p "$target"
  cp "$ROOT_DIR/docs/GUIDE_FORMATEUR.md" "$target/"
  cp "$ROOT_DIR/docs/GUIDE_INSTALLATEUR.md" "$target/"
  cp "$ROOT_DIR/README.md" "$target/"
  cp "$ROOT_DIR/01_IMPORTANT.txt" "$target/" 2>/dev/null || true
}

build_linux() {
  local folder="$TMP_DIR/mon-site-pro-serveur-central-linux"
  copy_common "$folder"
  mkdir -p "$folder/launcher"
  cp "$ROOT_DIR/launcher/start_formateur.sh" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/stop_formateur.sh" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/status_formateur.sh" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/install_desktop_shortcut.sh" "$folder/launcher/"
  chmod +x "$folder/launcher/"*.sh

  cat > "$folder/LIRE-MOI-LINUX.txt" <<'EOF'
Mon Site Pro - Serveur central (Linux)

1) Ouvrir un terminal dans ce dossier.
2) Lancer:
   ./launcher/start_formateur.sh
3) Optionnel: créer les raccourcis Bureau:
   ./launcher/install_desktop_shortcut.sh
4) Vérifier l'état:
   ./launcher/status_formateur.sh
5) Arrêter:
   ./launcher/stop_formateur.sh
EOF

  (cd "$TMP_DIR" && tar -czf "$DIST_DIR/mon-site-pro-serveur-central-linux-${VERSION}.tar.gz" "mon-site-pro-serveur-central-linux")
}

build_windows() {
  local folder="$TMP_DIR/mon-site-pro-serveur-central-windows"
  copy_common "$folder"
  mkdir -p "$folder/launcher"
  cp "$ROOT_DIR/launcher/start_formateur_windows.bat" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/stop_formateur_windows.bat" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/status_formateur_windows.bat" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/install_windows_shortcuts.ps1" "$folder/launcher/"

  cat > "$folder/LIRE-MOI-WINDOWS.txt" <<'EOF'
Mon Site Pro - Serveur central (Windows)

1) Ouvrir CMD dans ce dossier.
2) Lancer:
   launcher\start_formateur_windows.bat
3) Optionnel: créer les raccourcis Bureau:
   powershell -ExecutionPolicy Bypass -File launcher\install_windows_shortcuts.ps1
4) Vérifier l'état:
   launcher\status_formateur_windows.bat
5) Arrêter:
   launcher\stop_formateur_windows.bat
EOF

   if [ "$ARCHIVE_WITH_ZIP" = "1" ]; then
      (cd "$TMP_DIR" && zip -r "$DIST_DIR/mon-site-pro-serveur-central-windows-${VERSION}.zip" "mon-site-pro-serveur-central-windows" >/dev/null)
   else
      (cd "$TMP_DIR" && tar -czf "$DIST_DIR/mon-site-pro-serveur-central-windows-${VERSION}.tar.gz" "mon-site-pro-serveur-central-windows")
   fi
}

build_macos() {
  local folder="$TMP_DIR/mon-site-pro-serveur-central-macos"
  copy_common "$folder"
  mkdir -p "$folder/launcher"
  cp "$ROOT_DIR/launcher/start_formateur_macos.command" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/stop_formateur_macos.command" "$folder/launcher/"
  cp "$ROOT_DIR/launcher/status_formateur_macos.command" "$folder/launcher/"
  chmod +x "$folder/launcher/"*.command

  cat > "$folder/LIRE-MOI-MACOS.txt" <<'EOF'
Mon Site Pro - Serveur central (macOS)

1) Double-cliquer:
   launcher/start_formateur_macos.command
2) Vérifier l'état:
   launcher/status_formateur_macos.command
3) Arrêter:
   launcher/stop_formateur_macos.command

Si blocage Gatekeeper au premier lancement:
- clic droit > Ouvrir > Ouvrir
EOF

   if [ "$ARCHIVE_WITH_ZIP" = "1" ]; then
      (cd "$TMP_DIR" && zip -r "$DIST_DIR/mon-site-pro-serveur-central-macos-${VERSION}.zip" "mon-site-pro-serveur-central-macos" >/dev/null)
   else
      (cd "$TMP_DIR" && tar -czf "$DIST_DIR/mon-site-pro-serveur-central-macos-${VERSION}.tar.gz" "mon-site-pro-serveur-central-macos")
   fi
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERREUR] Commande requise manquante: $1" >&2
    exit 1
  fi
}

need_cmd tar
if command -v zip >/dev/null 2>&1; then
   ARCHIVE_WITH_ZIP="1"
else
   echo "[WARN] zip non trouvé: génération en .tar.gz pour tous les OS"
fi

build_linux
build_windows
build_macos

rm -rf "$TMP_DIR"

echo "[OK] Packages créés dans: $DIST_DIR"
echo "[INFO] Version des packages: $VERSION"
ls -1 "$DIST_DIR"
