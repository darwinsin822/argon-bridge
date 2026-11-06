#!/usr/bin/env bash
# ==============================================================================
# ARGON BRIDGE — SYSTEM DOCTOR & DIAGNOSTIC TOOL
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================================"
echo "               ARGON BRIDGE v1.0.0 — SYSTEM DOCTOR                    "
echo "======================================================================"

EXIT_CODE=0

# 1. Check Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v)
  echo "[✓] Node.js is installed: $NODE_VER"
  # Verify node:sqlite support
  if node --eval 'import("node:sqlite").then(m => process.exit(m.DatabaseSync ? 0 : 1)).catch(() => process.exit(1))' >/dev/null 2>&1; then
    echo "[✓] node:sqlite synchronous engine is supported."
  else
    echo "[✕] node:sqlite is NOT available in this Node version (Requires Node 22.5.0+)."
    EXIT_CODE=1
  fi
else
  echo "[✕] Node.js is NOT found in PATH."
  EXIT_CODE=1
fi

# 2. Check npm
if command -v npm >/dev/null 2>&1; then
  NPM_VER=$(npm -v)
  echo "[✓] npm is installed: $NPM_VER"
else
  echo "[✕] npm is NOT found in PATH."
  EXIT_CODE=1
fi

# 3. Check Google Chrome
if command -v google-chrome >/dev/null 2>&1 || command -v google-chrome-stable >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1; then
  CHROME_BIN=$(which google-chrome 2>/dev/null || which google-chrome-stable 2>/dev/null || which chromium 2>/dev/null)
  echo "[✓] Chrome/Chromium binary found: $CHROME_BIN"
else
  echo "[!] Chrome binary not found in standard PATH (Google Chrome is recommended for Gemini Web)."
fi

# 4. Check Build Artifacts
if [ -f "$PROJECT_ROOT/dist/mcp/server.js" ] && [ -f "$PROJECT_ROOT/dist/native-host/host.js" ]; then
  echo "[✓] Argon Bridge compiled binaries found in dist/"
else
  echo "[!] Compiled binaries missing in dist/. Run 'npm run build' first."
  EXIT_CODE=1
fi

# 5. Check Native Host Manifest
CHROME_NATIVE_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
HOST_MANIFEST="$CHROME_NATIVE_DIR/com.darwinsin.argon_bridge.json"
if [ -f "$HOST_MANIFEST" ]; then
  echo "[✓] Chrome Native Messaging host manifest registered at:"
  echo "    $HOST_MANIFEST"
else
  echo "[!] Native Messaging manifest not yet registered in Chrome. Run 'scripts/register-native-host.sh'."
fi

# 6. Check Antigravity MCP Config
MCP_CONFIG="$HOME/.gemini/config/mcp_config.json"
if [ -f "$MCP_CONFIG" ]; then
  if grep -q '"argon"' "$MCP_CONFIG" 2>/dev/null; then
    echo "[✓] Antigravity MCP server 'argon' is registered in:"
    echo "    $MCP_CONFIG"
  else
    echo "[!] 'argon' MCP server is not registered in $MCP_CONFIG. Run 'scripts/configure-antigravity.sh'."
  fi
else
  echo "[!] Antigravity config $MCP_CONFIG not found."
fi

# 7. Check Data Directory
DATA_DIR="$HOME/.argon-bridge"
if [ -d "$DATA_DIR" ]; then
  echo "[✓] Argon data directory exists: $DATA_DIR"
  if [ -f "$DATA_DIR/argon.db" ]; then
    echo "[✓] SQLite database initialized: $DATA_DIR/argon.db"
  fi
else
  echo "[i] Argon data directory will be created upon first run ($DATA_DIR)."
fi

echo "======================================================================"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo ">>> STATUS: HEALTHY AND OPERATIONAL."
else
  echo ">>> STATUS: ISSUES DETECTED. Review flagged items above."
fi
echo "======================================================================"
exit $EXIT_CODE
