# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered Spline 3D editor that enables natural language control of Spline scenes through a sophisticated three-agent AI system. The system consists of:

1. **Chrome Extension** (Primary Interface) - Provides overlay UI at `app.spline.design` with `Ctrl+K` hotkey
2. **Three-Agent AI System** - Coordinates Planning Agent (GPT-4o-mini), Visual Agent (GPT-4o), and Editor Agent
3. **MCP Server** - Model Context Protocol integration for Maestro CLI automation
4. **SIM.ai Integration** - Optional workflow automation platform

## Commands

### Development
```bash
npm install              # Install dependencies
npm start                # Run main CLI (src/index.js)
npm run dev             # Run with Node debugger
npm run api-server      # Start Three-Agent API server (required for extension)
npm run api-server:dev  # Start API server with debugger
npm test                # Run Jest tests
npm run build           # Runs tests (alias for npm test)
npm run lint            # Run ESLint with auto-fix
```

### Testing
```bash
# Unit tests
npm test

# Runtime tests (requires browser environment)
node src/runtime/test-init.js
node src/runtime/test-presets.js
node src/runtime/test-cli-load.js
node src/runtime/test-cli-set.js
node src/runtime/test-cli-var.js

# MCP Server tests
node mcp-server/test-mcp-server.js
node mcp-server/test-maestro-mcp.js

# Maestro UI tests (requires Maestro CLI and iOS Simulator)
maestro test .maestro/                    # Run all flows
maestro test "Maestro workspace/"         # Chrome extension tests
maestro test .maestro/25-end-to-end-browser.yaml  # Full browser workflow
```

### SIM.ai (Optional - For Workflow Visualization Only)
```bash
# SIM.ai is NOT required for the extension to work
# It's only used for visualizing workflows and prototyping

# To start SIM.ai (optional)
cd /Users/kashyapmaheshwari/sim
docker compose -f docker-compose.custom.yml up -d

# Access at http://localhost:3003
# Check status
docker ps --filter "name=sim-"
docker compose logs -f simstudio
```

### Chrome Extension Development
```bash
# Extension is loaded from Frontend/ directory
# After making changes:
# 1. Go to chrome://extensions/
# 2. Click reload button on "Spline CLI + SIM.ai" extension
# 3. Reload any app.spline.design tabs
```

## Architecture

### Direct API Architecture (Production)

The Chrome extension communicates directly with the Three-Agent System via REST API:

```
Chrome Extension (Frontend/)
        ↓
Three-Agent API Server (localhost:8081)
        ↓
Three-Agent System (src/three-agent-system.js)
        ↓
Spline Runtime (src/spline-runtime.js)
        ↓
Actual 3D Scene
```

**Key Points:**
- No SIM.ai dependency in production
- Direct, low-latency communication
- Planning Agent receives full GUI context
- WebSocket support for real-time updates (future)

### Three-Agent System (src/three-agent-system.js)

The core AI orchestration follows this flow:

```
User Command + GUI Context → Planning Agent → Visual Agent (screenshot) → Editor Agent → Visual Agent (validation) → User Feedback
```

**Agent 1: Planning Agent (GPT-4o-mini)** - Cost: ~$0.0002/command
- Breaks down user intent into actionable steps
- Returns JSON with plan, steps, and validation criteria
- Uses conversation history for context

**Agent 2: Visual Agent (GPT-4o + Vision)** - Cost: ~$0.022/command
- Takes screenshots of Spline canvas
- Detects objects and current state
- Formats changes as structured actions
- Validates changes after execution

**Agent 3: Editor Agent** - Cost: Free
- Executes Spline Runtime API commands
- Reports detailed execution results
- Handles errors and edge cases

### Chrome Extension Architecture

**Content Script (content.js)**:
- Injects overlay UI into `app.spline.design` pages
- Creates command input with `Ctrl+K` hotkey
- Communicates with background service worker

**Background Worker (background.js)**:
- Handles AI command parsing via `ai-command-parser.js`
- Manages SIM.ai API communication at `http://localhost:3003/api`
- Executes workflows and returns results

**Overlay UI**:
- CSS in `overlay.css` (semi-transparent command palette)
- Popup in `popup.html/js` (extension config)
- Options in `options.html/js` (API key settings)

**UI Design**:
- **Font**: Inter font family from Google Fonts for modern, professional typography
- **Icons**: SVG-based icon system (Feather-style, stroke-based) replaces all emojis
- **Icon Classes**: `.icon` (20px), `.icon-sm` (16px), `.icon-lg` (24px) for consistent sizing
- **Color Scheme**: Dark theme with purple gradient accent (#667eea to #764ba2)
- **No Emojis**: All UI uses SVG icons for a polished, sophisticated appearance
- **Simplified Config**: Removed redundant API key inputs - extension uses server-side .env configuration

**Key UI Files**:
- `Frontend/overlay.css` - Main overlay styles with Inter font
- `Frontend/content.js` - Overlay HTML structure with SVG icons
- `Frontend/options.html` - Settings page (Inter font, SVG icons, simplified)
- `Frontend/popup.html` - Extension popup with quick commands

### Spline Runtime Integration (src/spline-runtime.js)

Uses official `@splinetool/runtime` package:

```javascript
// Initialize
const runtime = new SplineRuntime();
await runtime.initialize(canvas);
await runtime.load('https://prod.spline.design/xxx.splinecode');

// Manipulate objects
runtime.setObjectProperty('Cube', 'position', {x: 10, y: 20, z: 30});
runtime.setVariable('cube_color', '#ff0000');
runtime.emitEvent('explode');

// Presets (saved to ~/.spline-cli/presets/)
await runtime.savePreset('ready');
await runtime.loadPreset('exploded-view');
```

### MCP Server (mcp-server/spline-mcp-server.js)

Provides Model Context Protocol tools for:
- Spline project fetching and inspection
- Scene manipulation
- Screenshot capture
- Batch operations
- Integration with Maestro for UI automation

**Important**: MCP server uses stdio transport and suppresses console output during initialization to maintain protocol compatibility.

### Command Parsing (src/spline-command-parser.js)

Translates natural language to Spline API commands:

```javascript
const parser = new SplineCommandParser();
const result = await parser.parse("move cube to (10, 20, 30)");
// Returns: { success: true, commands: [{ action: "setObjectProperty", ... }] }
```

## Key Implementation Details

### Three-Agent API Server (src/api-server.js)

Standalone Express server that wraps the Three-Agent System:

**Endpoints:**
- `GET /health` - Health check
- `POST /api/session/init` - Initialize browser session with Spline scene
- `POST /api/execute` - Execute AI command with context
- `POST /api/suggest` - Get AI suggestions for current scene
- `POST /api/session/close` - Close browser session
- `GET /api/sessions` - List active sessions

**Starting the server:**
```bash
npm run api-server
# Server runs at http://localhost:8081
```

The Chrome extension connects to this API automatically.

### Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=sk-proj-...          # Required for AI agents
API_PORT=8081                        # Optional (default: 8081)
SPLINE_EMAIL=user@example.com       # Optional (for Spline login)
SPLINE_PASSWORD=password             # Optional (for Spline login)
```

### Canvas Detection

The system needs to identify the Spline canvas element:
- In browser: `document.querySelector('canvas')` or runtime-injected canvas
- In Puppeteer: Page automation finds canvas element
- Runtime wraps `@splinetool/runtime` Application class

### Screenshot System

Visual Agent requires screenshots:
- Browser extension: Uses Chrome `chrome.tabs.captureVisibleTab()`
- Puppeteer: Uses `page.screenshot()`
- Screenshots are base64-encoded and sent to GPT-4o Vision API

### Preset System

Presets save/restore scene state:
- Stored in `~/.spline-cli/presets/<name>.json`
- Captures all object properties (position, rotation, scale, color, visibility)
- Variables and event states also saved
- Useful for animation keyframes or configuration snapshots

### Testing with Maestro

Maestro flows in `.maestro/` and `Maestro workspace/` test:
- iOS Safari browser automation
- Extension functionality in Chrome
- Full end-to-end workflows
- Screenshot capture and validation

**Note**: Maestro tests require:
- Java runtime (`/usr/libexec/java_home`)
- Xcode command line tools
- iOS Simulator
- Maestro CLI installed

### SIM.ai Integration

Optional visual workflow platform:
- Runs locally via Docker at `localhost:3003`
- Provides drag-and-drop workflow builder
- Workflows defined in `simai-workflows/`
- Extension communicates via REST API

## Common Patterns

### Adding New AI Commands

1. Update `ai-command-parser.js` with new command patterns
2. Add corresponding Spline API methods in `spline-runtime.js`
3. Update Planning Agent system prompt in `three-agent-system.js`
4. Test with runtime test files in `src/runtime/`

### Extending MCP Tools

1. Add new tool definition in `spline-mcp-server.js` tools array
2. Implement handler in switch statement
3. Test with `node mcp-server/test-mcp-server.js`
4. Create Maestro flow in `.maestro/` for integration test

### Browser Extension Updates

1. Modify relevant file (`content.js`, `background.js`, `popup.js`)
2. Update `manifest.json` if adding new permissions
3. Reload extension at `chrome://extensions/`
4. Test with extension loaded at `app.spline.design`
5. Create Maestro flow in `Maestro workspace/` for automated testing

## Important Constraints

### MCP Server Stdio Compatibility

The MCP server uses stdio transport and must:
- Suppress all console output during initialization
- Not write to stdout/stderr before protocol handshake
- Manually parse `.env` instead of using dotenv's verbose mode

### Runtime Initialization Order

SplineRuntime requires strict initialization:
1. Create instance: `new SplineRuntime()`
2. Initialize with canvas: `await runtime.initialize(canvas)`
3. Load scene: `await runtime.load(url)`
4. Then manipulate objects

Calling methods out of order throws errors.

### Chrome Extension Manifest V3

Extension uses Manifest V3:
- Service workers instead of background pages
- `chrome.scripting` API for content injection
- Host permissions limited to `app.spline.design`
- Uses `importScripts()` for loading modules

### Cost Optimization

To minimize AI costs:
- Use GPT-4o-mini for planning (not GPT-4o)
- Only use GPT-4o with vision for screenshot analysis
- Limit screenshot resolution to reduce token usage
- Reuse conversation history for context
- Consider caching common planning patterns

## Debugging

### Extension Issues
```bash
# Check extension console (background service worker)
chrome://extensions/ → Spline CLI + SIM.ai → "service worker" link

# Check content script console
Open app.spline.design → F12 → Console tab

# Check for errors in overlay
Look for "🚀 Spline CLI" log messages
```

### AI Agent Issues
```bash
# Enable detailed logging
Set DEBUG=true in environment

# Check API key
echo $OPENAI_API_KEY

# Test individual agents
node -e "require('./src/three-agent-system.js')"
```

### Runtime Issues
```bash
# Test in isolation
node src/runtime/test-init.js

# Check canvas element exists
# In browser console: document.querySelector('canvas')
```

## File Organization

- `src/` - Core AI system and Spline integration
- `Frontend/` - Chrome extension (primary user interface)
- `mcp-server/` - Model Context Protocol server
- `.maestro/` - Maestro test flows for CLI and browser automation
- `Maestro workspace/` - Chrome extension specific test flows
- `docs/guides/` - User documentation
- `docs/architecture/` - System design documentation
- `docs/reference/` - API reference
- `simai-workflows/` - SIM.ai workflow definitions
- `archive/` - Old code and documentation (reference only)
- memorize
- add to memory