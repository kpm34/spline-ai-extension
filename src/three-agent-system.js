require('dotenv').config({ silent: true });
const OpenAI = require('openai');
const { SplineRuntime } = require('./spline-runtime');

/**
 * Three-Agent System for Intelligent Spline Editing
 *
 * Agent 1: Planning/Research Agent (GPT-4o-mini) - Understands intent and plans
 * Agent 2: Visual VLM (GPT-4o) - Analyzes screenshots and validates changes
 * Agent 3: Editor Agent - Executes commands and reports back
 *
 * Flow:
 * 1. User types command → Planning Agent breaks it down
 * 2. Visual Agent screenshots current state → formats changes
 * 3. Editor executes commands → Visual Agent validates results
 */
class ThreeAgentSystem {
  constructor(page, runtime) {
    this.page = page; // Puppeteer page for screenshots
    this.runtime = runtime; // SplineRuntime instance
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.conversationHistory = [];
    this.executionHistory = [];
  }

  /**
   * AGENT 1: Planning/Research Agent
   * Uses GPT-4o-mini for cost-effective planning
   */
  async planningAgent(userCommand) {
    console.log('🧠 Agent 1 (Planning): Analyzing command...');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are the Planning Agent for a 3-agent Spline 3D editing system.

Your role:
1. Understand user intent and break down into actionable steps
2. Identify what information is needed from the Visual Agent
3. Plan the sequence of operations
4. Consider edge cases and prerequisites

Respond with JSON:
{
  "intent": "What the user wants to achieve",
  "steps": [
    {
      "id": 1,
      "action": "description of action",
      "requires_vision": true/false,
      "vision_query": "What to look for in screenshot",
      "command_template": "API command template",
      "validation_criteria": "How to verify success"
    }
  ],
  "prerequisites": ["Things that must be checked first"],
  "expected_outcome": "Final state after all steps"
}`
        },
        {
          role: 'user',
          content: `User command: "${userCommand}"\n\nPlan the steps needed to execute this command on a Spline 3D scene.`
        }
      ]
    });

    const plan = JSON.parse(response.choices[0].message.content);

    console.log(`📋 Plan: ${plan.intent}`);
    console.log(`   Steps: ${plan.steps.length}`);

    return plan;
  }

  /**
   * AGENT 2: Visual VLM
   * Uses GPT-4o with vision to analyze UI and validate changes
   */
  async visualAgent(query, screenshot = null) {
    console.log('👁️  Agent 2 (Visual): Analyzing scene...');

    // Capture screenshot if not provided
    if (!screenshot) {
      screenshot = await this.page.screenshot({
        encoding: 'base64',
        fullPage: false
      });
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Use full GPT-4o for vision
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are the Visual Agent in a 3-agent Spline 3D editing system.

Your role:
1. Analyze screenshots of Spline 3D scenes
2. Identify objects, their properties, and current state
3. Determine what changes need to be made
4. Format commands for the Editor Agent
5. Validate that changes were applied correctly

Respond with JSON:
{
  "observation": "What you see in the screenshot",
  "objects_detected": ["list of objects visible"],
  "current_state": {
    "object_name": {
      "position": "approx position",
      "color": "color if visible",
      "visibility": true/false
    }
  },
  "recommended_actions": [
    {
      "action": "setObjectProperty|setVariable|emitEvent",
      "object": "object name",
      "property": "property to change",
      "value": "new value",
      "reasoning": "why this change"
    }
  ],
  "validation_points": ["Things to check after execution"]
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: 'high' // Use high detail for better analysis
              }
            },
            {
              type: 'text',
              text: `Query: ${query}\n\nAnalyze this Spline 3D scene and provide recommendations.`
            }
          ]
        }
      ]
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    console.log(`   Detected: ${analysis.objects_detected?.join(', ') || 'No objects'}`);
    console.log(`   Actions: ${analysis.recommended_actions?.length || 0}`);

    return analysis;
  }

  /**
   * AGENT 3: Editor Agent
   * Executes commands and reports results
   */
  async editorAgent(commands) {
    console.log('⚙️  Agent 3 (Editor): Executing commands...');

    const results = [];

    for (const cmd of commands) {
      try {
        let result;

        console.log(`   → ${cmd.action} on "${cmd.object}" (${cmd.property}: ${JSON.stringify(cmd.value)})`);

        switch (cmd.action) {
          case 'setObjectProperty':
            result = this.runtime.setObjectProperty(cmd.object, cmd.property, cmd.value);
            break;

          case 'setVariable':
            result = this.runtime.setVariable(cmd.variable || `${cmd.object}_${cmd.property}`, cmd.value);
            break;

          case 'emitEvent':
            result = this.runtime.emitEvent(cmd.event, cmd.value || {});
            break;

          default:
            result = { success: false, error: `Unknown action: ${cmd.action}` };
        }

        results.push({
          command: cmd,
          result: result,
          success: result.success !== false,
          timestamp: Date.now()
        });

        console.log(`   ${result.success !== false ? '✅' : '❌'} ${cmd.action} ${result.success !== false ? 'succeeded' : 'failed'}`);

        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          command: cmd,
          result: { success: false, error: error.message },
          success: false,
          timestamp: Date.now()
        });
      }
    }

    return {
      executed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
  }

  /**
   * Main execution flow: Coordinate all 3 agents
   */
  async execute(userCommand) {
    console.log('\n🚀 Three-Agent System Starting...');
    console.log(`📝 User Command: "${userCommand}"`);
    console.log('═'.repeat(60));

    try {
      // STEP 1: Planning Agent analyzes the command
      const plan = await this.planningAgent(userCommand);

      this.conversationHistory.push({
        role: 'user',
        command: userCommand,
        plan: plan,
        timestamp: Date.now()
      });

      // STEP 2: Visual Agent analyzes current scene
      const initialAnalysis = await this.visualAgent(
        `User wants to: ${plan.intent}. What is the current state of the scene?`
      );

      // STEP 3: Execute each step of the plan
      const stepResults = [];

      for (const step of plan.steps) {
        console.log(`\n📍 Step ${step.id}: ${step.action}`);

        // Get visual feedback if needed
        let visualAnalysis = initialAnalysis;
        if (step.requires_vision) {
          visualAnalysis = await this.visualAgent(step.vision_query);
        }

        // Execute commands from visual analysis
        const editorResult = await this.editorAgent(visualAnalysis.recommended_actions);

        // STEP 4: Visual Agent validates the changes
        console.log('\n🔍 Validating changes...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for UI update

        const validationScreenshot = await this.page.screenshot({
          encoding: 'base64',
          fullPage: false
        });

        const validation = await this.visualAgent(
          `Verify that step ${step.id} was successful: ${step.validation_criteria}`,
          validationScreenshot
        );

        stepResults.push({
          step: step,
          visualAnalysis: visualAnalysis,
          editorResult: editorResult,
          validation: validation,
          success: editorResult.successful > 0
        });

        // Stop if step failed and is critical
        if (editorResult.successful === 0) {
          console.log(`\n⚠️  Step ${step.id} failed, stopping execution`);
          break;
        }
      }

      // Final summary
      const allSuccessful = stepResults.every(r => r.success);

      console.log('\n' + '═'.repeat(60));
      console.log(`${allSuccessful ? '✅' : '⚠️'} Execution ${allSuccessful ? 'Complete' : 'Partially Complete'}`);
      console.log(`   Steps: ${stepResults.length}/${plan.steps.length}`);
      console.log(`   Success: ${stepResults.filter(r => r.success).length}`);
      console.log(`   Failed: ${stepResults.filter(r => !r.success).length}`);

      const executionRecord = {
        userCommand,
        plan,
        steps: stepResults,
        success: allSuccessful,
        timestamp: Date.now()
      };

      this.executionHistory.push(executionRecord);

      return executionRecord;

    } catch (error) {
      console.error('\n❌ Three-Agent System Error:', error.message);
      return {
        success: false,
        error: error.message,
        userCommand
      };
    }
  }

  /**
   * Execute with GUI context from Chrome extension
   * This is the main entry point for the API server
   */
  async executeWithContext(userCommand, guiContext = {}) {
    console.log('\n🚀 Three-Agent System Starting (with GUI context)...');
    console.log(`📝 User Command: "${userCommand}"`);
    if (Object.keys(guiContext).length > 0) {
      console.log(`🎨 GUI Context: ${JSON.stringify(guiContext, null, 2)}`);
    }
    console.log('═'.repeat(60));

    try {
      // STEP 1: Planning Agent analyzes the command WITH GUI CONTEXT
      const plan = await this.planningAgentWithContext(userCommand, guiContext);

      this.conversationHistory.push({
        role: 'user',
        command: userCommand,
        context: guiContext,
        plan: plan,
        timestamp: Date.now()
      });

      // STEP 2: Visual Agent analyzes current scene
      const contextDescription = this.formatGUIContext(guiContext);
      const initialAnalysis = await this.visualAgent(
        `User wants to: ${plan.intent}. Context: ${contextDescription}. What is the current state of the scene?`
      );

      // STEP 3: Execute each step of the plan
      const stepResults = [];

      for (const step of plan.steps) {
        console.log(`\n📍 Step ${step.id}: ${step.action}`);

        // Get visual feedback if needed
        let visualAnalysis = initialAnalysis;
        if (step.requires_vision) {
          visualAnalysis = await this.visualAgent(step.vision_query);
        }

        // Execute commands from visual analysis
        const editorResult = await this.editorAgent(visualAnalysis.recommended_actions);

        // STEP 4: Visual Agent validates the changes
        console.log('\n🔍 Validating changes...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for UI update

        const validationScreenshot = await this.page.screenshot({
          encoding: 'base64',
          fullPage: false
        });

        const validation = await this.visualAgent(
          `Verify that step ${step.id} was successful: ${step.validation_criteria}`,
          validationScreenshot
        );

        stepResults.push({
          step: step,
          visualAnalysis: visualAnalysis,
          editorResult: editorResult,
          validation: validation,
          success: editorResult.successful > 0
        });

        // Stop if step failed and is critical
        if (editorResult.successful === 0) {
          console.log(`\n⚠️  Step ${step.id} failed, stopping execution`);
          break;
        }
      }

      // Final summary
      const allSuccessful = stepResults.every(r => r.success);

      console.log('\n' + '═'.repeat(60));
      console.log(`${allSuccessful ? '✅' : '⚠️'} Execution ${allSuccessful ? 'Complete' : 'Partially Complete'}`);
      console.log(`   Steps: ${stepResults.length}/${plan.steps.length}`);
      console.log(`   Success: ${stepResults.filter(r => r.success).length}`);
      console.log(`   Failed: ${stepResults.filter(r => !r.success).length}`);

      const executionRecord = {
        userCommand,
        guiContext,
        plan,
        steps: stepResults,
        success: allSuccessful,
        timestamp: Date.now()
      };

      this.executionHistory.push(executionRecord);

      return executionRecord;

    } catch (error) {
      console.error('\n❌ Three-Agent System Error:', error.message);
      return {
        success: false,
        error: error.message,
        userCommand,
        guiContext
      };
    }
  }

  /**
   * Planning Agent with GUI Context
   * Enhanced version that accepts context from Chrome extension GUI
   */
  async planningAgentWithContext(userCommand, guiContext = {}) {
    console.log('🧠 Agent 1 (Planning): Analyzing command with GUI context...');

    const contextDescription = this.formatGUIContext(guiContext);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are the Planning Agent for a 3-agent Spline 3D editing system.

Your role:
1. Understand user intent and break down into actionable steps
2. Consider GUI context provided by the user
3. Identify what information is needed from the Visual Agent
4. Plan the sequence of operations
5. Consider edge cases and prerequisites

GUI Context Available:
${contextDescription}

Available Operations:
- setObjectProperty: position, rotation, scale, visible
- setVariable: color, material properties, custom variables
- emitEvent: trigger animations, interactions

Respond with JSON:
{
  "intent": "clear summary of what user wants",
  "steps": [
    {
      "id": 1,
      "action": "brief description of step",
      "requires_vision": true/false,
      "vision_query": "if requires_vision, what to look for",
      "validation_criteria": "how to verify success"
    }
  ],
  "validation": "overall success criteria",
  "estimated_commands": number,
  "considerations": ["things to watch for"]
}`
        },
        {
          role: 'user',
          content: `Command: "${userCommand}"\n\nGUI Context:\n${JSON.stringify(guiContext, null, 2)}`
        }
      ]
    });

    const plan = JSON.parse(response.choices[0].message.content);

    console.log(`   Intent: ${plan.intent}`);
    console.log(`   Steps: ${plan.steps?.length || 0}`);

    return plan;
  }

  /**
   * Format GUI context for AI agents
   */
  formatGUIContext(context = {}) {
    const parts = [];

    if (context.material && Object.keys(context.material).length > 0) {
      const m = context.material;
      parts.push(`Material: ${m.type || 'default'} (transparency: ${m.transparency || 0}, roughness: ${m.roughness || 0.5}, color: ${m.color || 'default'})`);
    }

    if (context.object && Object.keys(context.object).length > 0) {
      const o = context.object;
      parts.push(`Object: ${o.type || 'default'} (size: ${o.width || 'auto'}x${o.height || 'auto'}x${o.depth || 'auto'})`);
    }

    if (context.text && Object.keys(context.text).length > 0) {
      const t = context.text;
      parts.push(`Text: "${t.content || ''}" (font: ${t.font || 'default'}, size: ${t.size || 'default'})`);
    }

    if (context.interaction && Object.keys(context.interaction).length > 0) {
      const i = context.interaction;
      parts.push(`Interaction: ${i.type || 'none'} → ${i.action || 'none'}`);
    }

    if (context.animation && Object.keys(context.animation).length > 0) {
      const a = context.animation;
      parts.push(`Animation: ${a.type || 'none'} (duration: ${a.duration || 0}s, easing: ${a.easing || 'linear'})`);
    }

    if (parts.length === 0) {
      return 'No GUI context provided';
    }

    return parts.join('\n');
  }

  /**
   * Get execution history
   */
  getHistory() {
    return {
      executions: this.executionHistory.length,
      successful: this.executionHistory.filter(e => e.success).length,
      failed: this.executionHistory.filter(e => !e.success).length,
      history: this.executionHistory
    };
  }

  /**
   * Interactive mode: Get suggestions based on current scene
   */
  async suggestCommands() {
    console.log('💡 Analyzing scene for suggestions...');

    const analysis = await this.visualAgent(
      'What are some useful commands the user could try with this scene?'
    );

    if (analysis.recommended_actions) {
      console.log('\nSuggested commands:');
      analysis.recommended_actions.forEach((action, i) => {
        const cmd = this.formatCommand(action);
        console.log(`   ${i + 1}. "${cmd}" - ${action.reasoning}`);
      });
    }

    return analysis.recommended_actions || [];
  }

  /**
   * Helper: Format action as natural language command
   */
  formatCommand(action) {
    if (action.action === 'setObjectProperty') {
      if (action.property === 'position') {
        return `move ${action.object} to (${action.value.x}, ${action.value.y}, ${action.value.z})`;
      } else if (action.property === 'rotation') {
        return `rotate ${action.object}`;
      } else if (action.property === 'scale') {
        return `scale ${action.object} by ${action.value}`;
      } else if (action.property === 'visible') {
        return `${action.value ? 'show' : 'hide'} ${action.object}`;
      }
    } else if (action.action === 'setVariable') {
      return `set ${action.variable} to ${action.value}`;
    } else if (action.action === 'emitEvent') {
      return `trigger ${action.event}`;
    }

    return `${action.action} ${action.object}`;
  }

  /**
   * Conversation mode: Continue refining
   */
  async refine(feedback) {
    const lastExecution = this.executionHistory[this.executionHistory.length - 1];

    if (!lastExecution) {
      console.log('No previous execution to refine');
      return null;
    }

    console.log(`\n🔄 Refining based on feedback: "${feedback}"`);

    // Planning agent creates refined plan
    const refinedPlan = await this.planningAgent(
      `Original command: "${lastExecution.userCommand}"\nUser feedback: "${feedback}"\nCreate an improved plan.`
    );

    return this.execute(`${lastExecution.userCommand} (refined: ${feedback})`);
  }

  /**
   * Debug mode: Show detailed logs
   */
  enableDebug() {
    this.debug = true;
    console.log('🐛 Debug mode enabled');
  }

  disableDebug() {
    this.debug = false;
    console.log('Debug mode disabled');
  }
}

module.exports = { ThreeAgentSystem };
