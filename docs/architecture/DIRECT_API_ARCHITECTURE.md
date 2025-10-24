# Direct API Architecture

## Overview

The production architecture uses a **direct API** approach where the Chrome extension communicates with the Three-Agent System via a local REST API server. SIM.ai is **optional** and only used for workflow visualization and prototyping.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   CHROME EXTENSION                            │
│                   (Frontend/ directory)                       │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  content.js (UI Layer)                             │     │
│  │  • User input: "create glass button"               │     │
│  │  • GUI Context panels (material, object, etc.)     │     │
│  │  • Ctrl+K overlay                                  │     │
│  └──────────────────┬─────────────────────────────────┘     │
│                     │                                         │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  background.js (Service Worker)                     │    │
│  │  • Receives: { action: 'executeAICommand',         │    │
│  │               prompt, context }                     │    │
│  │  • Calls Three-Agent API at localhost:8081         │    │
│  └──────────────────┬──────────────────────────────────┘    │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │ /api/execute
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         THREE-AGENT API SERVER                               │
│         (src/api-server.js)                                  │
│         localhost:8081                                       │
│                                                              │
│  Express REST API wrapping Three-Agent System               │
│  • Session management                                        │
│  • Request routing                                           │
│  • Error handling                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         THREE-AGENT SYSTEM                                   │
│         (src/three-agent-system.js)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ AGENT 1: Planning Agent (GPT-4o-mini)             │    │
│  │ • Receives prompt + GUI context                    │    │
│  │ • Understands intent                               │    │
│  │ • Breaks down into steps                           │    │
│  │ • Cost: ~$0.0002/command                          │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼─────────────────────────────────┐    │
│  │ AGENT 2: Visual Agent (GPT-4o + Vision)           │    │
│  │ • Takes screenshot of Spline canvas                │    │
│  │ • Analyzes scene state                             │    │
│  │ • Recommends actions                               │    │
│  │ • Cost: ~$0.022/command                           │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼─────────────────────────────────┐    │
│  │ AGENT 3: Editor Agent                              │    │
│  │ • Executes commands via Spline Runtime             │    │
│  │ • Reports results                                   │    │
│  │ • Cost: Free                                        │    │
│  └──────────────────┬─────────────────────────────────┘    │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         SPLINE RUNTIME API                                   │
│         (src/spline-runtime.js)                              │
│                                                              │
│  Wraps @splinetool/runtime                                  │
│  • setObjectProperty(name, property, value)                 │
│  • setVariable(name, value)                                 │
│  • emitEvent(name, data)                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         ACTUAL SPLINE 3D SCENE                               │
│         WebGL Canvas at app.spline.design                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Benefits

### 1. **No SIM.ai Dependency**
- SIM.ai is completely optional
- Only used for workflow visualization/prototyping
- Extension works standalone with just the API server

### 2. **Lower Latency**
- Direct communication (no extra hop through SIM.ai)
- Faster response times (2-5 seconds vs 5-10 seconds)
- Better user experience

### 3. **Full Context Awareness**
- Planning Agent receives complete GUI context
- Material properties (type, transparency, roughness, color)
- Object properties (type, dimensions, position)
- Text properties (content, font, size)
- Interaction properties (events, actions)
- Animation properties (duration, easing, effects)

### 4. **Simpler Architecture**
- Fewer moving parts
- Easier to debug
- Clearer error messages
- Less configuration required

### 5. **Better Separation of Concerns**
- Frontend: User interface (Chrome extension)
- Backend: AI processing (Three-Agent System)
- Optional: Workflow visualization (SIM.ai)

---

## API Endpoints

### Health Check
```
GET /health
Response: {
  status: "healthy",
  service: "Three-Agent System API",
  version: "1.0.0",
  uptime: 12345,
  sessions: 1
}
```

### Initialize Session
```
POST /api/session/init
Body: {
  sceneUrl: "https://app.spline.design/file/xxx"
}
Response: {
  success: true,
  sessionId: "session_xxx",
  message: "Session initialized successfully"
}
```

### Execute Command
```
POST /api/execute
Body: {
  sessionId: "session_xxx",  // optional
  prompt: "make the cube red",
  context: {
    material: { type: "glass", transparency: 0.7 },
    object: { type: "button", width: 200, height: 50 },
    text: { content: "Click Me" },
    interaction: { type: "onClick", action: "navigate" },
    animation: { type: "hover", duration: 0.3 }
  }
}
Response: {
  success: true,
  executionId: "exec_xxx",
  result: {
    userCommand: "make the cube red",
    guiContext: {...},
    plan: { intent, steps, validation },
    steps: [...],
    success: true,
    timestamp: 1234567890
  }
}
```

### Get Suggestions
```
POST /api/suggest
Body: {
  sessionId: "session_xxx"
}
Response: {
  success: true,
  suggestions: [
    { action, object, property, value, reasoning }
  ]
}
```

### Close Session
```
POST /api/session/close
Body: {
  sessionId: "session_xxx"
}
Response: {
  success: true,
  message: "Session closed successfully"
}
```

---

## Usage Flow

### 1. Start the API Server
```bash
npm run api-server
# Server starts at http://localhost:8081
```

### 2. Load Chrome Extension
- Open `chrome://extensions/`
- Load unpacked from `Frontend/` directory
- Extension auto-connects to API server

### 3. Use the Extension
- Open Spline scene at `app.spline.design`
- Press `Ctrl+K` to open overlay
- Optional: Set context in side panels (material, object, etc.)
- Type command: "create glass button"
- Press Enter

### 4. Behind the Scenes
- Extension sends to API: `{ prompt, context }`
- API server initializes session (if needed)
- Planning Agent analyzes with context
- Visual Agent screenshots and analyzes
- Editor Agent executes commands
- Visual Agent validates changes
- Results sent back to extension
- User sees success message + updated scene

---

## Error Handling

### API Server Not Running
```
Error: Three-Agent API server not running
Solution: Start it with: npm run api-server
```

### OpenAI API Key Missing
```
Error: OPENAI_API_KEY not configured
Solution: Add to .env file
```

### Session Not Found
```
Error: Session not found
Solution: Initialize session first or omit sessionId (uses default)
```

### Scene Load Failed
```
Error: Failed to load scene
Solution: Check sceneUrl is valid and accessible
```

---

## Configuration

### Environment Variables (.env)
```bash
OPENAI_API_KEY=sk-proj-...    # Required
API_PORT=8081                  # Optional (default: 8081)
NODE_ENV=development           # Optional
```

### Extension Settings (optional)
- No API key required for basic usage
- OpenAI key only needed for direct parsing (fallback mode)

---

## SIM.ai Integration (Optional)

SIM.ai can still be used for:

### 1. Workflow Visualization
- Visual node-based representation of the Three-Agent System
- Helps understand the flow
- Prototyping new workflows

### 2. Complex Automation
- Multi-step workflows with branching logic
- Integration with other APIs
- Scheduled execution
- Batch operations

### How to Use SIM.ai (Optional)
```bash
# Start SIM.ai
cd /Users/kashyapmaheshwari/sim
docker compose -f docker-compose.custom.yml up -d

# Access at http://localhost:3003
# Create workflows visually
# Export workflow definitions to simai-workflows/
```

The Chrome extension has **both** modes:
- **Default**: Direct API (fast, simple)
- **Optional**: SIM.ai workflows (complex automation)

---

## Performance Comparison

### Direct API (Current)
- **Latency**: 2-5 seconds
- **Hops**: 2 (Extension → API → Spline)
- **Cost**: ~$0.024/command
- **Reliability**: High (fewer failure points)

### SIM.ai Route (Old)
- **Latency**: 5-10 seconds
- **Hops**: 3 (Extension → SIM.ai → API → Spline)
- **Cost**: ~$0.024/command (same)
- **Reliability**: Medium (more failure points)

**Winner**: Direct API ✅

---

## Future Enhancements

### 1. WebSocket Support
- Real-time streaming updates
- Progress indicators for each agent
- Live feedback during execution

### 2. Session Persistence
- Save sessions across API restarts
- Resume interrupted executions
- Session history and playback

### 3. Batch Operations
- Execute multiple commands in sequence
- Parallel execution when possible
- Transaction-like behavior (rollback on failure)

### 4. Caching
- Cache common planning results
- Cache visual analysis for similar scenes
- Reduce API costs

---

## Migration Guide

If you have existing SIM.ai workflows:

### Option 1: Continue Using SIM.ai
The extension still supports SIM.ai workflows. No changes needed.

### Option 2: Migrate to Direct API
1. Start the API server: `npm run api-server`
2. Extension will auto-detect and prefer direct API
3. SIM.ai workflows still available as fallback

### Option 3: Hybrid Approach
- Use direct API for simple commands (default)
- Use SIM.ai for complex workflows (when needed)
- Toggle in extension settings (future feature)

---

## Summary

The Direct API Architecture provides:
- ✅ **Faster** response times
- ✅ **Simpler** architecture
- ✅ **Better** context awareness
- ✅ **Easier** debugging
- ✅ **Optional** SIM.ai (not required)
- ✅ **Production** ready

Start using it today:
```bash
npm run api-server
```
