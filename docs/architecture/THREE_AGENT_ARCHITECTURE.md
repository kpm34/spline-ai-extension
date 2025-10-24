# Three-Agent System Architecture

## Overview

The Three-Agent System provides intelligent, vision-guided Spline 3D scene editing through a coordinated multi-agent workflow.

```
┌─────────────────────────────────────────────────────────────┐
│                       USER INPUT                             │
│              "make the cube red and bigger"                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT 1: Planning Agent (GPT-4o-mini)                      │
│  - Understands user intent                                  │
│  - Breaks down into steps                                   │
│  - Plans execution sequence                                 │
│  - Identifies prerequisites                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Plan: {steps, intent, validation}
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT 2: Visual VLM (GPT-4o with vision)                   │
│  - Screenshots current scene                                │
│  - Detects objects and properties                           │
│  - Formats necessary changes                                │
│  - Provides context for Editor                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Actions: [{action, object, property, value}]
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT 3: Editor Agent                                      │
│  - Executes Spline API commands                            │
│  - Reports success/failure                                  │
│  - Captures execution results                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Results
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT 2: Visual VLM (Validation)                           │
│  - Screenshots updated scene                                │
│  - Verifies changes were applied                            │
│  - Confirms expected outcome                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEEDBACK TO USER                          │
│            "✅ Cube is now red and 2x bigger"               │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Roles

### Agent 1: Planning Agent (GPT-4o-mini)

**Purpose**: Strategic thinking and task decomposition

**Responsibilities**:
- Parse natural language user commands
- Understand user intent
- Break complex tasks into atomic steps
- Identify prerequisites and dependencies
- Plan execution sequence
- Define validation criteria

**Model**: GPT-4o-mini ($0.15/MTok input, $0.60/MTok output)
**Why**: Cost-effective for text-only planning tasks

**Example Input**:
```
"make the cube red and move it to the right"
```

**Example Output**:
```json
{
  "intent": "Change cube color to red and reposition it right",
  "steps": [
    {
      "id": 1,
      "action": "Set cube color to red",
      "requires_vision": true,
      "vision_query": "What is the current color of the cube?",
      "command_template": "setVariable('cube_color', '#ff0000')",
      "validation_criteria": "Cube should appear red in the scene"
    },
    {
      "id": 2,
      "action": "Move cube to the right",
      "requires_vision": true,
      "vision_query": "What is the cube's current position?",
      "command_template": "setObjectProperty('Cube', 'position', {x: current.x + 10, y: current.y, z: current.z})",
      "validation_criteria": "Cube should be 10 units right of original position"
    }
  ],
  "prerequisites": ["Cube must exist in scene", "Scene must be loaded"],
  "expected_outcome": "Red cube positioned to the right"
}
```

---

### Agent 2: Visual VLM (GPT-4o with Vision)

**Purpose**: Visual understanding and validation

**Responsibilities**:
- Analyze screenshots of Spline UI
- Detect objects, colors, positions
- Understand current scene state
- Format changes for Editor Agent
- Validate that changes were applied
- Provide visual feedback

**Model**: GPT-4o ($5/MTok input, $15/MTok output for images)
**Why**: Multimodal capabilities for visual analysis

**Example Input**:
```
Screenshot + Query: "What is the current color of the cube?"
```

**Example Output**:
```json
{
  "observation": "Scene contains a blue cube in the center, a sphere on the left, and a camera",
  "objects_detected": ["Cube", "Sphere", "Camera"],
  "current_state": {
    "Cube": {
      "position": "approximately center (0, 0, 0)",
      "color": "#5b8fff (blue)",
      "visibility": true,
      "scale": "normal (1:1:1)"
    },
    "Sphere": {
      "position": "left side (-50, 0, 0)",
      "color": "#ff5b8f (pink)",
      "visibility": true
    }
  },
  "recommended_actions": [
    {
      "action": "setVariable",
      "object": "Cube",
      "variable": "cube_color",
      "value": "#ff0000",
      "reasoning": "Change cube from current blue to red"
    }
  ],
  "validation_points": [
    "Cube color should change from blue to red",
    "Other objects should remain unchanged"
  ]
}
```

---

### Agent 3: Editor Agent

**Purpose**: Command execution and result reporting

**Responsibilities**:
- Execute Spline Runtime API calls
- Handle errors gracefully
- Report detailed results
- Track execution history
- Provide feedback for validation

**Implementation**: Direct API calls (no AI model)

**Example Input**:
```json
[
  {
    "action": "setVariable",
    "variable": "cube_color",
    "value": "#ff0000"
  },
  {
    "action": "setObjectProperty",
    "object": "Cube",
    "property": "position",
    "value": {"x": 10, "y": 0, "z": 0}
  }
]
```

**Example Output**:
```json
{
  "executed": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "command": { "action": "setVariable", "variable": "cube_color", "value": "#ff0000" },
      "result": { "success": true },
      "success": true,
      "timestamp": 1729594800000
    },
    {
      "command": { "action": "setObjectProperty", "object": "Cube", "property": "position", "value": {"x": 10, "y": 0, "z": 0} },
      "result": { "success": true },
      "success": true,
      "timestamp": 1729594800100
    }
  ]
}
```

---

## Execution Flow

### 1. User Input Phase

```javascript
const system = new ThreeAgentSystem(page, runtime)
const result = await system.execute("make the cube red and move it right")
```

### 2. Planning Phase

**Planning Agent**:
- Receives: "make the cube red and move it right"
- Analyzes: User wants color change + position change
- Outputs: 2-step plan with validation criteria

### 3. Vision Phase (Initial)

**Visual Agent**:
- Takes screenshot of current Spline scene
- Detects: Cube (blue), Sphere (pink), Camera
- Identifies: Cube current position (0, 0, 0)
- Recommends: Color change command, position change command

### 4. Execution Phase

**Editor Agent**:
- Executes: `setVariable('cube_color', '#ff0000')`
- Executes: `setObjectProperty('Cube', 'position', {x: 10, y: 0, z: 0})`
- Reports: Both commands successful

### 5. Validation Phase

**Visual Agent**:
- Takes screenshot of updated scene
- Verifies: Cube is now red
- Verifies: Cube moved to the right
- Confirms: Expected outcome achieved

### 6. Feedback Phase

**System**:
- Returns: Success report to user
- Logs: Execution history
- Displays: "✅ Cube is now red and positioned to the right"

---

## Advantages

### 1. Visual Understanding
- Sees actual UI state, not just API responses
- Detects visual properties (colors, positions)
- Validates changes visually

### 2. Context Awareness
- Understands scene composition
- Identifies object relationships
- Detects potential conflicts

### 3. Error Recovery
- Sees when commands fail visually
- Can retry with adjusted parameters
- Provides meaningful error messages

### 4. Natural Language
- Users describe what they want, not how to do it
- System figures out implementation details
- Handles complex multi-step operations

### 5. Validation
- Confirms changes were applied correctly
- Detects unintended side effects
- Provides visual proof of completion

---

## Cost Analysis

### Per Command Execution

**Planning Agent (GPT-4o-mini)**:
- Input: ~1,000 tokens (system prompt + command)
- Output: ~300 tokens (plan)
- Cost: $0.0002 per command

**Visual Agent (GPT-4o) - Initial**:
- Input: ~1,500 tokens + 1 image (~1,000 tokens)
- Output: ~300 tokens
- Cost: ~$0.012 per screenshot

**Editor Agent**:
- Cost: $0 (direct API calls)

**Visual Agent (GPT-4o) - Validation**:
- Input: ~1,000 tokens + 1 image (~1,000 tokens)
- Output: ~200 tokens
- Cost: ~$0.010 per validation

**Total per command**: ~$0.024 (~2.4 cents)

### For 100 Commands

- Planning: 100 × $0.0002 = $0.02
- Initial Vision: 100 × $0.012 = $1.20
- Validation Vision: 100 × $0.010 = $1.00
- **Total**: ~$2.22 for 100 commands

**Very cost-effective for production use!**

---

## Usage Examples

### Example 1: Simple Color Change

```javascript
const system = new ThreeAgentSystem(page, runtime)

// User command
const result = await system.execute("make the cube red")

// Output:
// 🧠 Agent 1 (Planning): Analyzing command...
// 📋 Plan: Change cube color to red
//    Steps: 1
// 👁️  Agent 2 (Visual): Analyzing scene...
//    Detected: Cube, Sphere, Camera
//    Actions: 1
// ⚙️  Agent 3 (Editor): Executing commands...
//    → setVariable on "Cube" (color: "#ff0000")
//    ✅ setVariable succeeded
// 🔍 Validating changes...
// 👁️  Agent 2 (Visual): Analyzing scene...
// ✅ Execution Complete
//    Steps: 1/1
//    Success: 1
```

### Example 2: Complex Multi-Step

```javascript
// User command
const result = await system.execute(
  "create a row of 5 cubes, each one red, spaced 10 units apart"
)

// Planning Agent breaks this down:
// 1. Identify cube to clone
// 2. Create 4 clones
// 3. Position each clone 10 units apart
// 4. Set all to red color
// 5. Verify final layout

// Visual Agent guides each step with screenshots
// Editor Agent executes 20+ commands
// Final validation confirms row of 5 red cubes
```

### Example 3: With Refinement

```javascript
// Initial attempt
let result = await system.execute("make the scene look better")

// User feedback
result = await system.refine("the cube should be bigger and centered")

// System adjusts based on feedback
// Planning Agent creates refined plan
// Visual Agent analyzes new requirements
// Editor Agent executes improved commands
```

---

## Integration Points

### 1. Browser Extension

```javascript
// In content.js
import { ThreeAgentSystem } from './three-agent-system'

const system = new ThreeAgentSystem(puppeteerPage, splineRuntime)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'threeAgentExecute') {
    system.execute(request.command).then(sendResponse)
    return true // async response
  }
})
```

### 2. SIM.ai Workflow

```json
{
  "blocks": [
    {
      "type": "trigger",
      "config": { "type": "webhook" }
    },
    {
      "type": "function",
      "config": {
        "code": "return await threeAgentSystem.execute(input.command)"
      }
    },
    {
      "type": "output"
    }
  ]
}
```

### 3. CLI Interface

```bash
# Interactive mode
$ spline-edit ai-mode

> make the cube red
🧠 Planning... 📸 Analyzing... ⚙️ Executing... ✅ Done!

> suggest commands
💡 Suggestions:
1. "rotate cube 45 degrees"
2. "add a sphere next to cube"
3. "change lighting to dramatic"
```

---

## Advanced Features

### 1. Conversation Mode

```javascript
// Multi-turn refinement
await system.execute("create a product showcase")
await system.refine("make it more dramatic")
await system.refine("add subtle animation")
```

### 2. Suggestion Engine

```javascript
// Get contextual suggestions
const suggestions = await system.suggestCommands()
// ["rotate product 360 degrees", "add spotlight", "zoom camera closer"]
```

### 3. History & Replay

```javascript
// View execution history
const history = system.getHistory()
// { executions: 5, successful: 4, failed: 1, history: [...] }

// Replay previous command
const lastCommand = history.history[history.history.length - 1]
await system.execute(lastCommand.userCommand)
```

### 4. Debug Mode

```javascript
// Enable detailed logging
system.enableDebug()

// Shows intermediate results from each agent
await system.execute("complex command")

system.disableDebug()
```

---

## Best Practices

### 1. Clear Commands
- ✅ "make the cube red and move it to the right"
- ❌ "do something with the cube"

### 2. Let Agents Do Their Job
- Planning Agent handles task breakdown
- Visual Agent handles scene understanding
- Editor Agent handles execution

### 3. Provide Feedback
- Use `refine()` to improve results
- Be specific about what needs adjustment

### 4. Trust Validation
- Visual Agent confirms changes
- Don't assume success without validation

### 5. Monitor Costs
- Each command uses 2 GPT-4o vision calls
- Consider batching related commands
- Use planning agent to minimize visual calls

---

## Troubleshooting

### Issue: Vision Agent Can't Detect Objects

**Solution**: Ensure objects have clear visual boundaries and names in Spline

### Issue: Commands Not Executing

**Solution**: Check Editor Agent logs for specific errors

### Issue: Validation Fails

**Solution**: Visual Agent may need more time for UI to update (increase delay)

### Issue: High Costs

**Solution**: Batch related commands, use planning agent to optimize

---

## Future Enhancements

1. **Caching**: Cache visual analyses for same scenes
2. **Streaming**: Stream agent thoughts in real-time
3. **Learning**: Learn from user refinements
4. **Optimization**: Reduce vision calls through better planning
5. **Multi-Scene**: Handle multiple scenes simultaneously

---

## API Reference

```javascript
const system = new ThreeAgentSystem(page, runtime)

// Execute command
await system.execute(userCommand)

// Refine last execution
await system.refine(feedback)

// Get suggestions
await system.suggestCommands()

// View history
system.getHistory()

// Debug mode
system.enableDebug()
system.disableDebug()
```

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
