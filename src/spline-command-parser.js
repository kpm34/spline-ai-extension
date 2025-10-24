require('dotenv').config({ silent: true });
const OpenAI = require('openai');

/**
 * SplineCommandParser - Natural Language to Spline API Translator
 *
 * Converts natural language commands into Spline API calls
 * Uses GPT-4o-mini for cost-effective NLP processing
 */
class SplineCommandParser {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Spline operation templates
    this.operations = {
      position: {
        patterns: ['move', 'place', 'position', 'translate', 'shift'],
        api: 'setObjectProperty',
        property: 'position'
      },
      rotation: {
        patterns: ['rotate', 'turn', 'spin', 'flip', 'orient'],
        api: 'setObjectProperty',
        property: 'rotation'
      },
      scale: {
        patterns: ['scale', 'resize', 'size', 'grow', 'shrink', 'expand', 'stretch'],
        api: 'setObjectProperty',
        property: 'scale'
      },
      visibility: {
        patterns: ['hide', 'show', 'visible', 'invisible', 'toggle'],
        api: 'setObjectProperty',
        property: 'visible'
      },
      color: {
        patterns: ['color', 'paint', 'tint', 'shade'],
        api: 'setVariable',
        property: 'color'
      },
      variable: {
        patterns: ['set', 'change', 'update', 'assign'],
        api: 'setVariable',
        property: null
      },
      event: {
        patterns: ['trigger', 'fire', 'emit', 'activate', 'start'],
        api: 'emitEvent',
        property: null
      }
    };
  }

  /**
   * Parse natural language command using AI
   */
  async parse(command) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      console.error('Failed to parse command:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * System prompt for AI parser
   */
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

Important Rules:
- Extract ALL objects mentioned in the command
- For compound commands, create multiple command objects
- Use radians for rotation (deg * π/180)
- Colors must be hex format (#RRGGBB)
- Position/rotation/scale use {x, y, z} objects
- Boolean values for visibility: true/false
- If direction mentioned: up=+y, down=-y, left=-x, right=+x, forward=-z, back=+z
- If relative movement, add "relative: true" field

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
}

Input: "rotate the camera 45 degrees on the y axis"
Output: {
  "commands": [{
    "action": "setObjectProperty",
    "object": "camera",
    "property": "rotation",
    "value": {"x": 0, "y": 0.785, "z": 0},
    "description": "Rotate camera 45° on Y axis (0.785 radians)"
  }],
  "summary": "Rotate camera 45 degrees on Y axis"
}

Input: "scale the cube by 2"
Output: {
  "commands": [{
    "action": "setObjectProperty",
    "object": "cube",
    "property": "scale",
    "value": 2,
    "description": "Scale cube uniformly by factor of 2"
  }],
  "summary": "Double the size of cube"
}

Input: "trigger the explosion event"
Output: {
  "commands": [{
    "action": "emitEvent",
    "event": "explosion",
    "value": {},
    "description": "Trigger explosion event"
  }],
  "summary": "Fire explosion event"
}`;
  }

  /**
   * Validate and normalize parsed commands
   */
  validateAndNormalize(parsed) {
    if (!parsed.commands || !Array.isArray(parsed.commands)) {
      return {
        success: false,
        error: 'Invalid command structure'
      };
    }

    const normalizedCommands = parsed.commands.map(cmd => {
      // Normalize object names (lowercase, trim)
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

  /**
   * Execute parsed commands via SplineRuntime
   */
  async execute(parsed, runtime) {
    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const results = [];

    for (const cmd of parsed.commands) {
      try {
        let result;

        switch (cmd.action) {
          case 'setObjectProperty':
            result = runtime.setObjectProperty(cmd.object, cmd.property, cmd.value);
            break;

          case 'setVariable':
            result = runtime.setVariable(cmd.variable, cmd.value);
            break;

          case 'emitEvent':
            result = runtime.emitEvent(cmd.event, cmd.value || {});
            break;

          default:
            result = { success: false, error: `Unknown action: ${cmd.action}` };
        }

        results.push({
          command: cmd.description,
          result: result,
          success: result.success !== false
        });

      } catch (error) {
        results.push({
          command: cmd.description,
          result: { success: false, error: error.message },
          success: false
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results: results,
      summary: parsed.summary,
      executed: results.length
    };
  }

  /**
   * Get help for command syntax
   */
  getHelp() {
    return {
      operations: Object.entries(this.operations).map(([key, op]) => ({
        operation: key,
        patterns: op.patterns,
        api: op.api,
        examples: this.getExamples(key)
      })),
      syntax: {
        objects: 'Use object names as they appear in Spline (case-insensitive)',
        position: '(x, y, z) or "left/right/up/down/forward/back"',
        rotation: 'degrees (auto-converted to radians)',
        scale: 'number (uniform) or (x, y, z)',
        colors: 'hex (#FF0000) or name (red, blue, etc.)',
        visibility: 'hide/show or true/false'
      }
    };
  }

  /**
   * Get example commands for operation type
   */
  getExamples(operation) {
    const examples = {
      position: [
        'move cube to (10, 20, 30)',
        'place sphere at origin',
        'shift camera left 10 units'
      ],
      rotation: [
        'rotate cube 45 degrees',
        'turn sphere 90 degrees on y axis',
        'flip camera upside down'
      ],
      scale: [
        'make cube twice as big',
        'scale sphere to 50%',
        'stretch cylinder vertically by 2'
      ],
      visibility: [
        'hide the cube',
        'show all spheres',
        'toggle visibility of camera'
      ],
      color: [
        'make cube red',
        'color sphere #FF5733',
        'paint cylinder blue'
      ],
      variable: [
        'set speed to 10',
        'change rotation state to true',
        'set animation to false'
      ],
      event: [
        'trigger explosion',
        'fire click event',
        'start rotation animation'
      ]
    };

    return examples[operation] || [];
  }

  /**
   * Batch parse multiple commands
   */
  async parseBatch(commands) {
    const results = await Promise.all(
      commands.map(cmd => this.parse(cmd))
    );

    return {
      success: results.every(r => r.success),
      results: results,
      total: commands.length,
      successful: results.filter(r => r.success).length
    };
  }

  /**
   * Suggest commands based on context
   */
  async suggest(context) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Spline 3D scene editor assistant. Suggest relevant commands based on the current context. Respond with 3-5 command suggestions as a JSON array of strings.'
          },
          {
            role: 'user',
            content: `Current context: ${JSON.stringify(context)}\n\nSuggest helpful commands the user might want to try.`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      return suggestions.commands || suggestions.suggestions || [];
    } catch (error) {
      return [
        'move cube to (0, 10, 0)',
        'rotate sphere 45 degrees',
        'hide all objects',
        'make cube red',
        'scale all objects by 2'
      ];
    }
  }
}

module.exports = { SplineCommandParser };
