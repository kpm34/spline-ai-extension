# Workflow: Create Glass Button

## Description
Creates a glass-styled button in Spline with customizable properties.

## Input (from GUI Form)
```json
{
  "material": {
    "type": "glass",
    "transparency": 0.7,
    "color": "#4A90E2"
  },
  "object": {
    "type": "button",
    "width": 200,
    "height": 50,
    "depth": 10
  },
  "text": {
    "content": "Click Me",
    "font": "Inter",
    "size": 18,
    "color": "#FFFFFF"
  },
  "interaction": {
    "type": "onClick",
    "action": "navigate",
    "target": "/page"
  },
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  }
}
```

## SIM.ai Workflow Steps

### 1. Parse Input
**Node Type**: Input Parser
- Extract material properties
- Extract object dimensions
- Extract text content
- Extract interaction settings

### 2. Generate Spline Commands
**Node Type**: Code Generator (AI)
- Use GPT-4 to generate Spline CLI commands
- Context: "Create a 3D button with glass material"

**Prompt Template**:
```
Create Spline CLI commands for:
- Box object: {width}x{height}x{depth}
- Glass material: {transparency}, {color}
- Text label: "{content}", font {font}, size {size}
- Position: x:{x}, y:{y}, z:{z}
- Click event: {action} to {target}
```

### 3. Execute Commands
**Node Type**: HTTP Request
- POST to Spline API
- Execute generated commands

### 4. Return Result
**Node Type**: Output
```json
{
  "success": true,
  "objectId": "button_12345",
  "commands": [...],
  "preview": "https://..."
}
```

## Testing in SIM.ai

1. Create workflow in Studio
2. Add nodes as described above
3. Test with sample form data
4. Verify Spline object is created correctly

## Integration with Extension

Extension sends form data → SIM workflow generates commands → Commands execute in Spline → Result shown to user
