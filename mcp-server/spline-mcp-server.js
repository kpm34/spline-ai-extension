#!/usr/bin/env node

/**
 * Spline CLI MCP Server
 *
 * Provides Model Context Protocol tools for Spline CLI testing and automation.
 * Integrates with Maestro for automated UI testing workflows.
 */

// Manually load .env file without dotenv's verbose output (for MCP stdio compatibility)
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Suppress all console output during module loading to prevent dotenv verbose output
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalStderrWrite = process.stderr.write.bind(process.stderr);
const originalStdoutWrite = process.stdout.write.bind(process.stdout);

console.warn = () => {};
console.log = () => {};
console.error = () => {};
process.stderr.write = () => {};
process.stdout.write = () => {};

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const { SplineEditor } = require('../src/spline-editor.js');
const { SplineFetcher } = require('../src/spline-fetcher.js');

// Restore all output
console.warn = originalConsoleWarn;
console.log = originalConsoleLog;
console.error = originalConsoleError;
process.stderr.write = originalStderrWrite;
process.stdout.write = originalStdoutWrite;
const { exec } = require('child_process');
const { promisify } = require('util');
const fsExtra = require('fs-extra');

const execAsync = promisify(exec);

class SplineMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'spline-cli-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run_spline_command',
          description: 'Execute any Spline CLI command and return output',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The Spline CLI command to run (e.g., "connect", "inspect", "fetch --list")',
              },
              args: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional arguments for the command',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'generate_maestro_test',
          description: 'Generate a Maestro test YAML file for a Spline CLI command',
          inputSchema: {
            type: 'object',
            properties: {
              testName: {
                type: 'string',
                description: 'Name of the test (e.g., "list-materials")',
              },
              command: {
                type: 'string',
                description: 'The Spline CLI command to test',
              },
              expectedOutputs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of expected output strings to assert',
              },
            },
            required: ['testName', 'command', 'expectedOutputs'],
          },
        },
        {
          name: 'run_maestro_test',
          description: 'Execute a Maestro test flow and return results',
          inputSchema: {
            type: 'object',
            properties: {
              testFile: {
                type: 'string',
                description: 'Path to Maestro test YAML file (e.g., ".maestro/01-connect-flow.yaml")',
              },
              debug: {
                type: 'boolean',
                description: 'Run in debug mode for detailed output',
                default: false,
              },
            },
            required: ['testFile'],
          },
        },
        {
          name: 'inspect_spline_scene',
          description: 'Inspect a Spline scene and return detailed information',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'Spline project ID to inspect',
              },
              detailed: {
                type: 'boolean',
                description: 'Return detailed information including transforms and materials',
                default: false,
              },
            },
          },
        },
        {
          name: 'fetch_spline_projects',
          description: 'Fetch list of all Spline projects from user account',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'validate_cli_output',
          description: 'Run a CLI command and validate its output against expected patterns',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The Spline CLI command to run',
              },
              expectedPatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of regex patterns that should match the output',
              },
            },
            required: ['command', 'expectedPatterns'],
          },
        },
        {
          name: 'create_test_suite',
          description: 'Generate a complete test suite for a new Spline CLI feature',
          inputSchema: {
            type: 'object',
            properties: {
              featureName: {
                type: 'string',
                description: 'Name of the feature (e.g., "material-export")',
              },
              commands: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    command: { type: 'string' },
                    description: { type: 'string' },
                    expectedOutputs: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
                description: 'Array of commands to test with expected outputs',
              },
            },
            required: ['featureName', 'commands'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_spline_command':
            return await this.runSplineCommand(args);

          case 'generate_maestro_test':
            return await this.generateMaestroTest(args);

          case 'run_maestro_test':
            return await this.runMaestroTest(args);

          case 'inspect_spline_scene':
            return await this.inspectSplineScene(args);

          case 'fetch_spline_projects':
            return await this.fetchSplineProjects(args);

          case 'validate_cli_output':
            return await this.validateCliOutput(args);

          case 'create_test_suite':
            return await this.createTestSuite(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async runSplineCommand(args) {
    const { command, args: cmdArgs = [] } = args;
    const fullCommand = `spline-edit ${command} ${cmdArgs.join(' ')}`.trim();

    const { stdout, stderr } = await execAsync(fullCommand);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            command: fullCommand,
            stdout: stdout,
            stderr: stderr,
            success: !stderr || stderr.length === 0,
          }, null, 2),
        },
      ],
    };
  }

  async generateMaestroTest(args) {
    const { testName, command, expectedOutputs } = args;

    const testNumber = await this.getNextTestNumber();
    const fileName = `${testNumber}-${testName}.yaml`;
    const filePath = path.join(process.cwd(), '.maestro', fileName);

    const yamlContent = `appId: com.terminal.spline-cli
---
# Test Flow: ${testName}
- launchApp
- runScript: |
    spline-edit ${command}
${expectedOutputs.map(output => `- assertVisible: "${output}"`).join('\n')}
`;

    await fsExtra.writeFile(filePath, yamlContent);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            filePath: filePath,
            content: yamlContent,
            message: `Test created: ${fileName}`,
          }, null, 2),
        },
      ],
    };
  }

  async runMaestroTest(args) {
    const { testFile, debug = false } = args;
    const debugFlag = debug ? '--debug' : '';
    const command = `maestro test ${debugFlag} ${testFile}`.trim();

    try {
      const { stdout, stderr } = await execAsync(command);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              testFile: testFile,
              output: stdout,
              errors: stderr,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              testFile: testFile,
              output: error.stdout || '',
              errors: error.stderr || error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async inspectSplineScene(args) {
    const { projectId, detailed = false } = args;
    const detailedFlag = detailed ? '--detailed' : '';
    const command = `spline-edit inspect ${detailedFlag}`.trim();

    const { stdout } = await execAsync(command);

    return {
      content: [
        {
          type: 'text',
          text: stdout,
        },
      ],
    };
  }

  async fetchSplineProjects() {
    const { stdout } = await execAsync('spline-edit fetch --list');

    return {
      content: [
        {
          type: 'text',
          text: stdout,
        },
      ],
    };
  }

  async validateCliOutput(args) {
    const { command, expectedPatterns } = args;
    const fullCommand = `spline-edit ${command}`;

    const { stdout } = await execAsync(fullCommand);

    const results = expectedPatterns.map(pattern => {
      const regex = new RegExp(pattern);
      const matches = regex.test(stdout);
      return {
        pattern: pattern,
        matches: matches,
        matchedText: matches ? stdout.match(regex)[0] : null,
      };
    });

    const allMatched = results.every(r => r.matches);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            command: fullCommand,
            success: allMatched,
            output: stdout,
            validations: results,
          }, null, 2),
        },
      ],
    };
  }

  async createTestSuite(args) {
    const { featureName, commands } = args;

    const testFiles = [];

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      const testNumber = await this.getNextTestNumber();
      const fileName = `${testNumber}-${featureName}-${i + 1}.yaml`;
      const filePath = path.join(process.cwd(), '.maestro', fileName);

      const yamlContent = `appId: com.terminal.spline-cli
---
# Test Flow: ${featureName} - ${cmd.description}
- launchApp
- runScript: |
    spline-edit ${cmd.command}
${cmd.expectedOutputs.map(output => `- assertVisible: "${output}"`).join('\n')}
`;

      await fsExtra.writeFile(filePath, yamlContent);
      testFiles.push({ fileName, filePath });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            featureName: featureName,
            testsCreated: testFiles.length,
            files: testFiles,
          }, null, 2),
        },
      ],
    };
  }

  async getNextTestNumber() {
    const maestroDir = path.join(process.cwd(), '.maestro');
    const files = await fsExtra.readdir(maestroDir);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') && f.match(/^\d+/));

    if (yamlFiles.length === 0) return '01';

    const numbers = yamlFiles.map(f => parseInt(f.split('-')[0]));
    const maxNumber = Math.max(...numbers);
    return String(maxNumber + 1).padStart(2, '0');
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      // Ignore EPIPE errors (broken pipe when client disconnects)
      if (error.code !== 'EPIPE') {
        console.error('[MCP Error]', error);
      }
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    // Handle EPIPE errors on stdout/stderr
    process.stdout.on('error', (err) => {
      if (err.code === 'EPIPE') {
        // Client disconnected, exit gracefully
        process.exit(0);
      }
    });

    process.stderr.on('error', (err) => {
      if (err.code === 'EPIPE') {
        // Client disconnected, exit gracefully
        process.exit(0);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();

    // Handle transport errors
    transport.onerror = (error) => {
      if (error.code !== 'EPIPE') {
        console.error('[Transport Error]', error);
      }
    };

    await this.server.connect(transport);
    console.error('Spline CLI MCP Server running on stdio');
  }
}

// Start the server
const server = new SplineMCPServer();
server.run().catch((error) => {
  // Only log non-EPIPE errors
  if (error.code !== 'EPIPE') {
    console.error(error);
  }
  process.exit(1);
});
