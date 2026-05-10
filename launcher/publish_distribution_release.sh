#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist-launcher"
VERSION="${1:-${DIST_VERSION:-$(date +%Y%m%d-%H%M)}}"

if ! [[ "$VERSION" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "[ERREUR] Version invalide: $VERSION" >&2
  exit 1
fi

ext_of() {
  local file="$1"
  if [[ "$file" == *.tar.gz ]]; then
    echo ".tar.gz"
  else
    echo ".${file##*.}"
  fi
}

checksum_of() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  else
    shasum -a 256 "$file" | awk '{print $1}'
  fi
}

mkdir -p "$DIST_DIR"

echo "[INFO] Build des packages version: $VERSION"
DIST_VERSION="$VERSION" "$ROOT_DIR/launcher/build_distribution_packages.sh"

find_pkg() {
  local os="$1"
  local match
  match="$(ls -1 "$DIST_DIR"/mon-site-pro-serveur-central-${os}-${VERSION}.* 2>/dev/null | head -n 1 || true)"
  if [ -z "$match" ]; then
    echo "[ERREUR] Package introuvable pour ${os} version ${VERSION}" >&2
    exit 1
  fi
  echo "$match"
}

LINUX_PKG="$(find_pkg linux)"
WINDOWS_PKG="$(find_pkg windows)"
MACOS_PKG="$(find_pkg macos)"

LINUX_EXT="$(ext_of "$LINUX_PKG")"
WINDOWS_EXT="$(ext_of "$WINDOWS_PKG")"
MACOS_EXT="$(ext_of "$MACOS_PKG")"

LINUX_LATEST="$DIST_DIR/mon-site-pro-serveur-central-linux-latest${LINUX_EXT}"
WINDOWS_LATEST="$DIST_DIR/mon-site-pro-serveur-central-windows-latest${WINDOWS_EXT}"
MACOS_LATEST="$DIST_DIR/mon-site-pro-serveur-central-macos-latest${MACOS_EXT}"

cp -f "$LINUX_PKG" "$LINUX_LATEST"
cp -f "$WINDOWS_PKG" "$WINDOWS_LATEST"
cp -f "$MACOS_PKG" "$MACOS_LATEST"

GENERATED_AT="$(date -Iseconds)"
LINUX_SUM="$(checksum_of "$LINUX_PKG")"
WINDOWS_SUM="$(checksum_of "$WINDOWS_PKG")"
MACOS_SUM="$(checksum_of "$MACOS_PKG")"

cat > "$DIST_DIR/latest.json" <<EOF
{
  "version": "${VERSION}",
  "generatedAt": "${GENERATED_AT}",
  "artifacts": {
    "linux": {
      "versioned": "$(basename "$LINUX_PKG")",
      "latest": "$(basename "$LINUX_LATEST")",
      "sha256": "${LINUX_SUM}"
    },
    "windows": {
      "versioned": "$(basename "$WINDOWS_PKG")",
      "latest": "$(basename "$WINDOWS_LATEST")",
      "sha256": "${WINDOWS_SUM}"
    },
    "macos": {
      "versioned": "$(basename "$MACOS_PKG")",
      "latest": "$(basename "$MACOS_LATEST")",
      "sha256": "${MACOS_SUM}"
    }
  }
}
EOF

echo "[OK] Release publiée localement"
echo "[INFO] Manifeste: $DIST_DIR/latest.json"
echo "[INFO] Latest Linux: $(basename "$LINUX_LATEST")"
echo "[INFO] Latest Windows: $(basename "$WINDOWS_LATEST")"
echo "[INFO] Latest macOS: $(basename "$MACOS_LATEST")"
