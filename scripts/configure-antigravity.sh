#!/usr/bin/env bash
# ==============================================================================
# ARGON BRIDGE — CONFIGURE ANTIGRAVITY MCP REGISTRATION
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_SERVER_JS="$PROJECT_ROOT/dist/mcp/server.js"
MCP_CONFIG_PATH="$HOME/.gemini/config/mcp_config.json"

if [ ! -f "$MCP_SERVER_JS" ]; then
  echo "[!] Binary $MCP_SERVER_JS not found. Running npm run build..."
  cd "$PROJECT_ROOT" && npm run build
fi

mkdir -p "$(dirname "$MCP_CONFIG_PATH")"

if [ ! -f "$MCP_CONFIG_PATH" ]; then
  echo '{"mcpServers":{}}' > "$MCP_CONFIG_PATH"
fi

# Use Node to update JSON safely without jq requirement
node - <<EOF
const fs = require('fs');
const configPath = "$MCP_CONFIG_PATH";
const serverPath = "$MCP_SERVER_JS";

let config = { mcpServers: {} };
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse existing config, creating fresh object');
  }
}
if (!config.mcpServers) config.mcpServers = {};

config.mcpServers["argon"] = {
  command: "/usr/bin/node",
  args: [serverPath]
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('[✓] Successfully registered "argon" in ' + configPath);
EOF
