#!/usr/bin/env bash
# ==============================================================================
# ARGON BRIDGE — UNINSTALLER
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================================"
echo "          ARGON BRIDGE v1.0.0 — UNINSTALLATION SCRIPT                 "
echo "======================================================================"

# 1. Unregister Chrome Native Messaging
echo "[*] Removing Chrome Native Messaging manifests..."
rm -f "$HOME/.config/google-chrome/NativeMessagingHosts/com.darwinsin.argon_bridge.json"
rm -f "$HOME/.config/chromium/NativeMessagingHosts/com.darwinsin.argon_bridge.json"

# 2. Unregister CLI symlink
echo "[*] Removing argon-cli symlink..."
rm -f "$HOME/.local/bin/argon-cli"

# 3. Remove Antigravity MCP registration
MCP_CONFIG_PATH="$HOME/.gemini/config/mcp_config.json"
if [ -f "$MCP_CONFIG_PATH" ]; then
  echo "[*] Unregistering argon MCP server from Antigravity..."
  node - <<EOF
const fs = require('fs');
const configPath = "$MCP_CONFIG_PATH";
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.mcpServers && config.mcpServers["argon"]) {
      delete config.mcpServers["argon"];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('    Removed "argon" entry from ' + configPath);
    }
  } catch(e) {}
}
EOF
fi

# 4. Prompt for user data preservation
echo ""
echo "By default, your SQLite databases and project history at ~/.argon-bridge are PRESERVED."
read -p "Do you want to permanently delete all Argon project databases (~/.argon-bridge)? [y/N]: " -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "[*] Purging $HOME/.argon-bridge..."
  rm -rf "$HOME/.argon-bridge"
  echo "    Data purged."
else
  echo "    Argon data preserved at $HOME/.argon-bridge."
fi

echo ""
echo "[✓] Argon Bridge uninstallation complete."
echo "======================================================================"
