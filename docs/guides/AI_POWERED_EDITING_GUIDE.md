# AI-Powered Spline Editing Guide

## Overview

This guide explains how to use AI agents to edit Spline 3D scenes through natural language commands and intelligent automation.

## System Architecture

```
User Input (Natural Language) + Context
       ↓
Chrome Extension (UI Layer)
       ↓
Three-Agent API Server (localhost:8081)
       ↓
├─ Planning Agent (GPT-4o-mini) - Breaks down commands
├─ Visual Agent (GPT-4o + Vision) - Screenshots & validates
└─ Editor Agent - Executes Spline API commands
       ↓
Spline Runtime API (Execution)
       ↓
Spline Scene (3D Canvas)
```

**Note:** SIM.ai is optional and only used for workflow visualization.

## Components

### 1. Chrome Extension
- **Location**: `/Frontend/`
- **Purpose**: Provides UI overlay on Spline pages
- **Features**:
  - Command input interface with `Ctrl+K`
  - Context panels (Material, Object, Text, Interaction, Animation)
  - Real-time feedback
  - Draggable overlay

### 2. Three-Agent API Server
- **Location**: `/src/api-server.js`
- **Port**: http://localhost:8081
- **Purpose**: REST API wrapping the Three-Agent System
- **Features**:
  - Session management
  - Request routing
  - Error handling
  - Health checks

### 3. Three-Agent System
- **Location**: `/src/three-agent-system.js`
- **Purpose**: Coordinates AI agents to edit scenes
- **Agents**:
  - **Planning Agent (GPT-4o-mini)**: Breaks down commands, ~$0.0002/command
  - **Visual Agent (GPT-4o + Vision)**: Screenshots & validates, ~$0.022/command
  - **Editor Agent**: Executes commands, free
- **Total Cost**: ~$0.024 per command (~$2.22 per 100 commands)

### 4. Spline Runtime
- **Location**: `/src/spline-runtime.js`
- **Purpose**: Direct scene manipulation via @splinetool/runtime
- **Features**:
  - Object control (position, rotation, scale)
  - Variable management
  - Event triggering
  - Preset system

---

## Quick Start

### Step 1: Install Dependencies & Configure

```bash
cd spline-cli-editor
npm install

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-proj-your-key-here" > .env
```

### Step 2: Start Three-Agent API Server

```bash
npm run api-server

# Server starts at http://localhost:8081
# ✅ You'll see: "Three-Agent System API running"
```

### Step 3: Load Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `Frontend/` directory

### Step 4: Open Spline & Try Commands

1. Navigate to https://app.spline.design
2. Open any 3D scene
3. Press `Ctrl+K` to open overlay
4. Type natural language commands:

```
"make the cube red"
"move sphere up by 10"
"rotate camera 45 degrees"
"create glass button"
```

The Three-Agent System will:
1. Plan the steps (Planning Agent)
2. Screenshot & analyze (Visual Agent)
3. Execute commands (Editor Agent)
4. Validate changes (Visual Agent)

---

## Usage Examples

### Basic Object Manipulation

```
// Position
"move cube to (10, 20, 30)"
"place sphere at origin"
"shift camera up by 10"

// Rotation
"rotate cube 45 degrees"
"turn sphere 90 degrees on y axis"
"flip cylinder upside down"

// Scale
"make cube twice as big"
"scale sphere to 50%"
"stretch platform vertically"

// Visibility
"hide the cube"
"show all spheres"
"toggle visibility of camera"
```

### Color and Materials

```
"make cube red"
"color sphere #FF5733"
"paint cylinder blue"
"apply metallic material to cube"
"make object semi-transparent"
```

### Complex Multi-Step Commands

```
"make the cube red, scale it by 2, and move it up"
"hide all spheres and show the camera"
"rotate cube 45 degrees and move it to (10, 0, 0)"
"create a row of 5 cubes spaced 10 units apart"
```

### Camera Control

```
"move camera to (0, 100, 200)"
"point camera at the cube"
"orbit camera around scene"
"set camera FOV to 45 degrees"
```

### Animation & Events

```
"trigger the explosion event"
"set animation speed to 2"
"start rotation animation"
"fire click event on button"
```

---

## Advanced Features

### 1. Workflow Execution

Execute complex workflows from the extension:

```javascript
// In extension popup, Workflows tab
1. Select workflow: "Natural Language Command Processor"
2. Input: "make cube red"
3. Click Execute
4. View results in output panel
```

### 2. Batch Operations

Process multiple objects at once:

```
"hide all cubes"
"move all spheres up by 10"
"make all red objects blue"
"scale everything by 2"
```

### 3. Presets & States

Save and load scene configurations:

```
"save this as preset 'ready'"
"load preset 'exploded-view'"
"reset to initial state"
```

### 4. Code Execution

Run custom JavaScript:

```javascript
// Via command overlay
"run: for(let i=0; i<5; i++) { /* animate */ }"

// Via extension API
chrome.runtime.sendMessage({
  action: 'executeCode',
  code: 'runtime.setObjectProperty("Cube", "scale", 2)'
})
```

---

## Context Panels

The Chrome extension provides five context panels to specify additional information for AI commands:

### 💎 Material Panel
- Material type (glass, metal, etc.)
- Transparency (0-1)
- Roughness (0-1)
- Color (hex or name)

### 📦 Object Panel
- Object type (button, box, sphere)
- Width, Height, Depth
- Position (x, y, z)

### 📝 Text Panel
- Text content
- Font family
- Font size

### 🎯 Interaction Panel
- Event type (onClick, onHover)
- Action (navigate, animate)

### ✨ Animation Panel
- Animation type
- Duration
- Easing function
- Effects

**Example:**
1. Click 💎 Material panel
2. Set: Type=glass, Transparency=0.7
3. Click ✓ Apply Context
4. Type: "create button"
5. Result: Glass button with 70% transparency

---

## AI Command Parser API

### Direct Usage

```javascript
const { SplineCommandParser } = require('./src/spline-command-parser')
const parser = new SplineCommandParser()

// Parse single command
const result = await parser.parse("make cube red")
console.log(result)
// {
//   success: true,
//   commands: [{
//     action: "setVariable",
//     variable: "cube_color",
//     value: "#ff0000",
//     description: "Set cube color to red"
//   }],
//   summary: "Change cube to red"
// }

// Execute commands
const runtime = new SplineRuntime()
await runtime.initialize(canvas)
await runtime.load(sceneUrl)

const execResult = await parser.execute(result, runtime)
console.log(execResult)
// {
//   success: true,
//   executed: 1,
//   results: [...]
// }
```

### Get Command Suggestions

```javascript
const suggestions = await parser.suggest({
  scene: 'product-showcase',
  objects: ['Cube', 'Sphere', 'Camera'],
  currentState: { /* ... */ }
})
// ["rotate product 360 degrees", "zoom camera closer", "add spotlight"]
```

### Batch Processing

```javascript
const commands = [
  "make cube red",
  "move sphere to (10, 0, 0)",
  "hide cylinder"
]

const results = await parser.parseBatch(commands)
console.log(results)
// { success: true, successful: 3, total: 3, results: [...] }
```

---

## Spline Runtime API

### Initialize & Load

```javascript
const { SplineRuntime } = require('./src/spline-runtime')
const runtime = new SplineRuntime()

// Initialize with canvas
const canvas = document.getElementById('canvas3d')
await runtime.initialize(canvas)

// Load scene
await runtime.load('https://prod.spline.design/abc123.splinecode')
```

### Object Manipulation

```javascript
// Get object
const cube = runtime.findObject('Cube')

// Set position
runtime.setObjectProperty('Cube', 'position', { x: 10, y: 20, z: 30 })

// Set rotation (radians)
runtime.setObjectProperty('Cube', 'rotation', { x: 0, y: 0.785, z: 0 })

// Set scale
runtime.setObjectProperty('Cube', 'scale', 2) // uniform
runtime.setObjectProperty('Cube', 'scale', { x: 2, y: 1, z: 1 }) // non-uniform

// Visibility
runtime.setObjectProperty('Cube', 'visible', false)
```

### Variables & Events

```javascript
// Set variable
runtime.setVariable('speed', 10)
runtime.setVariable('cube_color', '#ff0000')

// Get variable
const speed = runtime.getVariable('speed')

// Emit event
runtime.emitEvent('explode', { force: 100 })

// Listen for events
runtime.addEventListener('click', (event) => {
  console.log('Object clicked:', event.target)
})
```

### Presets

```javascript
// Save current state
await runtime.savePreset('ready', ['Cube', 'Sphere', 'Camera'])

// Load preset
await runtime.loadPreset('ready')

// List presets
const presets = await runtime.listPresets()
// [{ name: 'ready', objects: 3, timestamp: '...' }]

// Capture state
const state = runtime.captureState(['Cube', 'Sphere'])
// { objects: {...}, variables: {...}, timestamp: '...' }

// Apply state
runtime.applyState(state)
```

---

## Browser Extension API

### Execute Commands

```javascript
// From content script
chrome.runtime.sendMessage({
  action: 'executeCommand',
  command: 'make cube red'
}, (response) => {
  console.log(response)
})

// From external page
window.postMessage({
  type: 'SPLINE_COMMAND',
  command: 'rotate sphere 45 degrees'
}, '*')
```

### Execute Workflows

```javascript
chrome.runtime.sendMessage({
  action: 'executeWorkflow',
  workflowId: 'nl-command-processor',
  input: {
    command: 'move cube up'
  }
}, (response) => {
  console.log(response)
})
```

### Get Scene Info

```javascript
chrome.runtime.sendMessage({
  action: 'getSceneInfo'
}, (response) => {
  console.log(response)
  // { objects: [...], variables: [...], loaded: true }
})
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Toggle command overlay |
| `I` | Inspect object |
| `V` | Toggle viewer connection |
| `E` | Execute last command |
| `S` | Save preset |
| `Esc` | Close overlay |

---

## Troubleshooting

### Commands Not Executing

1. **Check API server**: Verify `npm run api-server` is running
2. **Check console**: Press F12 for error messages
3. **Verify scene loaded**: Spline scene must be fully loaded
4. **Check OpenAI key**: Verify `.env` has valid `OPENAI_API_KEY`
5. **Restart extension**: Reload at chrome://extensions

### API Server Issues

1. **Server not starting**: Check `.env` file has `OPENAI_API_KEY`
2. **Port in use**: Change port with `API_PORT=8082` in `.env`
3. **Check logs**: API server shows execution details
4. **Test health**: Visit http://localhost:8081/health

### AI Taking Too Long

1. **Normal latency**: 2-5 seconds for simple commands, 5-10 for complex
2. **Check internet**: OpenAI API requires connection
3. **Rate limits**: Verify OpenAI quota not exceeded
4. **Simplify command**: Break complex operations into steps

### Objects Not Found

1. **Check object names**: Must match exactly (case-insensitive)
2. **Visual Agent**: Will detect objects automatically via screenshots
3. **Check visibility**: Hidden objects can't be manipulated
4. **Reload scene**: Refresh Spline page if needed

---

## Best Practices

### Command Writing

1. **Be specific**: "move cube to (10, 20, 30)" vs "move cube"
2. **Use full names**: "Cube1" instead of just "Cube" if multiple
3. **One step at a time**: Break complex operations into steps
4. **Check feedback**: Wait for confirmation before next command

### Performance

1. **Batch operations**: Use single command for multiple objects
2. **Add delays**: For animations, space out commands
3. **Save presets**: Reuse common configurations
4. **Limit complexity**: Keep workflows under 20 steps

### Organization

1. **Name objects clearly**: Use descriptive names in Spline
2. **Set up variables**: Pre-configure variables for properties
3. **Use events**: Design event-driven interactions
4. **Document workflows**: Add descriptions to SIM.ai workflows

---

## Examples Gallery

### Product Showcase

```javascript
// Rotate product 360 degrees
"create 360 rotation showcase"

// Exploded view
"create exploded view with 50 unit spacing"

// Color cycling
"cycle through rainbow colors every 500ms"
```

### Architectural Walkthrough

```javascript
// Camera path
"create camera path from entrance to rooftop"

// Room-by-room
"show living room, hide all other rooms"

// Lighting sequence
"dim ambient light and spotlight the kitchen"
```

### Character Animation

```javascript
// Walk cycle
"animate character walking 10 steps forward"

// Jump sequence
"make character jump and rotate 360 degrees"

// Expression change
"morph character face from happy to sad"
```

---

## API Reference

See complete documentation:
- [Spline Editing Capabilities](./SPLINE_EDITING_CAPABILITIES.md)
- [Command Parser Source](./src/spline-command-parser.js)
- [Runtime API Source](./src/spline-runtime.js)
- [SIM.ai Workflows](./simai-workflows/)

---

## Next Steps

1. ✅ Review all documentation
2. ⏳ Import workflows into SIM.ai
3. ⏳ Test basic commands
4. ⏳ Create custom workflows
5. ⏳ Build GUI controls
6. ⏳ Add voice control
7. ⏳ Deploy production version

---

## Support & Resources

- **Documentation**: This repository
- **SIM.ai Docs**: http://localhost:3003/docs
- **Spline API**: https://docs.spline.design/runtime
- **Issues**: Create GitHub issues for bugs
- **Examples**: Check `/docs/examples/` directory

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
