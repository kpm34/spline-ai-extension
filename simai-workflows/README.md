# SIM.ai Workflows for Spline Editing

This directory contains pre-built SIM.ai workflows for common Spline editing operations.

## Available Workflows

### 1. Natural Language Command Processor
**File**: `nl-command-processor.json`
**Description**: Processes natural language commands and executes them on Spline scenes
**Tags**: `spline`, `nlp`, `automation`

**Flow**:
1. HTTP Trigger receives command text
2. LLM Block parses natural language
3. Function Block translates to Spline API
4. HTTP Block sends commands to browser extension
5. Response with execution results

### 2. Batch Object Modifier
**File**: `batch-object-modifier.json`
**Description**: Applies same modification to multiple objects at once
**Tags**: `spline`, `batch`, `efficiency`

**Flow**:
1. Input: object names array, property, value
2. Loop through each object
3. Apply modification
4. Collect results

### 3. Animation Sequence Creator
**File**: `animation-sequence.json`
**Description**: Creates complex animation sequences from simple descriptions
**Tags**: `spline`, `animation`, `sequence`

**Flow**:
1. LLM interprets animation description
2. Generates keyframes
3. Sends timed commands to Spline
4. Monitors execution

### 4. Scene State Manager
**File**: `scene-state-manager.json`
**Description**: Save, load, and manage scene presets
**Tags**: `spline`, `presets`, `state`

**Flow**:
1. Capture current scene state
2. Store in database
3. Retrieve and apply presets
4. Version control for scenes

### 5. AI Scene Optimizer
**File**: `scene-optimizer.json`
**Description**: Analyzes scene and suggests optimizations
**Tags**: `spline`, `optimization`, `ai`

**Flow**:
1. Get scene object data
2. LLM analyzes structure
3. Suggests improvements
4. Optionally apply changes

### 6. Voice Command Handler
**File**: `voice-command-handler.json`
**Description**: Process voice commands for hands-free editing
**Tags**: `spline`, `voice`, `accessibility`

**Flow**:
1. Receive audio/transcript
2. Convert speech to text (if needed)
3. Parse command
4. Execute on Spline

### 7. 3D Layout Generator
**File**: `layout-generator.json`
**Description**: Automatically arrange objects in patterns
**Tags**: `spline`, `layout`, `generation`

**Flow**:
1. Input: objects, pattern type (grid, circle, spiral)
2. Calculate positions
3. Apply to all objects
4. Return layout data

### 8. Material Palette Manager
**File**: `material-palette.json`
**Description**: Manage and apply color/material palettes
**Tags**: `spline`, `materials`, `design`

**Flow**:
1. Define color palette
2. Map to objects
3. Apply materials
4. Save palette for reuse

### 9. Camera Path Creator
**File**: `camera-path.json`
**Description**: Create smooth camera animations between points
**Tags**: `spline`, `camera`, `cinematics`

**Flow**:
1. Define waypoints
2. Calculate smooth path
3. Generate camera movements
4. Export animation data

### 10. Interactive Tutorial System
**File**: `tutorial-system.json`
**Description**: Guide users through Spline operations step-by-step
**Tags**: `spline`, `tutorial`, `education`

**Flow**:
1. Load tutorial steps
2. Highlight relevant UI
3. Execute example commands
4. Verify completion

## Installation

### Method 1: Via Web UI

1. Open SIM.ai at http://localhost:3003
2. Go to Workflows → Import
3. Select workflow JSON file
4. Click Import

### Method 2: Via API

```bash
curl -X POST http://localhost:3003/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @nl-command-processor.json
```

### Method 3: Via Browser Extension

1. Open extension popup
2. Go to Workflows tab
3. Click "Import Workflow"
4. Select JSON file

## Usage

### Triggering Workflows

**From Browser Extension**:
```javascript
chrome.runtime.sendMessage({
  action: 'executeWorkflow',
  workflowId: 'nl-command-processor',
  input: {
    command: "make the cube red"
  }
})
```

**From HTTP Request**:
```bash
curl -X POST http://localhost:3003/api/v1/workflows/nl-command-processor/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "move cube to (10, 20, 30)"}'
```

**From JavaScript**:
```javascript
const response = await fetch('http://localhost:3003/api/v1/workflows/nl-command-processor/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: "rotate sphere 45 degrees" })
})
const result = await response.json()
```

## Workflow Structure

All workflows follow this structure:

```json
{
  "name": "Workflow Name",
  "description": "What this workflow does",
  "version": "1.0.0",
  "tags": ["spline", "category"],
  "blocks": [
    {
      "id": "block-1",
      "type": "trigger",
      "config": {
        "type": "webhook"
      }
    },
    {
      "id": "block-2",
      "type": "llm",
      "config": {
        "model": "gpt-4o-mini",
        "prompt": "Process this command: {{input.command}}"
      }
    }
  ],
  "connections": [
    {
      "from": "block-1",
      "to": "block-2"
    }
  ]
}
```

## Block Types

- **trigger**: HTTP webhook, event, schedule
- **llm**: GPT-4, Claude, or local models
- **function**: JavaScript code execution
- **api**: HTTP requests
- **router**: Conditional branching
- **loop**: Iterate over arrays
- **delay**: Wait between operations
- **output**: Return data

## Environment Variables

Add to SIM.ai `.env`:

```bash
# OpenAI for NLP
OPENAI_API_KEY=your_key_here

# Spline Browser Extension
SPLINE_EXTENSION_URL=http://localhost:8080

# Database for state management
DATABASE_URL=postgresql://user:pass@localhost:5432/simstudio
```

## Best Practices

1. **Error Handling**: Always include error handlers
2. **Rate Limiting**: Add delays between batch operations
3. **Validation**: Validate inputs before execution
4. **Logging**: Log all operations for debugging
5. **Versioning**: Use semantic versioning for workflows

## Customization

### Adding New Operations

1. Create new block in workflow
2. Define input/output schema
3. Connect to existing blocks
4. Test with sample data

### Example: Custom Color Cycle

```json
{
  "id": "color-cycle",
  "type": "function",
  "config": {
    "code": "const colors = ['#ff0000', '#00ff00', '#0000ff']; return { colors }"
  }
}
```

## Troubleshooting

### Workflow Not Executing
- Check SIM.ai logs: `docker compose logs -f simstudio`
- Verify workflow is active in UI
- Confirm all required blocks are connected

### Commands Not Reaching Spline
- Ensure browser extension is loaded
- Check extension popup for connection status
- Verify localhost:3003 is accessible

### AI Parsing Errors
- Check OpenAI API key is valid
- Verify model is available (gpt-4o-mini)
- Review command syntax

## Examples

### Simple Command

```javascript
// Input
{
  "command": "move cube to (10, 20, 30)"
}

// Output
{
  "success": true,
  "commands": [
    {
      "action": "setObjectProperty",
      "object": "cube",
      "property": "position",
      "value": {"x": 10, "y": 20, "z": 30}
    }
  ]
}
```

### Complex Multi-Step

```javascript
// Input
{
  "command": "make the cube red, scale it by 2, and move it up"
}

// Output
{
  "success": true,
  "commands": [
    { "action": "setVariable", "variable": "cube_color", "value": "#ff0000" },
    { "action": "setObjectProperty", "object": "cube", "property": "scale", "value": 2 },
    { "action": "setObjectProperty", "object": "cube", "property": "position", "value": {"x": 0, "y": 10, "z": 0} }
  ]
}
```

## Next Steps

1. Import workflows into SIM.ai
2. Test each workflow with sample data
3. Customize for your specific needs
4. Create your own workflows
5. Share with community

## Resources

- [SIM.ai Documentation](http://localhost:3003/docs)
- [Spline API Reference](/docs/SPLINE_EDITING_CAPABILITIES.md)
- [Browser Extension Guide](/CHROME_EXTENSION_GUIDE.md)
