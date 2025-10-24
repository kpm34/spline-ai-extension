#!/bin/bash

# Update Claude Desktop MCP config to handle Maestro warnings

CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "🔧 Updating Claude Desktop MCP configuration..."

# Create wrapper script for Maestro to suppress warnings
MAESTRO_WRAPPER="$HOME/.maestro/mcp-wrapper.sh"

cat > "$MAESTRO_WRAPPER" << 'EOF'
#!/bin/bash
# Suppress Java warnings from Maestro MCP
exec 2>/dev/null
exec maestro mcp "$@"
EOF

chmod +x "$MAESTRO_WRAPPER"

echo "✅ Created Maestro wrapper at: $MAESTRO_WRAPPER"

# Update Claude config
cat > "$CONFIG_PATH" << EOF
{
  "mcpServers": {
    "maestro": {
      "command": "/bin/bash",
      "args": ["$MAESTRO_WRAPPER"]
    },
    "spline-cli": {
      "command": "node",
      "args": ["/Users/kashyapmaheshwari/spline-cli-editor/mcp-server/spline-mcp-server.js"]
    }
  }
}
EOF

echo "✅ Updated Claude Desktop config"
echo ""
echo "🔄 Please restart Claude Desktop to apply changes"
