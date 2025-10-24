# Maestro Tests for Spline AI Chrome Extension

## What We're Building

**Chrome Extension with:**
- AI Prompting UI Overlay on Spline pages
- Customizable GUI
- Extension popup interface
- Content script injection
- AI command processing

## Test Focus

Testing the web interface that the extension will interact with:
- Spline editor UI elements
- Page structure and DOM
- User interaction flows
- Element selectors for extension injection

## Platform

- **Browser**: Chromium (via Maestro `-p web`)
- **Target**: https://app.spline.design
- **Extension**: Spline AI + SIM.ai

## Running Tests

```bash
maestro -p web test "01-test-name.yaml"
```

## Test Results

Screenshots and logs: `~/.maestro/tests/`
