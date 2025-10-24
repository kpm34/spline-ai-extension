# Spline Editing Capabilities Reference

## Overview

This document catalogs all available Spline editing operations that can be performed through the AI agent, enabling natural language control of 3D scenes.

## Table of Contents

1. [Object Manipulation](#object-manipulation)
2. [Material & Color Control](#material--color-control)
3. [Camera Operations](#camera-operations)
4. [Scene Management](#scene-management)
5. [Animation & Events](#animation--events)
6. [Advanced Operations](#advanced-operations)

---

## Object Manipulation

### Position Control

**Operations:**
- Move object to absolute position
- Move object relative to current position
- Align objects
- Distribute objects in space

**API Methods:**
```javascript
// Via SplineRuntime
runtime.setObjectProperty(objectName, 'position', { x, y, z })
runtime.getObjectProperty(objectName, 'position')

// Via Spline Runtime API
obj.position.set(x, y, z)
obj.position.x = value
```

**Natural Language Examples:**
- "Move the cube to position (10, 20, 30)"
- "Move the sphere 5 units up"
- "Place the cylinder at the origin"
- "Move the camera behind the cube"
- "Center the object"

### Rotation Control

**Operations:**
- Rotate object on X/Y/Z axis
- Set absolute rotation
- Rotate relative to current orientation
- Look at target

**API Methods:**
```javascript
runtime.setObjectProperty(objectName, 'rotation', { x, y, z })
obj.rotation.set(x, y, z)
```

**Natural Language Examples:**
- "Rotate the cube 45 degrees on Y axis"
- "Flip the sphere upside down"
- "Make the camera look at the cube"
- "Rotate the object 90 degrees clockwise"

### Scale Control

**Operations:**
- Uniform scaling
- Non-uniform scaling (different per axis)
- Reset scale to 1:1:1

**API Methods:**
```javascript
runtime.setObjectProperty(objectName, 'scale', { x, y, z })
runtime.setObjectProperty(objectName, 'scale', 2) // uniform
obj.scale.set(x, y, z)
```

**Natural Language Examples:**
- "Make the cube twice as big"
- "Scale the sphere to 50%"
- "Stretch the cylinder vertically"
- "Reset the object's scale"

### Visibility Control

**Operations:**
- Show/hide objects
- Toggle visibility
- Show/hide multiple objects

**API Methods:**
```javascript
runtime.setObjectProperty(objectName, 'visible', true/false)
obj.visible = boolean
```

**Natural Language Examples:**
- "Hide the cube"
- "Show all spheres"
- "Make the platform invisible"
- "Toggle visibility of the camera"

---

## Material & Color Control

### Color Manipulation

**Operations:**
- Change object color
- Set transparency/opacity
- Apply gradients
- Material presets

**API Methods:**
```javascript
// Via Spline variables (if set up in scene)
runtime.setVariable('objectColor', '#ff0000')

// Direct material access (if exposed)
obj.material.color.set(r, g, b)
```

**Natural Language Examples:**
- "Make the cube red"
- "Change the sphere to blue"
- "Set the cylinder color to #FF5733"
- "Make the object semi-transparent"
- "Apply metallic material to the cube"

### Material Properties

**Operations:**
- Metalness control
- Roughness control
- Emissive properties
- Texture mapping

**Natural Language Examples:**
- "Make the sphere metallic"
- "Increase roughness of the cube"
- "Make the object glow"
- "Apply glossy finish"

---

## Camera Operations

### Camera Positioning

**Operations:**
- Move camera to position
- Orbit around target
- Look at object
- Fly to location

**API Methods:**
```javascript
const camera = runtime.findObject('Camera')
camera.position.set(x, y, z)
camera.rotation.set(x, y, z)
```

**Natural Language Examples:**
- "Move camera to (0, 100, 200)"
- "Point camera at the cube"
- "Orbit camera around the scene"
- "Zoom in on the sphere"

### Camera Properties

**Operations:**
- Field of view (FOV) adjustment
- Depth of field
- Camera switching

**Natural Language Examples:**
- "Widen the camera angle"
- "Add depth of field blur"
- "Switch to top view camera"
- "Set FOV to 45 degrees"

---

## Scene Management

### Object Creation & Deletion

**Operations:**
- Clone existing objects
- Delete objects
- Create primitive shapes (if supported)

**API Methods:**
```javascript
// Cloning (simulated in editor)
editor.cloneObject('Cube', count, offset)
```

**Natural Language Examples:**
- "Create 5 copies of the cube"
- "Clone the sphere and place it at (10, 0, 0)"
- "Delete the cylinder"
- "Duplicate the entire platform"

### Grouping & Hierarchy

**Operations:**
- Group objects together
- Ungroup objects
- Parent-child relationships

**Natural Language Examples:**
- "Group the cubes together"
- "Make the sphere a child of the platform"
- "Ungroup the selection"

---

## Animation & Events

### Variable Control

**Operations:**
- Set Spline variables
- Get variable values
- Trigger state changes

**API Methods:**
```javascript
runtime.setVariable(name, value)
runtime.getVariable(name)
```

**Natural Language Examples:**
- "Set the speed variable to 10"
- "Change the rotation state to true"
- "Get the current animation speed"

### Event Triggering

**Operations:**
- Emit custom events
- Listen for events
- Trigger animations

**API Methods:**
```javascript
runtime.emitEvent(eventName, data)
runtime.addEventListener(eventName, callback)
```

**Natural Language Examples:**
- "Trigger the explosion event"
- "Start the rotation animation"
- "Fire the click event on the button"

---

## Advanced Operations

### Batch Operations

**Operations:**
- Apply changes to multiple objects
- Bulk transformations
- Pattern creation

**API Methods:**
```javascript
editor.batchUpdate(objectNames, property, value)
```

**Natural Language Examples:**
- "Hide all cubes"
- "Move all spheres up by 10 units"
- "Make all red objects blue"
- "Scale all objects by 2"

### Presets & States

**Operations:**
- Save scene state
- Load presets
- Reset to initial state

**API Methods:**
```javascript
runtime.savePreset(name, objectNames)
runtime.loadPreset(name)
runtime.captureState(objectNames)
runtime.applyState(state)
```

**Natural Language Examples:**
- "Save this as preset 'ready'"
- "Load the 'exploded-view' preset"
- "Reset to initial state"
- "Capture current camera position"

### Code Execution

**Operations:**
- Run custom JavaScript
- Execute complex transformations
- Batch operations via code

**API Methods:**
```javascript
editor.executeCode(code)
```

**Natural Language Examples:**
- "Run: rotate all objects 45 degrees"
- "Execute the custom animation sequence"
- "Apply physics simulation"

---

## Spline Runtime API Reference

### Core Methods

```javascript
// Scene Management
app.load(url)                          // Load .splinecode URL
app.findObjectByName(name)             // Find object by name

// Object Properties
obj.position.set(x, y, z)              // Set position
obj.rotation.set(x, y, z)              // Set rotation (radians)
obj.scale.set(x, y, z)                 // Set scale
obj.visible = boolean                  // Show/hide

// Variables & Events
app.setVariable(name, value)           // Set Spline variable
app.getVariable(name)                  // Get Spline variable
app.emitEvent(eventName, data)         // Trigger event
app.addEventListener(eventName, cb)    // Listen for event

// Extended (via wrapper)
runtime.setObjectProperty(name, prop, value)
runtime.getObjectProperty(name, prop)
runtime.captureState(objectNames)
runtime.applyState(state)
```

---

## Natural Language to API Mapping

### Common Patterns

| Natural Language | API Call |
|-----------------|----------|
| "Move X to (a,b,c)" | `runtime.setObjectProperty('X', 'position', {x:a, y:b, z:c})` |
| "Rotate X 45 degrees" | `runtime.setObjectProperty('X', 'rotation', {x:0, y:0.785, z:0})` |
| "Scale X by 2" | `runtime.setObjectProperty('X', 'scale', 2)` |
| "Hide X" | `runtime.setObjectProperty('X', 'visible', false)` |
| "Make X red" | `runtime.setVariable('X_color', '#ff0000')` |
| "Set speed to 10" | `runtime.setVariable('speed', 10)` |
| "Trigger explode" | `runtime.emitEvent('explode')` |

### AI Agent Processing Flow

```
1. User Input: "Make the cube red and move it up"
2. NLP Parsing: Extract entities and actions
   - Objects: ["cube"]
   - Actions: ["change color to red", "move up"]
3. API Translation:
   - runtime.setVariable('cube_color', '#ff0000')
   - runtime.setObjectProperty('cube', 'position', {x:0, y:10, z:0})
4. Execution: Run commands sequentially
5. Feedback: "Cube is now red and moved 10 units up"
```

---

## Limitations & Workarounds

### Current Limitations

1. **No Scene Graph Traversal**: Cannot list all objects automatically
   - **Workaround**: Maintain object registry, use AI vision to detect objects

2. **Limited Material API**: Direct material access limited
   - **Workaround**: Use Spline variables for color/material control

3. **No Primitive Creation**: Cannot create new geometry
   - **Workaround**: Clone existing objects, hide template objects

4. **No File Export**: Cannot export from runtime
   - **Workaround**: Use browser automation to access File menu

### Best Practices

1. **Object Naming**: Use clear, descriptive names in Spline
2. **Variable Setup**: Pre-configure variables for common properties
3. **Event System**: Design event-driven architecture for complex interactions
4. **State Management**: Use presets for common configurations
5. **Error Handling**: Always validate object existence before manipulation

---

## Example Workflows

### Workflow 1: Product Showcase Animation

```javascript
// User: "Create a 360 rotation showcase"
const camera = runtime.findObject('Camera')
const product = runtime.findObject('Product')

// Position product at center
runtime.setObjectProperty('Product', 'position', {x:0, y:0, z:0})

// Animate camera orbit (via variable)
for (let angle = 0; angle < 360; angle += 5) {
  const rad = angle * (Math.PI / 180)
  const x = Math.cos(rad) * 200
  const z = Math.sin(rad) * 200

  camera.position.set(x, 100, z)
  camera.lookAt(product.position)

  await new Promise(r => setTimeout(r, 50))
}
```

### Workflow 2: Exploded View

```javascript
// User: "Create an exploded view"
const parts = ['Part1', 'Part2', 'Part3', 'Part4']

for (const part of parts) {
  const obj = runtime.findObject(part)
  const direction = obj.position.clone().normalize()

  // Move each part outward from center
  runtime.setObjectProperty(part, 'position', {
    x: direction.x * 50,
    y: direction.y * 50,
    z: direction.z * 50
  })
}
```

### Workflow 3: Color Cycling

```javascript
// User: "Cycle through rainbow colors"
const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']

for (const color of colors) {
  runtime.setVariable('cube_color', color)
  await new Promise(r => setTimeout(r, 500))
}
```

---

## Integration Points

### Browser Extension Integration

The Chrome extension provides the bridge between AI and Spline:

```javascript
// content.js injects commands into Spline page
window.splineRuntime.setObjectProperty('Cube', 'position', {x:10, y:20, z:30})

// background.js handles AI processing
const command = await aiAgent.parseCommand(userInput)
chrome.tabs.sendMessage(tabId, { action: 'executeCommand', command })
```

### SIM.ai Workflow Integration

Create workflows for complex operations:

1. **LLM Block**: Parse natural language
2. **Function Block**: Translate to API calls
3. **API Block**: Execute Spline commands
4. **Loop Block**: Animate over time

### Voice Control Integration

```javascript
// User speaks: "Make it bigger"
const transcript = await voiceAPI.recognize()
const command = await aiAgent.parseCommand(transcript)
await splineRuntime.executeCommand(command)
```

---

## Next Steps

1. [ ] Implement comprehensive NLP parser
2. [ ] Build command validation system
3. [ ] Create visual GUI controls
4. [ ] Set up SIM.ai workflows
5. [ ] Add voice control
6. [ ] Build preset library
7. [ ] Create tutorial system

---

## Resources

- **Spline Runtime API**: https://docs.spline.design/runtime
- **@splinetool/runtime**: npm package for scene control
- **Spline Variables**: Custom state management in Spline
- **Spline Events**: Event-driven interactions

---

**Last Updated**: 2025-10-22
**Version**: 1.0.0
