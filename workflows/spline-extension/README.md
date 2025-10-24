# SIM.ai Workflows for Spline Chrome Extension

## Overview

These workflows power the Chrome extension's AI functionality:
- **Input**: GUI form data (Material, Interaction, Text, etc.)
- **Processing**: SIM.ai generates Spline commands
- **Output**: Executed via Spline API

## Workflow Types

### 1. Material Application Workflows
- `create-material.json` - Create custom materials
- `apply-material.json` - Apply materials to objects

### 2. Object Creation Workflows
- `create-button.json` - Create interactive buttons
- `create-shape.json` - Create 3D shapes

### 3. Interaction Workflows
- `add-click-event.json` - Add click interactions
- `add-hover-effect.json` - Add hover effects

### 4. Text Workflows
- `add-text-label.json` - Add text to objects

## Using in SIM.ai Studio

1. Open http://localhost:3003
2. Create new workflow
3. Use these templates as starting points
4. Test with sample form data

## API Integration

Extension will call workflows via SIM API:
```javascript
const response = await fetch('http://localhost:3003/api/workflows/run', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SIM_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workflowId: 'create-glass-button',
    input: formData
  })
});
```
