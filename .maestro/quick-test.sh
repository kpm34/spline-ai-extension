#!/bin/bash

echo "🧪 Maestro Quick Test Script"
echo "============================"
echo ""

# Check if simulator is running
if xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
    echo "✅ iOS Simulator is running"
    DEVICE_NAME=$(xcrun simctl list devices booted 2>/dev/null | grep "(" | head -1 | sed 's/^[[:space:]]*//' | sed 's/ (.*//')
    echo "   Device: $DEVICE_NAME"
else
    echo "⚠️  No simulator running"
    echo "   Starting iPhone 15 Pro..."
    xcrun simctl boot "iPhone 15 Pro" 2>/dev/null || echo "   Failed to boot. Try: open -a Simulator"
    open -a Simulator
    echo "   Waiting for simulator to start..."
    sleep 5
fi

echo ""
echo "📋 Available Test Suites:"
echo ""
echo "1. iOS Settings Test (Simple)"
echo "2. Safari Spline Test"
echo "3. Complete Browser Workflow"
echo "4. All Browser Tests"
echo "5. Custom Test"
echo ""
read -p "Select test to run (1-5): " choice

case $choice in
    1)
        echo ""
        echo "▶️  Running iOS Settings Test..."
        maestro test .maestro/20-ios-settings.yaml
        ;;
    2)
        echo ""
        echo "▶️  Running Safari Spline Test..."
        maestro test .maestro/17-safari-spline.yaml
        ;;
    3)
        echo ""
        echo "▶️  Running Complete Browser Workflow..."
        maestro test .maestro/25-end-to-end-browser.yaml
        ;;
    4)
        echo ""
        echo "▶️  Running All Browser Tests..."
        maestro test .maestro/1[7-9]-*.yaml .maestro/2[0-5]-*.yaml
        ;;
    5)
        echo ""
        read -p "Enter path to test file: " testfile
        maestro test "$testfile"
        ;;
    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================="
echo "✅ Test Complete!"
echo ""
echo "📸 Screenshots saved to: ~/.maestro/tests/"
echo ""
echo "💡 Tip: Use Maestro MCP in Claude Desktop for interactive testing!"
