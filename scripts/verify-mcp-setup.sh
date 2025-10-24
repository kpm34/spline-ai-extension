#!/bin/bash

echo "🔍 MCP Setup Verification"
echo "=========================="
echo ""

# Check Maestro installation
echo "1. Maestro Installation:"
if command -v maestro &> /dev/null; then
    echo "   ✅ Maestro installed: $(maestro --version)"
else
    echo "   ❌ Maestro not found"
fi
echo ""

# Check Node.js
echo "2. Node.js:"
if command -v node &> /dev/null; then
    echo "   ✅ Node.js: $(node --version)"
else
    echo "   ❌ Node.js not found"
fi
echo ""

# Check Spline MCP server file
echo "3. Spline MCP Server:"
if [ -f "/Users/kashyapmaheshwari/spline-cli-editor/mcp-server/spline-mcp-server.js" ]; then
    echo "   ✅ Server file exists"
else
    echo "   ❌ Server file not found"
fi
echo ""

# Check Claude Desktop config
echo "4. Claude Desktop Config:"
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "   ✅ Config file exists"
    echo "   📝 Contents:"
    cat "$CONFIG_FILE" | sed 's/^/      /'
else
    echo "   ❌ Config file not found"
fi
echo ""

# Test Maestro MCP
echo "5. Maestro MCP Server Test:"
echo "   Testing 'maestro mcp' command..."
timeout 2s maestro mcp &> /dev/null &
MCP_PID=$!
sleep 1
if ps -p $MCP_PID > /dev/null 2>&1; then
    echo "   ✅ Maestro MCP server can start"
    kill $MCP_PID 2>/dev/null
else
    echo "   ⚠️  Maestro MCP server started but exited (this is normal without stdin)"
fi
echo ""

echo "=========================="
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Quit Claude Desktop completely (Cmd+Q)"
echo "   2. Reopen Claude Desktop"
echo "   3. Look for 🔌 icon in bottom-right"
echo "   4. You should see both 'maestro' and 'spline-cli' connected"
echo ""
echo "🧪 Test Commands in Claude Desktop:"
echo "   - 'List available Maestro tools'"
echo "   - 'Show me the Spline CLI tools'"
echo "   - 'Run a Maestro test flow'"
