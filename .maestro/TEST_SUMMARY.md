# Maestro Test Suite Summary

## 📊 Test Statistics

- **Total Test Flows**: 25+ YAML files
- **CLI Tests**: 16 flows (01-16)
- **Browser Tests**: 9 flows (17-25)
- **MCP Tools**: 14 Maestro automation tools

## 🎯 Test Categories

### CLI Testing (01-16)
Tests for Spline CLI commands running in terminal

- **Connection & Auth**: 01-connect-flow.yaml
- **Project Management**: 02-projects-flow.yaml, 09-11 (fetch operations)
- **Scene Inspection**: 03-inspect-flow.yaml
- **Batch Operations**: 04-batch-operations-flow.yaml
- **Screenshots**: 05-screenshot-flow.yaml
- **Code Execution**: 06-exec-code-flow.yaml
- **Live Preview**: 07-viewer-flow.yaml
- **Full Workflow**: 08-full-workflow-flow.yaml
- **Runtime Tests**: 12-15 (runtime initialization, presets, info, integration)
- **CLI Variables**: 14-16 (load, set, var)

### Browser Testing (17-25)
Tests for iOS Safari and Spline web app

- **17-safari-spline.yaml**: Open Spline in Safari
- **18-safari-login.yaml**: Login page verification
- **19-safari-screenshot.yaml**: Screenshot capture
- **20-ios-settings.yaml**: iOS UI interaction test
- **21-safari-extensions.yaml**: Extension settings check
- **22-spline-project-open.yaml**: Direct project loading
- **23-simulator-ui-test.yaml**: Comprehensive UI test
- **24-spline-gallery.yaml**: Gallery browsing
- **25-end-to-end-browser.yaml**: Complete workflow

## 🚀 Quick Start Commands

### Run All Tests
```bash
maestro test .maestro/
```

### Run CLI Tests Only
```bash
maestro test .maestro/0*.yaml .maestro/1[0-6]-*.yaml
```

### Run Browser Tests Only
```bash
maestro test .maestro/1[7-9]-*.yaml .maestro/2[0-5]-*.yaml
```

### Run Specific Test
```bash
maestro test .maestro/17-safari-spline.yaml
```

## 📱 Via Maestro MCP (Claude Desktop)

Once Maestro MCP is connected, simply ask Claude:

### Start Testing
```
Start an iOS simulator and run the Safari test
```

### Run Specific Test
```
Run the Maestro test file .maestro/23-simulator-ui-test.yaml
```

### Custom Commands
```
Run this Maestro flow:
- launchApp:
    appId: com.apple.mobilesafari
- tapOn: "URL"
- inputText: "https://spline.design"
- tapOn: "Go"
```

### Get Help
```
Show me the Maestro cheat sheet
```

## 🔧 Setup Requirements

### For CLI Tests (01-16)
- ✅ Maestro installed
- ✅ Spline CLI installed (`spline-edit`)
- ✅ `.env` file with credentials
- ✅ Terminal access

### For Browser Tests (17-25)
- ✅ Maestro installed
- ⏳ Xcode installed
- ⏳ iOS Simulator running
- ⏳ Internet connection

## 📝 Test Execution Status

### Ready to Run Now:
- ✅ All CLI tests (01-16) - Can run in terminal

### Ready After Simulator Setup:
- ⏳ All Browser tests (17-25) - Need iOS Simulator

## 🎬 Example Test Run

```bash
# Start simulator
open -a Simulator

# Run a simple iOS test
maestro test .maestro/20-ios-settings.yaml

# Expected output:
# ✅ Launching app com.apple.Preferences
# ✅ Asserting visible: Settings
# ✅ Tapping on Safari
# ✅ Asserting visible: Search Engine
# ✅ Pressing back
# ✅ Asserting visible: Settings
#
# Test passed! 🎉
```

## 🔍 Debugging

### Verbose Output
```bash
maestro test --debug .maestro/17-safari-spline.yaml
```

### View UI Hierarchy
Via MCP in Claude Desktop:
```
Inspect the view hierarchy of the current iOS screen
```

### Take Screenshot
```bash
maestro test .maestro/19-safari-screenshot.yaml
```

Or via MCP:
```
Take a screenshot of the simulator
```

## 📚 Documentation

- **Main README**: `.maestro/README.md`
- **Browser Testing Guide**: `.maestro/BROWSER_TESTING_GUIDE.md`
- **MCP Setup**: `MCP_TESTING_GUIDE.md`
- **Xcode Setup**: `XCODE_SIMULATOR_SETUP.md`

## 🎯 Next Steps

1. ⏳ **Install Xcode** from App Store
2. ⏳ **Start iOS Simulator**
3. ✅ **Run first test**: `maestro test .maestro/20-ios-settings.yaml`
4. ✅ **Test Safari**: `maestro test .maestro/17-safari-spline.yaml`
5. ✅ **Test Spline web app**: `maestro test .maestro/25-end-to-end-browser.yaml`

## 💡 Pro Tips

### Maestro MCP Integration
Once connected to Claude Desktop, you can:
- Run tests conversationally
- Get real-time feedback
- Debug interactively
- Generate new tests on the fly

### CI/CD
All tests can run in GitHub Actions:
```yaml
- name: Run Maestro Tests
  run: maestro test .maestro/
```

### Custom Tests
Create new tests using existing ones as templates:
```yaml
appId: com.apple.mobilesafari
---
# Your test here
- launchApp
- tapOn: "Element"
- assertVisible: "Expected"
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No devices found | Start simulator: `open -a Simulator` |
| App not launching | Check app ID is correct |
| Element not found | Increase wait time, check UI hierarchy |
| Test timeout | Add `waitForAnimationToEnd` |
| MCP not connecting | Check JAVA_HOME in config |

## 📊 Test Coverage

### Current Coverage
- ✅ CLI Connection & Auth
- ✅ Project Listing & Fetching
- ✅ Scene Inspection
- ✅ Batch Operations
- ✅ Screenshot Capture
- ✅ Code Execution
- ✅ Live Preview
- ✅ Browser Navigation
- ✅ iOS UI Interaction
- ✅ Spline Web App

### Coming Soon
- ⏳ Browser Extension Testing
- ⏳ AI Command Testing
- ⏳ Multi-device Testing
- ⏳ Performance Testing

---

**Total Tests**: 25+ flows ready to run! 🚀
