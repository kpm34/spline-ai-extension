# Spline CLI Editor - Project Status

**Last Updated**: 2025-10-22
**Status**: 🟡 Chrome Extension Redesigned - API Connection Blocked

## Current State

### ✅ Completed

1. **Chrome Extension UI Redesign**
   - Removed dual-mode interface (AI Prompt vs GUI Panels)
   - Implemented prompt-first ChatGPT-like interface
   - Added side context panels (Material, Object, Text, Interaction, Animation)
   - Top navigation buttons: Inspect, Screenshot, Export
   - Removed "Viewer" command (no longer needed)
   - Fixed drag-and-drop functionality with visual indicators

2. **CORS Issues Fixed (Extension Side)**
   - Changed API base URL from `/api/v1/workflows` to `/api/workflows/{id}/execute`
   - Removed workflow listing (uses configured workflow ID instead)
   - Disabled API validation in popup to prevent CORS errors
   - Extension code no longer attempts restricted endpoints

3. **Repository Cleanup**
   - Moved outdated docs to `archive/old-docs/`
   - Archived old Plasmo extension to `archive/old-extensions/`
   - Removed duplicate `tests/` folder (use Maestro workspace)
   - Organized test files: MCP tests → `mcp-server/`, runtime tests → `src/runtime/`
   - Consolidated structure: 41 → 16 root items (61% reduction)

### 🟡 In Progress / Blocked

**Chrome Extension → SIM.ai Workflow Connection**

**Issue**: Extension cannot connect to AI workflow due to missing workflow configuration

**Current Status**:
- Extension is loaded and functional (no JavaScript errors)
- Popup works (shows configuration needed message)
- Overlay opens on Spline pages (Ctrl+K)
- New UI is complete and styled

**What's Blocking**:
1. **No workflow ID configured** - Extension needs a SIM.ai workflow ID
2. **No workflow exists yet** - Need to create workflow in SIM Studio
3. **API endpoint expects workflow** - `/api/workflows/{id}/execute` requires valid workflow

### 🔧 What Needs To Happen Next

#### Step 1: Create SIM.ai Workflow
```
1. Open http://localhost:3003 (SIM Studio)
2. Create new workflow named "Spline AI Assistant"
3. Configure workflow to accept:
   {
     "prompt": "user's text input",
     "context": {
       "material": {...},
       "object": {...},
       "text": {...},
       "interaction": {...},
       "animation": {...}
     }
   }
4. Copy the workflow ID
```

#### Step 2: Configure Extension
```
1. Click extension icon in Chrome toolbar
2. Click "Options"
3. Add workflow ID to settings
4. Add SIM.ai API key
5. Save
```

#### Step 3: Test End-to-End
```
1. Open https://app.spline.design
2. Press Ctrl+K
3. Type prompt: "create a glass button"
4. Click send (➤)
5. Verify workflow executes
```

## Project Structure

```
spline-cli-editor/
├── Frontend/                 # ⭐ MAIN - Chrome extension
│   ├── manifest.json
│   ├── popup.html/js         # Extension popup
│   ├── options.html/js       # Settings page
│   ├── background.js         # Service worker (API calls)
│   ├── content.js            # Overlay & injection
│   └── overlay.css           # New prompt-first UI
│
├── src/                      # Core AI system
│   ├── three-agent-system.js
│   ├── spline-command-parser.js
│   ├── spline-runtime.js
│   └── runtime/              # Runtime tests
│
├── mcp-server/               # Maestro MCP integration
│   ├── maestro-mcp.js
│   ├── test-maestro-mcp.js
│   └── test-mcp-server.js
│
├── Maestro workspace/        # UI tests (required by Maestro)
│   └── *.yaml
│
├── .maestro/                 # Other Maestro tests
├── docs/                     # Documentation
├── workflows/                # Workflow examples
├── scripts/                  # Utility scripts
└── archive/                  # Old code & docs
```

## Key Changes This Session

### Chrome Extension Redesign

**Old UI** (Dual Mode):
```
[💬 AI Prompt] [🎨 GUI Panels]  ← Mode toggle
─────────────────────────────
[Command buttons]
[Output area]
[Input] [Execute]
```

**New UI** (Prompt-First):
```
[🔍 Inspect][📸 Screenshot][📦 Export]  ← Top nav
───────────────────────────────────────
[Output area]
[Type prompt...            ] [➤]  ← Main input

                    [💎] Material  ← Side tabs
                    [📦] Object       (slide out
                    [📝] Text         for context)
                    [🎯] Interaction
                    [✨] Animation
```

### Files Modified

**Frontend/content.js** (content.js:52-438)
- Complete HTML restructuring
- New functions: `openSidePanel()`, `closeSidePanel()`, `executeAIPrompt()`
- Removed: `switchMode()`, `commandViewer()`

**Frontend/overlay.css** (overlay.css:320-763)
- Added `.top-nav`, `.prompt-input-area`, `.send-btn`
- Added `.side-panels`, `.side-tabs`, `.side-panel-content`
- Removed old mode toggle styles

**Frontend/popup.js** (popup.js:33-132)
- Disabled workflow listing (avoids CORS)
- Simplified API key validation (no API call)
- Shows "configure workflow ID" message

**Frontend/background.js** (background.js:8)
- API base changed: `/api/v1` → `/api`
- Uses workflow ID from settings

## Environment

**Running Services**:
- SIM.ai: http://localhost:3003 ✅
- Chrome Extension: Loaded ✅

**Configuration Needed**:
- Extension Options → SIM.ai API Key: ❌ Not set
- Extension Options → Workflow ID: ❌ Not set
- SIM Studio → Spline Workflow: ❌ Not created

## API Structure

**SIM.ai Endpoints**:
```
GET  /api/workflows          # List workflows (CORS: localhost:3000 only)
POST /api/workflows/{id}/execute  # Execute workflow (CORS: * allowed) ✅
```

**Extension Uses**:
```javascript
// background.js calls:
POST http://localhost:3003/api/workflows/{workflowId}/execute
Headers:
  x-api-key: {user's API key}
  Content-Type: application/json
Body:
  {
    "inputs": {
      "prompt": "create a glass button",
      "context": { material: {...}, object: {...}, ... }
    }
  }
```

## Known Issues

1. **Popup CORS errors** (FIXED) - No longer calling restricted endpoints
2. **Workflow not configured** (BLOCKING) - Need to create workflow in SIM Studio
3. **Mode overlap** (FIXED) - Redesigned to single prompt interface
4. **Viewer command** (REMOVED) - No longer needed

## Testing

**Manual Test Checklist**:
- [x] Extension loads without errors
- [x] Popup opens correctly
- [x] Overlay opens with Ctrl+K
- [x] New UI displays correctly
- [x] Side panels slide out
- [x] Drag-and-drop works
- [ ] Workflow executes (blocked - no workflow ID)
- [ ] AI responds to prompts (blocked - no workflow)

**Maestro Tests**:
- Location: `Maestro workspace/10-test-extension-gui-mode.yaml`
- Status: Ready to run once workflow is configured

## Next Actions

### Priority 1: Create Workflow
1. Design workflow in SIM Studio
2. Accept prompt + context inputs
3. Process with AI (GPT-4o)
4. Generate Spline commands
5. Return results

### Priority 2: Configure Extension
1. Add workflow ID to extension settings
2. Add SIM.ai API key
3. Test connection

### Priority 3: End-to-End Testing
1. Test prompt execution
2. Test context panels
3. Test all top navigation commands
4. Run Maestro tests

## Resources

**Documentation**:
- README.md - Main project documentation
- docs/ - User guides and architecture
- archive/old-docs/ - Historical documentation

**Related Projects**:
- SIM.ai: /Users/kashyapmaheshwari/sim
- Spline: https://app.spline.design

**Key Commands**:
```bash
# Reload extension
chrome://extensions/ → Find extension → Click reload

# Test on Spline
open https://app.spline.design
# Press Ctrl+K to open overlay

# SIM Studio
open http://localhost:3003
```

## Summary

The Chrome extension has been completely redesigned with a cleaner, prompt-first interface. All CORS issues are resolved on the extension side. The main blocker is creating and configuring the SIM.ai workflow that the extension will communicate with.

**Status**: Ready for workflow creation and configuration.
