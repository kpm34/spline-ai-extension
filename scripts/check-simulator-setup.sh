#!/bin/bash

echo "📱 Simulator Setup Check"
echo "========================"
echo ""

# Check Xcode
echo "1. Xcode Installation:"
if [ -d "/Applications/Xcode.app" ]; then
    echo "   ✅ Xcode app found"
    XCODE_VERSION=$(xcodebuild -version 2>/dev/null | head -1)
    if [ $? -eq 0 ]; then
        echo "   ✅ $XCODE_VERSION"
    else
        echo "   ⚠️  Xcode found but not configured"
    fi
else
    echo "   ❌ Xcode not installed"
    echo "      Install from App Store: https://apps.apple.com/app/xcode/id497799835"
fi
echo ""

# Check Command Line Tools
echo "2. Xcode Command Line Tools:"
XCODE_SELECT=$(xcode-select -p 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Installed at: $XCODE_SELECT"
else
    echo "   ❌ Not installed"
fi
echo ""

# Check for simulators
echo "3. iOS Simulators:"
if command -v xcrun &> /dev/null; then
    SIM_COUNT=$(xcrun simctl list devices available 2>/dev/null | grep -c "iPhone")
    if [ $SIM_COUNT -gt 0 ]; then
        echo "   ✅ $SIM_COUNT iPhone simulators available"
    else
        echo "   ❌ No simulators found (Xcode not fully installed)"
    fi
else
    echo "   ❌ xcrun not available (install full Xcode)"
fi
echo ""

# Check if any simulator is running
echo "4. Running Simulators:"
if command -v xcrun &> /dev/null; then
    BOOTED=$(xcrun simctl list devices booted 2>/dev/null | grep -c "Booted")
    if [ $BOOTED -gt 0 ]; then
        echo "   ✅ $BOOTED simulator(s) running"
        xcrun simctl list devices booted 2>/dev/null | grep "(" | sed 's/^/      /'
    else
        echo "   ⏸️  No simulators currently running"
    fi
else
    echo "   ⏸️  Cannot check (Xcode not installed)"
fi
echo ""

# Check Android Studio / Android emulators
echo "5. Android Emulators:"
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "   ✅ Android SDK found"
    if [ -f "$HOME/Library/Android/sdk/emulator/emulator" ]; then
        EMU_COUNT=$($HOME/Library/Android/sdk/emulator/emulator -list-avds 2>/dev/null | wc -l)
        echo "   📱 $EMU_COUNT Android emulator(s) available"
    fi
else
    echo "   ⏸️  Android SDK not found"
fi
echo ""

# Check Maestro
echo "6. Maestro:"
if command -v maestro &> /dev/null; then
    echo "   ✅ Maestro installed: $(maestro --version)"
else
    echo "   ❌ Maestro not found"
fi
echo ""

echo "========================"
echo ""

# Recommendations
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "📋 Next Steps:"
    echo "   1. Install Xcode from the App Store"
    echo "   2. Run: sudo xcodebuild -license accept"
    echo "   3. Run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    echo "   4. Start simulator: open -a Simulator"
    echo ""
    echo "   See XCODE_SIMULATOR_SETUP.md for detailed instructions"
elif [ $BOOTED -eq 0 ]; then
    echo "📋 Quick Start:"
    echo "   Run: open -a Simulator"
    echo "   Or: xcrun simctl boot 'iPhone 15 Pro' && open -a Simulator"
else
    echo "✅ You're all set! Simulators are running."
    echo ""
    echo "🧪 Test in Claude Desktop:"
    echo "   - 'List available iOS devices'"
    echo "   - 'Take a screenshot of the simulator'"
    echo "   - 'Launch Safari on the simulator'"
fi
