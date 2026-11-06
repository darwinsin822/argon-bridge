#!/usr/bin/env bash
# ==============================================================================
# ARGON BRIDGE — LINUX INSTALLER (NON-ROOT)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================================"
echo "          ARGON BRIDGE v1.0.0 — LINUX AUTOMATED INSTALLER             "
echo "======================================================================"

# 1. Check Node.js
echo "[1/10] Checking Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required but not installed." >&2
  exit 1
fi
echo "       Node.js version: $(node -v)"

# 2. Check npm
echo "[2/10] Checking npm..."
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not installed." >&2
  exit 1
fi
echo "       npm version: $(npm -v)"

# 3. Check Google Chrome
echo "[3/10] Checking Chrome browser..."
if command -v google-chrome >/dev/null 2>&1 || command -v google-chrome-stable >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1; then
  echo "       Chrome/Chromium is installed."
else
  echo "       Notice: Chrome not detected in standard path. Please ensure Google Chrome is installed."
fi

# 4. Install Dependencies
echo "[4/10] Installing dependencies..."
cd "$PROJECT_ROOT"
npm install --no-audit

# 5. Compile TypeScript
echo "[5/10] Compiling TypeScript project..."
npm run build

# 6. Create local directories
echo "[6/10] Creating Argon data directories..."
mkdir -p "$HOME/.argon-bridge"
mkdir -p "$HOME/.local/bin"

# Link CLI to ~/.local/bin
ln -sf "$PROJECT_ROOT/dist/cli.js" "$HOME/.local/bin/argon-cli"
chmod +x "$PROJECT_ROOT/dist/cli.js" "$PROJECT_ROOT/dist/mcp/server.js" "$PROJECT_ROOT/scripts/argon-native-host"

# 7. Configure Native Messaging
echo "[7/10] Registering Chrome Native Messaging Host..."
bash "$PROJECT_ROOT/scripts/register-native-host.sh"

# 8. Configure Antigravity MCP
echo "[8/10] Registering MCP server in Antigravity..."
bash "$PROJECT_ROOT/scripts/configure-antigravity.sh"

# 9. Verify Paths & Permissions
echo "[9/10] Verifying permissions and paths..."
chmod +x "$PROJECT_ROOT/scripts"/*.sh

# 10. Run Doctor Diagnostic
echo "[10/10] Running health diagnostic..."
bash "$PROJECT_ROOT/scripts/doctor.sh"

echo ""
echo "======================================================================"
echo "✓ ARGON BRIDGE v1.0.0 SUCCESSFULLY INSTALLED!"
echo "======================================================================"
echo "To load the Chrome extension:"
echo " 1. Open Google Chrome and navigate to chrome://extensions"
echo " 2. Enable 'Developer mode' (toggle in top right)"
echo " 3. Click 'Load unpacked' and select:"
echo "    $PROJECT_ROOT/extension"
echo ""
echo "In Antigravity, restart or reload MCP servers to access all 14 Argon tools."
echo "======================================================================"
