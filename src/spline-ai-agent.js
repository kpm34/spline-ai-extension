require('dotenv').config({ silent: true });
const OpenAI = require('openai');

/**
 * SplineAIAgent - AI-powered browser automation for Spline
 * Uses GPT-4o-mini's vision capabilities to navigate Spline's interface intelligently
 */
class SplineAIAgent {
  constructor(page) {
    this.page = page;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.conversationHistory = [];
  }

  /**
   * Take a screenshot and convert to base64 for Claude
   */
  async captureScreen() {
    const screenshot = await this.page.screenshot({
      encoding: 'base64',
      fullPage: false
    });
    return screenshot;
  }

  /**
   * Ask GPT to analyze the screen and suggest actions
   * Using GPT-4o-mini for cost efficiency (90% cheaper than Claude!)
   */
  async analyzeScreen(screenshot, goal) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Super cheap: $0.15/MTok input, $0.60/MTok output
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: 'low'  // Use 'low' for even cheaper costs
              }
            },
            {
              type: 'text',
              text: `You are an AI agent controlling a browser to automate Spline (3D design tool).

Current goal: ${goal}

Analyze this screenshot and determine:
1. What is currently on screen?
2. What action should be taken next to achieve the goal?
3. What are the coordinates or selectors to interact with?

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "observation": "What you see on screen",
  "next_action": "click|type|wait|scroll|extract|done",
  "target": "CSS selector or description of element",
  "value": "Text to type (if action is 'type')",
  "reasoning": "Why this action",
  "extracted_data": "Any data to extract (if action is 'extract')",
  "complete": true/false
}

Examples:
- Login form: {"next_action": "type", "target": "input[type='email']", "value": "user@example.com"}
- Verification: {"next_action": "wait", "reasoning": "User needs to enter code manually"}
- File menu: {"next_action": "click", "target": "text=File"}
- Export URL: {"next_action": "extract", "extracted_data": "https://...splinecode"}
- Complete: {"next_action": "done", "complete": true}`
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }  // Force JSON response
    });

    // Parse GPT's response
    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI agent returned invalid JSON');
    }
  }

  /**
   * Execute the action suggested by AI
   */
  async executeAction(action) {
    switch (action.next_action) {
      case 'click':
        console.log(`🤖 AI Agent: Clicking "${action.target}"`);
        try {
          // Try text selector first
          if (action.target.startsWith('text=')) {
            const text = action.target.replace('text=', '');
            await this.page.click(`text="${text}"`);
          } else {
            await this.page.click(action.target);
          }
        } catch (error) {
          console.log(`⚠️  Could not click "${action.target}":`, error.message);
          return { success: false, error: error.message };
        }
        break;

      case 'type':
        console.log(`🤖 AI Agent: Typing into "${action.target}"`);
        try {
          await this.page.waitForSelector(action.target, { timeout: 5000 });
          await this.page.type(action.target, action.value);
        } catch (error) {
          console.log(`⚠️  Could not type into "${action.target}":`, error.message);
          return { success: false, error: error.message };
        }
        break;

      case 'wait':
        console.log(`🤖 AI Agent: Waiting - ${action.reasoning}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;

      case 'scroll':
        console.log(`🤖 AI Agent: Scrolling`);
        await this.page.evaluate(() => window.scrollBy(0, 300));
        break;

      case 'extract':
        console.log(`🤖 AI Agent: Extracted data: ${action.extracted_data}`);
        return { success: true, extracted: action.extracted_data };

      case 'done':
        console.log(`🤖 AI Agent: Task complete!`);
        return { success: true, complete: true };

      default:
        console.log(`🤖 AI Agent: Unknown action "${action.next_action}"`);
    }

    return { success: true };
  }

  /**
   * Main automation loop - AI decides what to do at each step
   */
  async automate(goal, maxSteps = 20) {
    console.log(`🤖 AI Agent starting: ${goal}`);
    console.log('');

    for (let step = 0; step < maxSteps; step++) {
      console.log(`📸 Step ${step + 1}/${maxSteps}: Taking screenshot...`);

      // Capture current screen
      const screenshot = await this.captureScreen();

      // Ask AI what to do
      console.log(`🧠 Analyzing screen with AI...`);
      const decision = await this.analyzeScreen(screenshot, goal);

      console.log(`💭 AI thinks: ${decision.observation || 'Analyzing...'}`);
      console.log(`➡️  Action: ${decision.next_action}`);
      if (decision.reasoning) {
        console.log(`🤔 Reasoning: ${decision.reasoning}`);
      }
      console.log('');

      // Execute the action
      const result = await this.executeAction(decision);

      // Check if task is complete
      if (decision.complete || result.complete) {
        console.log('✅ AI Agent successfully completed the task!');
        return { success: true, result: result.extracted };
      }

      // Check for errors
      if (!result.success) {
        console.log(`⚠️  Action failed: ${result.error}`);
        // Continue anyway, AI might recover
      }

      // Wait a bit before next step
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log(`⚠️  AI Agent reached max steps (${maxSteps})`);
    return { success: false, error: 'Max steps reached' };
  }

  /**
   * Specific task: Get export URL from open Spline project
   */
  async getExportUrl() {
    return await this.automate(
      'Navigate to File menu, find Export or Code Export option, click it, and extract the .splinecode URL',
      15
    );
  }

  /**
   * Specific task: List all projects from Spline home
   */
  async extractProjectList() {
    return await this.automate(
      'Extract the list of all Spline projects visible on this page. Get their names and IDs.',
      10
    );
  }

  /**
   * Specific task: Enter verification code (with user assistance)
   */
  async handleVerificationCode(code) {
    const screenshot = await this.captureScreen();
    const decision = await this.analyzeScreen(
      screenshot,
      `Enter the verification code "${code}" into the appropriate input field`
    );
    return await this.executeAction(decision);
  }
}

module.exports = { SplineAIAgent };
