#!/usr/bin/env bash
# ==============================================================================
# ARGON BRIDGE — CHROME NATIVE MESSAGING HOST REGISTRATION
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HOST_SCRIPT="$PROJECT_ROOT/scripts/argon-native-host"

EXTENSION_ID="${1:-}"

# Target directories for Chrome and Chromium
CHROME_TARGET="$HOME/.config/google-chrome/NativeMessagingHosts"
CHROMIUM_TARGET="$HOME/.config/chromium/NativeMessagingHosts"

mkdir -p "$CHROME_TARGET" "$CHROMIUM_TARGET"

MANIFEST_CHROME="$CHROME_TARGET/com.darwinsin.argon_bridge.json"
MANIFEST_CHROMIUM="$CHROMIUM_TARGET/com.darwinsin.argon_bridge.json"

chmod +x "$HOST_SCRIPT"

# If an extension ID is passed, restrict to it, otherwise allow wildcard for development
ALLOWED_ORIGINS_JSON='["chrome-extension://*"]'
if [ -n "$EXTENSION_ID" ]; then
  ALLOWED_ORIGINS_JSON="[\"chrome-extension://${EXTENSION_ID}/\"]"
fi

cat > "$MANIFEST_CHROME" <<EOF
{
  "name": "com.darwinsin.argon_bridge",
  "description": "Argon Bridge Native Messaging Host for Gemini Web and Antigravity",
  "path": "$HOST_SCRIPT",
  "type": "stdio",
  "allowed_origins": $ALLOWED_ORIGINS_JSON
}
EOF

cp "$MANIFEST_CHROME" "$MANIFEST_CHROMIUM"

echo "[✓] Chrome Native Messaging Host registered successfully:"
echo "    • Chrome:   $MANIFEST_CHROME"
echo "    • Chromium: $MANIFEST_CHROMIUM"
echo "    • Executable: $HOST_SCRIPT"
