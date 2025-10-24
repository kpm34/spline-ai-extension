#!/bin/bash

# Spline CLI MCP Setup Script
# Automatically configures Claude Desktop for MCP + Maestro integration

echo "🚀 Spline CLI MCP Setup"
echo "======================="
echo ""

# Get current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_SERVER_PATH="$CURRENT_DIR/mcp-server/spline-mcp-server.js"

echo "📍 Project path: $CURRENT_DIR"
echo "📍 MCP server: $MCP_SERVER_PATH"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📍 Claude config: $CONFIG_PATH"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_PATH" ]; then
    echo "📝 Creating new Claude config file..."
    mkdir -p "$(dirname "$CONFIG_PATH")"
    echo '{}' > "$CONFIG_PATH"
fi

# Backup existing config
BACKUP_PATH="${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Backing up config to: $BACKUP_PATH"
cp "$CONFIG_PATH" "$BACKUP_PATH"

# Create new config with MCP servers
echo "⚙️  Configuring MCP servers..."

cat > "$CONFIG_PATH" << EOF
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    },
    "spline-cli": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"]
    }
  }
}
EOF

echo "✅ MCP configuration complete!"
echo ""

# Verify Maestro installation
echo "🔍 Checking Maestro installation..."
if command -v maestro &> /dev/null; then
    MAESTRO_VERSION=$(maestro --version)
    echo "✅ Maestro found: $MAESTRO_VERSION"
else
    echo "⚠️  Maestro not found!"
    echo ""
    echo "Install Maestro:"
    echo "  brew install maestro"
    echo "  # or"
    echo "  curl -Ls 'https://get.maestro.mobile.dev' | bash"
    echo ""
fi

# Verify Spline CLI installation
echo "🔍 Checking Spline CLI installation..."
if command -v spline-edit &> /dev/null; then
    echo "✅ Spline CLI found: $(which spline-edit)"
else
    echo "⚠️  Spline CLI not found!"
    echo ""
    echo "Install Spline CLI:"
    echo "  cd $CURRENT_DIR"
    echo "  npm link"
    echo ""
fi

# Make MCP server executable
echo "🔧 Making MCP server executable..."
chmod +x "$MCP_SERVER_PATH"
echo "✅ Done!"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔄 Restart Claude Desktop"
echo "   - Quit completely"
echo "   - Reopen"
echo ""
echo "2. ✅ Verify in Claude Code:"
echo "   Ask: 'Use MCP to list available tools'"
echo ""
echo "3. 🧪 Test it out:"
echo "   Ask: 'Generate a Maestro test for the connect command'"
echo ""
echo "📚 Full documentation:"
echo "   $CURRENT_DIR/MCP_MAESTRO_SETUP.md"
echo ""
echo "🎉 Happy testing!"
echo ""
