// AI Command Parser for Browser Extension
// Simplified version that works in browser context

class AICommandParser {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async parse(command) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Go to Settings to add your key.'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 300,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: command
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      return this.validateAndNormalize(parsed);
    } catch (error) {
      console.error('Failed to parse command:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSystemPrompt() {
    return `You are a Spline 3D scene command parser. Convert natural language to structured API calls.

Available Operations:
1. POSITION: Move objects in 3D space
   - API: setObjectProperty(objectName, 'position', {x, y, z})
   - Examples: "move cube to (10,20,30)", "shift sphere left"

2. ROTATION: Rotate objects (use radians)
   - API: setObjectProperty(objectName, 'rotation', {x, y, z})
   - Examples: "rotate cube 45 degrees", "flip sphere upside down"
   - Note: Convert degrees to radians (degrees * Math.PI / 180)

3. SCALE: Resize objects
   - API: setObjectProperty(objectName, 'scale', {x, y, z} or number)
   - Examples: "make cube bigger", "scale sphere by 2"

4. VISIBILITY: Show/hide objects
   - API: setObjectProperty(objectName, 'visible', boolean)
   - Examples: "hide cube", "show all spheres"

5. COLOR: Change object colors
   - API: setVariable(variableName, colorValue)
   - Examples: "make cube red", "color sphere #FF5733"
   - Use hex format for colors

6. VARIABLE: Set Spline variables
   - API: setVariable(name, value)
   - Examples: "set speed to 10", "change rotation state to true"

7. EVENT: Trigger Spline events
   - API: emitEvent(eventName, data)
   - Examples: "trigger explosion", "fire click event"

Respond with JSON ONLY:
{
  "commands": [
    {
      "action": "setObjectProperty|setVariable|emitEvent",
      "object": "object name or null",
      "property": "position|rotation|scale|visible|null",
      "value": value (object, number, boolean, or string),
      "variable": "variable name if setVariable",
      "event": "event name if emitEvent",
      "description": "human readable description"
    }
  ],
  "summary": "overall command summary"
}

Examples:

Input: "move the cube to position 10, 20, 30"
Output: {
  "commands": [{
    "action": "setObjectProperty",
    "object": "cube",
    "property": "position",
    "value": {"x": 10, "y": 20, "z": 30},
    "description": "Move cube to (10, 20, 30)"
  }],
  "summary": "Position cube at coordinates (10, 20, 30)"
}

Input: "make the sphere red and hide the cylinder"
Output: {
  "commands": [
    {
      "action": "setVariable",
      "object": "sphere",
      "variable": "sphere_color",
      "value": "#ff0000",
      "description": "Set sphere color to red"
    },
    {
      "action": "setObjectProperty",
      "object": "cylinder",
      "property": "visible",
      "value": false,
      "description": "Hide cylinder"
    }
  ],
  "summary": "Change sphere to red and hide cylinder"
}`;
  }

  validateAndNormalize(parsed) {
    if (!parsed.commands || !Array.isArray(parsed.commands)) {
      return {
        success: false,
        error: 'Invalid command structure'
      };
    }

    const normalizedCommands = parsed.commands.map(cmd => {
      // Normalize object names (trim)
      if (cmd.object) {
        cmd.object = cmd.object.trim();
      }

      // Ensure value types are correct
      if (cmd.property === 'visible') {
        cmd.value = Boolean(cmd.value);
      }

      // Add timing info
      cmd.timestamp = Date.now();

      return cmd;
    });

    return {
      success: true,
      commands: normalizedCommands,
      summary: parsed.summary || 'Command parsed successfully',
      count: normalizedCommands.length
    };
  }

  // Get example commands
  getExamples() {
    return [
      'move cube to (10, 20, 30)',
      'rotate sphere 45 degrees',
      'make cylinder red',
      'hide all objects',
      'scale platform by 2',
      'make the cube red and move it up',
      'create a row of 5 spheres',
      'trigger explosion event'
    ];
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AICommandParser };
}
