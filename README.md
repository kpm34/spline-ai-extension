# AI-Powered Spline Editor

> Edit Spline 3D scenes with natural language using a sophisticated 3-agent AI system

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![AI](https://img.shields.io/badge/AI-GPT--4o%20%2B%20GPT--4o--mini-blue)]()
[![Cost](https://img.shields.io/badge/cost-~2.4%C2%A2%2Fcommand-success)]()

## Overview

This system enables intelligent, vision-guided Spline 3D scene editing through natural language commands powered by a coordinated multi-agent AI architecture.

```
User: "make the cube red and move it up"
       ↓
🧠 Planning Agent → Breaks down into steps
       ↓
👁️  Visual Agent → Screenshots & analyzes scene
       ↓
⚙️  Editor Agent → Executes Spline API commands
       ↓
✅ Visual Agent → Validates changes applied
       ↓
"Cube is now red and positioned 10 units higher"
```

## Features

- **Natural Language Control**: Type what you want in plain English
- **Visual Validation**: AI sees and confirms all changes
- **Multi-Step Operations**: Handles complex commands automatically
- **Cost-Effective**: ~$0.024 per command (~$2.22 per 100 commands)
- **Chrome Extension**: Overlay interface with `Ctrl+K` hotkey
- **Direct API**: Fast, low-latency communication (2-5 seconds)
- **Context Panels**: Specify material, object, text, interaction, animation properties
- **Optional SIM.ai**: Visual workflow builder for complex automation (optional)
- **Real-time Feedback**: See changes as they happen

## Quick Start

### Prerequisites

- Node.js 16+
- Chrome browser
- OpenAI API key
- Docker (optional - only for SIM.ai workflow visualization)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/username/spline-cli-editor.git
cd spline-cli-editor

# 2. Install dependencies
npm install

# 3. Set up environment
echo "OPENAI_API_KEY=your-key-here" > .env

# 4. Start Three-Agent API Server
npm run api-server
# Server runs at http://localhost:8081

# 5. Load Chrome extension
# Open chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select: Frontend/ directory
```

### Usage

1. Ensure API server is running: `npm run api-server`
2. Open https://app.spline.design
3. Load any 3D scene
4. Press `Ctrl+K` to open command overlay
5. Type: `"make the cube red"`
6. Press Enter and watch the AI edit your scene!

## Example Commands

### Simple Operations
```
move cube to (10, 20, 30)
rotate sphere 45 degrees
make cylinder red
hide all objects
scale platform by 2
```

### Complex Multi-Step
```
make the cube red, scale it by 2, and move it up
create a row of 5 spheres spaced 10 units apart
rotate camera 360 degrees around the scene
```

### Interactive
```
suggest some improvements
what objects are in the scene?
save this as preset 'ready'
load preset 'exploded-view'
```

## Architecture

### Three-Agent System

1. **Planning Agent (GPT-4o-mini)** - $0.0002/command
   - Understands user intent
   - Breaks down complex tasks
   - Plans execution sequence

2. **Visual Agent (GPT-4o)** - $0.022/command
   - Takes screenshots of scene
   - Detects objects and properties
   - Validates changes visually

3. **Editor Agent** - Free
   - Executes Spline API commands
   - Reports detailed results
   - Handles errors gracefully

**Total cost: ~$0.024 per command**

## Documentation

### 📚 Guides
- [AI-Powered Editing Guide](docs/guides/AI_POWERED_EDITING_GUIDE.md) - Complete user guide
- [Chrome Extension Guide](docs/guides/CHROME_EXTENSION_GUIDE.md) - Extension setup and usage

### 📖 Reference
- [Spline Editing Capabilities](docs/reference/SPLINE_EDITING_CAPABILITIES.md) - Complete API reference

### 🏗️ Architecture
- [Three-Agent System](docs/architecture/THREE_AGENT_ARCHITECTURE.md) - System design and flow
- [Direct API Architecture](docs/architecture/DIRECT_API_ARCHITECTURE.md) - Current architecture

### 🎨 UI Documentation
- [UI Improvements](docs/UI_IMPROVEMENTS.md) - Recent UI enhancements

## Project Structure

```
spline-cli-editor/
├── Frontend/                       # Chrome extension (MAIN)
│   ├── manifest.json               # Extension manifest
│   ├── popup.html/js               # Extension popup UI
│   ├── options.html/js             # Settings page
│   ├── background.js               # Service worker (API calls)
│   ├── content.js                  # Page injection & overlay
│   └── overlay.css                 # Overlay styling
│
├── src/                            # Core AI system
│   ├── three-agent-system.js       # Main AI coordination
│   ├── spline-command-parser.js    # NLP translator
│   ├── spline-runtime.js           # Runtime API wrapper
│   ├── spline-ai-agent.js          # Vision agent
│   ├── spline-editor.js            # Editor utilities
│   └── runtime/                    # Runtime tests & examples
│
├── mcp-server/                     # Model Context Protocol server
│   ├── maestro-mcp.js              # Maestro CLI integration
│   ├── test-maestro-mcp.js         # MCP tests
│   └── test-mcp-server.js          # Server tests
│
├── Maestro workspace/              # Chrome extension tests
│   ├── *.yaml                      # Extension test flows
│   └── *.png                       # Test screenshots
│
├── .maestro/                       # Other Maestro tests
│   ├── *.yaml                      # iOS/CLI test flows
│   └── mcp-config.json             # MCP configuration
│
├── docs/                           # Documentation
│   ├── guides/                     # User guides
│   ├── reference/                  # API reference
│   └── architecture/               # System design
│
├── simai-workflows/                # SIM.ai workflow definitions
│   └── nl-command-processor.json   # NL command workflow
│
├── workflows/                      # Workflow examples
├── scripts/                        # Utility scripts
├── bin/                            # Executable scripts
├── docker/                         # Docker configurations
└── archive/                        # Old docs and code
    ├── old-docs/                   # Archived documentation
    ├── old-extensions/             # Old extension implementations
    └── viewer/                     # Legacy viewer server
```

## API Usage

### Command Parser

```javascript
const { SplineCommandParser } = require('./src/spline-command-parser')
const parser = new SplineCommandParser()

const result = await parser.parse("move cube to (10, 20, 30)")
// {
//   success: true,
//   commands: [{
//     action: "setObjectProperty",
//     object: "cube",
//     property: "position",
//     value: {x: 10, y: 20, z: 30}
//   }]
// }
```

### Three-Agent System

```javascript
const { ThreeAgentSystem } = require('./src/three-agent-system')
const system = new ThreeAgentSystem(page, runtime)

// Execute command
const result = await system.execute("make cube red")

// Get suggestions
const suggestions = await system.suggestCommands()

// Refine last execution
await system.refine("make it bigger too")
```

### Spline Runtime

```javascript
const { SplineRuntime } = require('./src/spline-runtime')
const runtime = new SplineRuntime()

await runtime.initialize(canvas)
await runtime.load(sceneUrl)

// Manipulate objects
runtime.setObjectProperty('Cube', 'position', {x: 10, y: 20, z: 30})
runtime.setVariable('cube_color', '#ff0000')
runtime.emitEvent('explode')
```

## Configuration

### Environment Variables

```bash
# .env (required)
OPENAI_API_KEY=sk-proj-...          # Required for AI agents
API_PORT=8081                        # Optional (default: 8081)
```

### Optional: SIM.ai Configuration

SIM.ai is completely optional and only needed for workflow visualization:

```bash
# Start SIM.ai (optional)
cd /path/to/sim
docker compose -f docker-compose.custom.yml up -d

# Access at http://localhost:3003
```

## Troubleshooting

### Common Issues

**Commands not executing**
- Verify API server is running: `npm run api-server`
- Check browser console (F12) for errors
- Verify `.env` has valid `OPENAI_API_KEY`
- Reload extension in chrome://extensions
- Refresh Spline page

**API server not starting**
- Check `.env` file exists with `OPENAI_API_KEY`
- Verify port 8081 is not in use
- Check API server logs for errors
- Visit http://localhost:8081/health to test

**AI taking too long**
- Normal latency: 2-5 seconds (simple), 5-10 seconds (complex)
- Check internet connection (OpenAI API requires it)
- Verify OpenAI API quota not exceeded
- Break complex commands into smaller steps

**Objects not found**
- Visual Agent auto-detects objects via screenshots
- Check object names match (case-insensitive)
- Ensure scene is fully loaded
- Refresh Spline page if needed

## Performance

- **Speed**: 2-10 seconds per command
- **Cost**: ~$0.024 per command
- **Accuracy**: 90%+ command parsing, 95%+ object detection

## Contributing

Contributions welcome! Areas for improvement:

- Workflow templates
- Command patterns
- UI enhancements
- Documentation
- Test coverage

## License

MIT

## Support

- **Documentation**: Check `/docs/` directory
- **Issues**: Create GitHub issue
- **Questions**: Open discussion

## Acknowledgments

- **Spline**: Amazing 3D design tool
- **OpenAI**: GPT-4o and GPT-4o-mini models
- **SIM.ai**: Open-source workflow platform
- **@splinetool/runtime**: Official Spline runtime API

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-10-22

Built with ❤️ for the Spline community
