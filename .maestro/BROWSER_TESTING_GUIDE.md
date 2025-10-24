# Browser Testing with Maestro

## New Test Flows (17-25)

These tests are designed for iOS Simulator testing with Safari and the Spline web application.

## Prerequisites

1. ✅ Maestro installed and MCP connected to Claude Desktop
2. ⏳ Xcode installed (for iOS Simulator)
3. ⏳ iOS Simulator running

## Quick Start

Once you have a simulator running, you can execute these tests:

### Option 1: Using Claude Desktop (MCP)

With Maestro MCP connected, you can run tests by asking Claude:

```
Start an iOS simulator and run the Safari Spline test
```

Or more specifically:
```
Run the Maestro test file .maestro/17-safari-spline.yaml
```

### Option 2: Command Line

```bash
# Start a simulator first
open -a Simulator

# Run a specific test
maestro test .maestro/17-safari-spline.yaml

# Run all browser tests (17-25)
maestro test .maestro/17-*.yaml .maestro/18-*.yaml .maestro/19-*.yaml .maestro/20-*.yaml .maestro/21-*.yaml .maestro/22-*.yaml .maestro/23-*.yaml .maestro/24-*.yaml .maestro/25-*.yaml
```

## Test Descriptions

### 17-safari-spline.yaml
**Purpose**: Basic Safari navigation to Spline web app
**What it tests**:
- Safari launch
- URL navigation
- Spline homepage loads

**How to run**:
```bash
maestro test .maestro/17-safari-spline.yaml
```

---

### 18-safari-login.yaml
**Purpose**: Spline login page UI verification
**What it tests**:
- Login page navigation
- Email field presence
- Password field presence

**How to run**:
```bash
maestro test .maestro/18-safari-login.yaml
```

---

### 19-safari-screenshot.yaml
**Purpose**: Capture screenshots of Spline interface
**What it tests**:
- Screenshot capture functionality
- Page load completion

**Output**: Creates `spline-homepage.png` screenshot

**How to run**:
```bash
maestro test .maestro/19-safari-screenshot.yaml
```

---

### 20-ios-settings.yaml
**Purpose**: Verify simulator UI interaction
**What it tests**:
- iOS Settings app
- Navigation between screens
- Back button functionality

**How to run**:
```bash
maestro test .maestro/20-ios-settings.yaml
```

---

### 21-safari-extensions.yaml
**Purpose**: Check Safari extension settings
**What it tests**:
- Safari settings navigation
- Extensions menu access

**Useful for**: Verifying browser extension setup

**How to run**:
```bash
maestro test .maestro/21-safari-extensions.yaml
```

---

### 22-spline-project-open.yaml
**Purpose**: Open specific Spline project
**What it tests**:
- Direct project URL navigation
- Project loading
- 3D editor presence

**Note**: Replace `your-project-id` with actual project ID

**How to run**:
```bash
maestro test .maestro/22-spline-project-open.yaml
```

---

### 23-simulator-ui-test.yaml
**Purpose**: Comprehensive UI interaction test
**What it tests**:
- Search bar interaction
- Page navigation
- Back button
- Screenshot capture

**How to run**:
```bash
maestro test .maestro/23-simulator-ui-test.yaml
```

---

### 24-spline-gallery.yaml
**Purpose**: Browse Spline community gallery
**What it tests**:
- Gallery page loading
- Scroll functionality
- Community content visibility

**How to run**:
```bash
maestro test .maestro/24-spline-gallery.yaml
```

---

### 25-end-to-end-browser.yaml
**Purpose**: Complete browser workflow
**What it tests**:
- Safari → Spline homepage
- Gallery navigation
- Multiple screenshots
- Full user journey

**Output**: Creates 3 screenshots showing complete workflow

**How to run**:
```bash
maestro test .maestro/25-end-to-end-browser.yaml
```

---

## Running Tests via Maestro MCP (Claude Desktop)

Once Maestro MCP is connected, you can interact with tests conversationally:

### Example Commands:

**List available devices:**
```
Show me all available iOS simulators
```

**Start a simulator:**
```
Start an iPhone 15 Pro simulator
```

**Run a test:**
```
Run the Safari Spline test flow
```

**Take a screenshot:**
```
Take a screenshot of the current iOS simulator screen
```

**Inspect UI:**
```
Show me the UI hierarchy of the current screen
```

**Run custom commands:**
```
Run this Maestro command on the simulator:
- tapOn: "Settings"
- assertVisible: "General"
```

## Customizing Tests

### Adding Your Project ID

Edit `22-spline-project-open.yaml`:
```yaml
- inputText: "https://app.spline.design/file/YOUR_ACTUAL_PROJECT_ID"
```

### Adding Extension Tests

Once you have your browser extension loaded in Safari:

```yaml
appId: com.apple.mobilesafari
---
- launchApp
- tapOn: "URL"
- inputText: "https://app.spline.design"
- tapOn: "Go"
- waitForAnimationToEnd
# Click your extension icon
- tapOn: "Extensions"
- tapOn: "Spline AI"
- inputText: "make a cube"
- assertVisible: "AI processing"
```

## Debugging Tests

### View detailed output:
```bash
maestro test --debug .maestro/17-safari-spline.yaml
```

### Get Maestro help:
Ask Claude Desktop (via MCP):
```
Show me the Maestro cheat sheet
```

Or command line:
```bash
maestro --help
```

## Screenshot Locations

Screenshots are saved to:
```
~/.maestro/tests/<test-name>/screenshots/
```

## Troubleshooting

### "No devices found"
- Make sure simulator is running: `open -a Simulator`
- Check devices: `xcrun simctl list devices booted`

### "App not found"
- Verify app ID is correct
- For Safari, use: `com.apple.mobilesafari`
- For Settings, use: `com.apple.Preferences`

### "Element not found"
- Increase wait time: `waitForAnimationToEnd: timeout: 10000`
- Check UI hierarchy: Use Maestro MCP `inspect_view_hierarchy` tool

### Tests timing out
- Check internet connection
- Verify Spline website is accessible
- Increase timeout values

## CI/CD Integration

### Run browser tests in GitHub Actions:

```yaml
name: Maestro Browser Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start Simulator
        run: |
          xcrun simctl boot "iPhone 15 Pro"
          open -a Simulator
      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "${HOME}/.maestro/bin" >> $GITHUB_PATH
      - name: Run browser tests
        run: maestro test .maestro/17-*.yaml .maestro/18-*.yaml .maestro/23-*.yaml
```

## Next Steps

1. Install Xcode
2. Start iOS Simulator
3. Run basic test: `maestro test .maestro/20-ios-settings.yaml`
4. Run Safari test: `maestro test .maestro/17-safari-spline.yaml`
5. Test your browser extension
6. Create custom test flows for your use cases

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro MCP Docs](https://docs.maestro.dev/getting-started/maestro-mcp)
- [iOS Simulator Guide](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)

---

**Happy Testing! 🧪📱**
