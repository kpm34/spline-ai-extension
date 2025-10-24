# User Query Flow: Frontend to Backend

Complete trace of how a user's natural language query flows through the AI-powered Spline editing system.

---

## Overview Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AT APP.SPLINE.DESIGN                    │
│                   Types: "make the cube red"                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CHROME EXTENSION - FRONTEND (content.js)                    │
│     • User presses Ctrl+K to open overlay                       │
│     • Types command in input field                              │
│     • Clicks send button or presses Enter                       │
│     • content.js:440 executeAIPrompt(prompt)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CHROME RUNTIME MESSAGE (content.js → background.js)         │
│     • chrome.runtime.sendMessage({                              │
│         action: 'executeGUIWorkflow',                           │
│         formData: { prompt, context },                          │
│         apiKey: simaiApiKey                                     │
│       })                                                         │
│     • content.js:463-467                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. BACKGROUND SERVICE WORKER (background.js)                   │
│     • Receives message: background.js:12                        │
│     • Routes to executeGUIWorkflow()                            │
│     • Gets workflow ID from settings                            │
│     • background.js:154-202                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SIM.AI WORKFLOW API (localhost:3003)                        │
│     • POST http://localhost:3003/api/workflows/{id}/execute     │
│     • Headers:                                                  │
│       - x-api-key: {user's API key}                            │
│       - Content-Type: application/json                         │
│     • Body:                                                     │
│       {                                                         │
│         "inputs": {                                             │
│           "prompt": "make the cube red",                        │
│           "context": { material, object, text, ... }            │
│         }                                                       │
│       }                                                         │
│     • background.js:175-184                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. SIM.AI WORKFLOW ORCHESTRATION                               │
│     • Workflow receives inputs                                  │
│     • Processes through workflow nodes                          │
│     • Invokes Three-Agent System                                │
│     • Returns execution ID                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. THREE-AGENT SYSTEM (src/three-agent-system.js)              │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  AGENT 1: PLANNING AGENT (GPT-4o-mini)               │  │
│     │  • three-agent-system.js:33-76                        │  │
│     │  • Analyzes user command                              │  │
│     │  • Breaks down into steps                             │  │
│     │  • Identifies prerequisites                           │  │
│     │  • Returns JSON plan:                                 │  │
│     │    {                                                  │  │
│     │      intent: "Change cube color to red",             │  │
│     │      steps: [                                         │  │
│     │        {                                              │  │
│     │          id: 1,                                       │  │
│     │          action: "Find cube object",                 │  │
│     │          requires_vision: true,                      │  │
│     │          validation_criteria: "Cube exists"          │  │
│     │        },                                             │  │
│     │        {                                              │  │
│     │          id: 2,                                       │  │
│     │          action: "Set cube color to red",            │  │
│     │          requires_vision: false                      │  │
│     │        }                                              │  │
│     │      ]                                                │  │
│     │    }                                                  │  │
│     └───────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  AGENT 2: VISUAL AGENT (GPT-4o + Vision)             │  │
│     │  • three-agent-system.js:78-164                       │  │
│     │  • Takes screenshot of Spline canvas                  │  │
│     │  • Analyzes scene using GPT-4o Vision                │  │
│     │  • Detects objects and their properties              │  │
│     │  • Returns JSON analysis:                             │  │
│     │    {                                                  │  │
│     │      observation: "Scene has a blue cube...",        │  │
│     │      objects_detected: ["Cube", "Sphere"],           │  │
│     │      current_state: {                                 │  │
│     │        "Cube": {                                      │  │
│     │          position: "center",                         │  │
│     │          color: "blue",                              │  │
│     │          visibility: true                            │  │
│     │        }                                              │  │
│     │      },                                               │  │
│     │      recommended_actions: [                           │  │
│     │        {                                              │  │
│     │          action: "setVariable",                      │  │
│     │          object: "Cube",                             │  │
│     │          property: "color",                          │  │
│     │          value: "#ff0000",                           │  │
│     │          reasoning: "Change to red hex"              │  │
│     │        }                                              │  │
│     │      ]                                                │  │
│     │    }                                                  │  │
│     └───────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│     ┌───────────────────────────────────────────────────────┐  │
│     │  AGENT 3: EDITOR AGENT (Executor)                    │  │
│     │  • three-agent-system.js:166-227                      │  │
│     │  • Receives recommended actions                       │  │
│     │  • Executes each command via SplineRuntime           │  │
│     │  • For each command:                                  │  │
│     │    - Identifies action type                          │  │
│     │    - Calls appropriate runtime method                │  │
│     │    - Captures result                                  │  │
│     │  • Returns execution summary:                         │  │
│     │    {                                                  │  │
│     │      executed: 1,                                     │  │
│     │      successful: 1,                                   │  │
│     │      failed: 0,                                       │  │
│     │      results: [...]                                   │  │
│     │    }                                                  │  │
│     └───────────────────────┬───────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. SPLINE RUNTIME API (src/spline-runtime.js)                  │
│     • Wraps @splinetool/runtime official SDK                    │
│     • Executes actual scene manipulation                        │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  setObjectProperty(objectName, property, value)     │    │
│     │  • Finds object: app.findObjectByName('Cube')       │    │
│     │  • Sets property based on type:                     │    │
│     │    - position: obj.position.set(x, y, z)            │    │
│     │    - rotation: obj.rotation.set(x, y, z)            │    │
│     │    - scale: obj.scale.set(x, y, z)                  │    │
│     │    - visible: obj.visible = value                   │    │
│     │  • spline-runtime.js:80-170                         │    │
│     └─────────────────────────────────────────────────────┘    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  setVariable(name, value)                           │    │
│     │  • Sets Spline variable (like color)                │    │
│     │  • app.setVariable(name, value)                     │    │
│     │  • spline-runtime.js:172-186                        │    │
│     └─────────────────────────────────────────────────────┘    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  emitEvent(eventName, data)                         │    │
│     │  • Triggers Spline events                           │    │
│     │  • app.emitEvent(eventName, data)                   │    │
│     │  • spline-runtime.js:188-202                        │    │
│     └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. ACTUAL SPLINE SCENE (3D Canvas)                             │
│     • @splinetool/runtime modifies WebGL scene                  │
│     • Changes are immediately visible to user                   │
│     • Cube changes from blue to red                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. VALIDATION (Three-Agent System)                             │
│     • Visual Agent takes another screenshot                     │
│     • Validates changes were applied                            │
│     • Confirms: "Cube is now red ✓"                            │
│     • three-agent-system.js:269-280                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. RESPONSE TO FRONTEND                                       │
│      • Results flow back through:                               │
│      • Three-Agent System → SIM.ai → Background Worker          │
│      • background.js returns response                           │
│      • content.js receives response                             │
│      • content.js:469-474 displays result                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  11. USER SEES RESULT                                           │
│      • Overlay shows: "✅ AI workflow executed successfully!"   │
│      • Cube is visually red in the scene                        │
│      • Execution ID displayed for tracking                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Code Flow

### 1. User Interaction (Frontend/content.js)

**File**: `Frontend/content.js`

```javascript
// User presses Ctrl+K → overlay opens
// User types: "make the cube red"
// User presses Enter or clicks send button

// content.js:440
async function executeAIPrompt(prompt) {
    addOutput(`> ${prompt}`, 'command');
    addOutput('🤖 Sending to AI...', 'info');

    // Get SIM.ai API key from storage
    const settings = await chrome.storage.sync.get(['simaiApiKey']);
    const apiKey = settings.simaiApiKey;

    // Combine prompt with form context
    const contextData = {
        prompt: prompt,
        context: formData  // Material, object, text, interaction, animation
    };

    // Send to background worker
    const response = await chrome.runtime.sendMessage({
        action: 'executeGUIWorkflow',
        formData: contextData,
        apiKey: apiKey
    });

    // Display result
    if (response.success) {
        addOutput('✅ AI workflow executed successfully!', 'success');
    } else {
        addOutput(`❌ Error: ${response.error}`, 'error');
    }
}
```

---

### 2. Background Worker (Frontend/background.js)

**File**: `Frontend/background.js`

```javascript
// background.js:12 - Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeGUIWorkflow') {
        executeGUIWorkflow(request.formData, request.apiKey)
            .then(response => sendResponse(response));
        return true;  // Async response
    }
});

// background.js:154
async function executeGUIWorkflow(formData, apiKey) {
    // Get workflow ID from settings
    const settings = await chrome.storage.sync.get(['splineWorkflowId']);
    const workflowId = settings.splineWorkflowId;

    // Execute workflow via SIM.ai API
    const response = await fetch(
        `http://localhost:3003/api/workflows/${workflowId}/execute`,
        {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: formData  // { prompt, context }
            })
        }
    );

    const data = await response.json();
    return {
        success: true,
        executionId: data.executionId,
        status: data.status
    };
}
```

---

### 3. SIM.ai Workflow Orchestration

**External Service**: `http://localhost:3003`

The SIM.ai workflow:
1. Receives the prompt and context
2. Routes through workflow nodes (LLM, API calls, transformations)
3. Invokes the Three-Agent System
4. Returns execution tracking ID

---

### 4. Three-Agent System (src/three-agent-system.js)

**File**: `src/three-agent-system.js`

```javascript
// Main execution entry point
// three-agent-system.js:232
async execute(userCommand) {
    console.log('🚀 Three-Agent System Starting...');

    // AGENT 1: Planning Agent (GPT-4o-mini)
    const plan = await this.planningAgent(userCommand);
    // Returns: { intent, steps, validation }

    // AGENT 2: Visual Agent (GPT-4o + Vision)
    const initialAnalysis = await this.visualAgent(
        `User wants to: ${plan.intent}. What is current state?`
    );
    // Takes screenshot, analyzes, returns recommended_actions

    // Execute each step
    for (const step of plan.steps) {
        // Get visual feedback if needed
        let visualAnalysis = initialAnalysis;
        if (step.requires_vision) {
            visualAnalysis = await this.visualAgent(step.vision_query);
        }

        // AGENT 3: Editor Agent
        const editorResult = await this.editorAgent(
            visualAnalysis.recommended_actions
        );

        // Validate changes
        const validationScreenshot = await this.page.screenshot();
        const validation = await this.visualAgent(
            `Verify: ${step.validation_criteria}`,
            validationScreenshot
        );
    }

    return { success: true, summary: ... };
}
```

#### Agent 1: Planning Agent

```javascript
// three-agent-system.js:33
async planningAgent(userCommand) {
    const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: 'You are the Planning Agent. Break down commands into steps.'
            },
            {
                role: 'user',
                content: userCommand
            }
        ]
    });

    return JSON.parse(response.choices[0].message.content);
}
```

#### Agent 2: Visual Agent

```javascript
// three-agent-system.js:78
async visualAgent(query, screenshot) {
    if (!screenshot) {
        screenshot = await this.page.screenshot({ encoding: 'base64' });
    }

    const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',  // Full GPT-4o with vision
        messages: [
            {
                role: 'system',
                content: 'You are the Visual Agent. Analyze screenshots.'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${screenshot}`,
                            detail: 'high'
                        }
                    },
                    {
                        type: 'text',
                        text: query
                    }
                ]
            }
        ]
    });

    return JSON.parse(response.choices[0].message.content);
}
```

#### Agent 3: Editor Agent

```javascript
// three-agent-system.js:170
async editorAgent(commands) {
    const results = [];

    for (const cmd of commands) {
        let result;

        switch (cmd.action) {
            case 'setObjectProperty':
                result = this.runtime.setObjectProperty(
                    cmd.object,
                    cmd.property,
                    cmd.value
                );
                break;

            case 'setVariable':
                result = this.runtime.setVariable(
                    cmd.variable,
                    cmd.value
                );
                break;

            case 'emitEvent':
                result = this.runtime.emitEvent(
                    cmd.event,
                    cmd.value
                );
                break;
        }

        results.push({ command: cmd, result, success: result.success });
    }

    return {
        executed: results.length,
        successful: results.filter(r => r.success).length,
        results: results
    };
}
```

---

### 5. Spline Runtime Execution (src/spline-runtime.js)

**File**: `src/spline-runtime.js`

```javascript
// spline-runtime.js:80
setObjectProperty(objectName, property, value) {
    // Find object in scene
    const obj = this.app.findObjectByName(objectName);

    if (!obj) {
        return { success: false, error: `Object "${objectName}" not found` };
    }

    // Set property based on type
    switch (property.toLowerCase()) {
        case 'position':
            obj.position.set(value.x, value.y, value.z);
            break;

        case 'rotation':
            obj.rotation.set(value.x, value.y, value.z);
            break;

        case 'scale':
            if (typeof value === 'number') {
                obj.scale.set(value, value, value);
            } else {
                obj.scale.set(value.x, value.y, value.z);
            }
            break;

        case 'visible':
            obj.visible = value;
            break;
    }

    return { success: true, object: objectName, property, value };
}

// spline-runtime.js:172
setVariable(name, value) {
    this.app.setVariable(name, value);
    return { success: true, variable: name, value };
}

// spline-runtime.js:188
emitEvent(eventName, data = {}) {
    this.app.emitEvent(eventName, data);
    return { success: true, event: eventName, data };
}
```

---

## Cost Breakdown

| Component | Model | Cost per Command |
|-----------|-------|------------------|
| Planning Agent | GPT-4o-mini | ~$0.0002 |
| Visual Agent (initial) | GPT-4o + Vision | ~$0.011 |
| Visual Agent (validation) | GPT-4o + Vision | ~$0.011 |
| Editor Agent | N/A (free) | $0 |
| **Total** | | **~$0.024** |

---

## Alternative Flow: Direct AI Parsing (Without SIM.ai)

For simpler commands, the extension can bypass SIM.ai and use direct OpenAI parsing:

```
User Input → content.js → background.js → ai-command-parser.js
    ↓
OpenAI GPT-4o-mini API (direct)
    ↓
Parsed commands → Execute in browser via injected Spline runtime
    ↓
Results displayed in overlay
```

**File**: `Frontend/ai-command-parser.js`

This parser:
1. Takes natural language command
2. Sends to OpenAI GPT-4o-mini with system prompt
3. Returns structured JSON commands
4. No three-agent system (simpler, faster, cheaper)
5. No visual validation
6. Best for simple commands like "move cube to (10,20,30)"

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `Frontend/content.js` | User interface, overlay, command input | 440-479 |
| `Frontend/background.js` | Message routing, SIM.ai API calls | 12-202 |
| `Frontend/ai-command-parser.js` | Direct OpenAI parsing (alternative flow) | 1-150 |
| `src/three-agent-system.js` | Three-agent orchestration | 33-299 |
| `src/spline-runtime.js` | Spline API wrapper | 80-202 |

---

## Execution Time

Typical flow timing:
- User input: 0ms
- Frontend → Background: ~10ms
- Background → SIM.ai: ~50ms
- SIM.ai → Three-Agent System: ~100ms
- Planning Agent (GPT-4o-mini): ~500-1000ms
- Visual Agent screenshot + analysis: ~1000-2000ms
- Editor Agent execution: ~100-500ms
- Validation screenshot + analysis: ~1000-2000ms
- Response → Frontend: ~50ms

**Total: 2-10 seconds**

---

## Error Handling

Errors can occur at any stage:

1. **Frontend**: No API key → Shows error in overlay
2. **Background**: No workflow ID → Returns error response
3. **SIM.ai**: API error → Returns error with status code
4. **Planning Agent**: Invalid command → Returns error JSON
5. **Visual Agent**: Screenshot failed → Retries or skips
6. **Editor Agent**: Object not found → Returns error for that command
7. **Runtime**: Invalid property → Returns error with details

All errors propagate back to the frontend and are displayed to the user.
