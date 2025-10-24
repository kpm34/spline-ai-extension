# Workflow: Add Hover Effect

## Description
Adds hover animations and effects to Spline objects.

## Input (from GUI Form)
```json
{
  "target": {
    "objectId": "button_12345",
    "selector": ".glass-button"
  },
  "interaction": {
    "type": "onHover"
  },
  "animation": {
    "scale": 1.1,
    "duration": 0.3,
    "easing": "ease-out"
  },
  "effects": {
    "glow": true,
    "glowColor": "#4A90E2",
    "glowIntensity": 0.5
  }
}
```

## SIM.ai Workflow Steps

### 1. Validate Target Object
**Node Type**: Validator
- Check if object exists in Spline scene
- Verify object supports hover events

### 2. Generate Animation Code
**Node Type**: Code Generator (AI)

**Prompt**:
```
Generate Spline animation code for hover effect:
- Target: {objectId}
- Scale to {scale} over {duration}s
- Easing: {easing}
- Add glow effect: {glowColor}, intensity {glowIntensity}
```

### 3. Apply to Object
**Node Type**: API Call
- Update object properties
- Attach event listener

### 4. Return Configuration
**Node Type**: Output
```json
{
  "success": true,
  "effectId": "hover_67890",
  "preview": {
    "before": "url",
    "after": "url"
  }
}
```

## Usage in Extension

User selects object → Fills hover effect form → Submits → SIM generates animation → Applied to Spline object
