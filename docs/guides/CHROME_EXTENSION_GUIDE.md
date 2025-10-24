# Chrome Extension Setup Guide - Spline AI Editor

**Transform Spline with AI-powered natural language editing**

---

## 🎯 What You Get

✅ **Natural Language Control** - Edit Spline scenes with plain English commands
✅ **AI-Powered Editing** - Three-agent system with visual validation
✅ **In-Browser Overlay** - Command interface with `Ctrl+K` hotkey
✅ **Context Panels** - Specify material, object, text, interaction, and animation properties
✅ **Real-time Execution** - See changes applied instantly
✅ **Direct API** - Fast, low-latency communication (2-5 seconds)
✅ **Optional SIM.ai** - Visual workflow builder for complex automation (optional)

---

## 📋 Prerequisites

Before installing the extension, make sure you have:

1. **Three-Agent API Server** (Required)
   ```bash
   cd spline-cli-editor
   npm install
   npm run api-server
   # Runs at http://localhost:8081
   ```

2. **OpenAI API Key** (Required)
   - Get from https://platform.openai.com/api-keys
   - Add to `.env` file: `OPENAI_API_KEY=sk-proj-...`

3. **Google Chrome or Chromium-based Browser**
   - Chrome, Edge, Brave, Arc, etc.

4. **SIM.ai** (Optional - for workflow visualization only)
   - Sign up at https://www.sim.ai
   - Only needed for complex workflow automation

---

## 🚀 Installation

### Step 1: Prepare Extension Files

The extension is located at:
```
spline-cli-editor/Frontend/
```

All necessary files are already created:
```
Frontend/
├── manifest.json          ✓ Extension configuration
├── popup.html            ✓ Popup interface
├── popup.js              ✓ Popup logic
├── background.js         ✓ Service worker
├── content.js            ✓ Spline overlay injection
├── overlay.css           ✓ Overlay styles
├── options.html          ✓ Settings page
└── options.js            ✓ Settings logic
```

### Step 2: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to: `chrome://extensions/`
   - Or: Menu → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Navigate to: `/Users/kashyapmaheshwari/spline-cli-editor/Frontend/`
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Spline CLI + SIM.ai Workflows v2.0.0" in your extensions
   - Pin the extension to your toolbar for easy access

### Step 3: Start API Server

Before using the extension, start the Three-Agent API server:

```bash
# In spline-cli-editor directory
npm run api-server

# Server will start at http://localhost:8081
# ✅ You'll see: "Three-Agent System API running at http://localhost:8081"
```

The extension automatically connects to `http://localhost:8081`

---

## 🎮 How to Use

### Opening the Overlay

1. **Open Spline Scene**
   - Navigate to https://app.spline.design
   - Open or create any 3D scene

2. **Press `Ctrl + K`** (or `Cmd + K` on Mac)
   - Opens command overlay
   - Works anywhere on app.spline.design

### Using Natural Language Commands

Type what you want in plain English:

```
make the cube red
move sphere up by 10 units
rotate camera 45 degrees
scale all objects by 2
hide the cylinder
create glass button
```

### Context Panels (Optional)

Click the side panel icons to specify context:

| Icon | Panel | Purpose |
|------|-------|---------|
| 💎 | Material | Set material type, transparency, roughness, color |
| 📦 | Object | Specify object type, dimensions, position |
| 📝 | Text | Define text content, font, size |
| 🎯 | Interaction | Set events and actions |
| ✨ | Animation | Configure duration, easing, effects |

**Example with context:**
1. Click 💎 Material panel
2. Set: Type=glass, Transparency=0.7
3. Click ✓ Apply Context
4. Type: "create button"
5. AI creates glass button with 70% transparency

### How It Works

1. You type a command
2. **Planning Agent** breaks it down into steps
3. **Visual Agent** screenshots and analyzes the scene
4. **Editor Agent** executes Spline API commands
5. **Visual Agent** validates changes
6. You see success message + updated scene

---

## 🔧 Extension Features

### 1. Command Overlay

**Draggable Window**
- Click and drag the ⋮⋮ handle to move
- Position anywhere on screen
- Side panels move together with overlay

**Command Input**
- Type natural language commands
- Press Enter to execute
- Real-time feedback in output area

**Output Display**
- Color-coded messages:
  - 🟦 Blue: Your commands
  - ✅ Green: Success
  - ❌ Red: Errors
  - 💬 White: AI feedback
- Shows execution progress
- Scrollable history

### 2. Context Panels

Five side panels for specifying context:

**💎 Material Panel**
- Material type (glass, metal, etc.)
- Transparency (0-1)
- Roughness (0-1)
- Color (hex or name)

**📦 Object Panel**
- Object type (button, box, sphere, etc.)
- Width, Height, Depth
- Position (x, y, z)

**📝 Text Panel**
- Text content
- Font family
- Font size

**🎯 Interaction Panel**
- Event type (onClick, onHover, etc.)
- Action (navigate, animate, etc.)

**✨ Animation Panel**
- Animation type
- Duration
- Easing function
- Effects

### 3. Keyboard Shortcuts

**Global (anywhere on Spline):**
- `Ctrl + K` or `Cmd + K` - Toggle overlay

**Input Focused:**
- `Enter` - Execute command
- `Esc` - Close overlay

---

## 🌐 SIM.ai Integration (Optional)

**Note:** SIM.ai is completely optional. It's only useful for:
- Visualizing the Three-Agent System workflow as nodes
- Creating complex multi-step automation workflows
- Batch operations across multiple scenes

The extension works perfectly without SIM.ai using the direct API.

### Setup (Optional)

If you want to use SIM.ai for workflow visualization:

```bash
# Start SIM.ai locally
cd /path/to/sim
docker compose -f docker-compose.custom.yml up -d

# Access at http://localhost:3003
```

### Use Cases

**When to use SIM.ai:**
- Complex workflows with branching logic
- Batch operations on multiple projects
- Scheduled automation
- Visual workflow debugging

**When NOT to use SIM.ai:**
- Simple commands (just use direct API)
- Real-time editing (direct API is faster)
- Single-scene operations

---

## 🛠️ Advanced Configuration

### Options Page

Access full settings:
1. Right-click extension icon → "Options"
2. Or from popup → Click "Options" link

**Available Settings:**
- SIM.ai API Key
- Viewer Port & URL
- Auto-load workflows
- Desktop notifications
- Debug mode (verbose logging)

### Testing Connections

**Test Viewer:**
```bash
# In options page, click "Test Viewer Connection"
# Should see: ✅ Viewer connection successful!
```

**Test SIM.ai:**
```bash
# In options page, click "Test SIM.ai Connection"
# Should see: ✅ SIM.ai connection successful!
```

### Debug Mode

Enable for troubleshooting:
1. Go to Options page
2. Check "Enable debug mode"
3. Save settings
4. Check browser console (F12) for detailed logs

---

## 🐛 Troubleshooting

### Extension Not Loading

**Issue:** Extension doesn't appear in Chrome

**Solutions:**
1. Verify Developer Mode is enabled
2. Check manifest.json for errors
3. Reload extension:
   - Go to `chrome://extensions/`
   - Click refresh icon on extension card
4. Check Chrome console for errors

### Overlay Not Appearing

**Issue:** Pressing Ctrl+K does nothing

**Solutions:**
1. Make sure you're on `app.spline.design/*`
2. Refresh the Spline page
3. Check if extension is enabled
4. Check browser console (F12) for errors
5. Verify content script loaded:
   ```javascript
   // In console, should see:
   🚀 Spline CLI + SIM.ai content script loaded
   ```

### Cannot Connect to API Server

**Issue:** Commands fail with "API server not running"

**Solutions:**
1. Start the Three-Agent API server:
   ```bash
   npm run api-server
   ```
2. Verify server is running at http://localhost:8081
3. Check server logs for errors
4. Verify `.env` file has `OPENAI_API_KEY`

### Commands Not Executing

**Issue:** Commands entered but nothing happens

**Solutions:**
1. Check browser console (F12) for errors
2. Verify API server is running (`npm run api-server`)
3. Check OpenAI API key is valid
4. Reload the extension at chrome://extensions/
5. Refresh the Spline page

### Keyboard Shortcut Not Working

**Issue:** Ctrl+K doesn't open overlay

**Solutions:**
1. Verify you're on app.spline.design
2. Check if another extension is using Ctrl+K
3. Try Cmd+K on Mac instead of Ctrl+K
4. Reload the Spline page
5. Check extension is enabled

### AI Taking Too Long

**Issue:** Commands take more than 10 seconds

**Solutions:**
1. Check your internet connection
2. Verify OpenAI API is not rate-limited
3. Complex commands naturally take longer
4. Check server logs for bottlenecks

---

## 📊 Extension Permissions

The extension requests these permissions:

| Permission | Reason | Usage |
|------------|--------|-------|
| `activeTab` | Access current tab | Inject overlay into Spline |
| `storage` | Save preferences | Store overlay position and settings |
| `scripting` | Inject scripts | Add overlay and context panels |
| `app.spline.design/*` | Spline access | Inject overlay on Spline pages |
| `localhost:8081` | API Server | Connect to Three-Agent System API |

All permissions are used only for stated purposes. No data is collected or transmitted to third parties.

---

## 🔐 Security & Privacy

### Data Storage

**What's Stored (locally in browser):**
- Overlay position
- Context panel preferences
- User preferences

**What's NOT Stored:**
- OpenAI API key (stored in `.env` on server)
- Spline account credentials
- Spline project data
- Command history (session only)

### Network Requests

**Extension makes requests to:**
1. `localhost:8081` - Three-Agent API server (required)
2. `localhost:3003` - SIM.ai (optional, if configured)
3. No other external services

**API Server makes requests to:**
1. `api.openai.com` - For AI processing (using your key)
2. No other external services

**No Analytics:**
- No tracking
- No telemetry
- No usage data sent anywhere
- Completely local operation

### API Key Security

**Best Practices:**
1. Store OpenAI API key in `.env` file (never commit)
2. Never share your API key
3. Rotate key if compromised
4. API key only used on local API server
5. Not transmitted to browser extension

---

## 🚀 Next Steps

### 1. Quick Test
1. Start API server: `npm run api-server`
2. Load extension in Chrome
3. Open https://app.spline.design
4. Press `Ctrl+K`
5. Type: "make the cube red"
6. Watch the magic happen!

### 2. Explore Context Panels
- Try the 💎 Material panel for glass effects
- Use 📦 Object panel to specify dimensions
- Experiment with ✨ Animation panel

### 3. Advanced Commands
- Try complex multi-step commands
- Use natural language descriptions
- Combine multiple operations

### 4. Optional: Explore SIM.ai
- Only if you need workflow visualization
- Or complex batch automation
- Not required for basic usage

---

## 📚 Resources

**Documentation:**
- [Three-Agent Architecture](../architecture/THREE_AGENT_ARCHITECTURE.md) - How the AI system works
- [Direct API Architecture](../architecture/DIRECT_API_ARCHITECTURE.md) - Current architecture
- [UI Improvements](../UI_IMPROVEMENTS.md) - Recent overlay enhancements
- [CLAUDE.md](../../CLAUDE.md) - Complete developer guide

**Links:**
- OpenAI Platform: https://platform.openai.com
- Spline Docs: https://docs.spline.design
- Spline Runtime: https://docs.spline.design/runtime

**Support:**
- Extension Issues: Check browser console (F12)
- API Issues: Check API server logs (`npm run api-server`)
- AI Issues: Verify OpenAI API key and quota

---

## 🎉 You're All Set!

**Quick Test:**

1. ✅ Start API server: `npm run api-server`
2. ✅ Open https://app.spline.design
3. ✅ Press `Ctrl + K`
4. ✅ Type: "make the cube red"
5. ✅ Watch AI edit your scene!

**Happy editing with AI!** 🚀✨
