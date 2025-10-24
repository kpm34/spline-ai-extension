#!/usr/bin/env node

/**
 * Test script for Spline MCP Server
 * Verifies that the MCP server can start and respond to requests
 */

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🧪 Testing Spline MCP Server...\n');

// Start the MCP server
const serverPath = './mcp-server/spline-mcp-server.js';
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverStarted = false;

// Listen to stderr for startup message
server.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('MCP Server running')) {
    serverStarted = true;
    console.log('✅ Server started successfully');
    console.log(`   ${message.trim()}\n`);

    // Send a list tools request
    console.log('📝 Sending list_tools request...');
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }
});

// Listen to stdout for responses
let responseBuffer = '';
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop(); // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('📥 Received response:');
        console.log(JSON.stringify(response, null, 2));
        console.log('\n✅ MCP Server is working correctly!\n');
        console.log('Available tools:');
        if (response.result && response.result.tools) {
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });
        }

        // Test complete, shut down
        setTimeout(() => {
          server.kill();
          process.exit(0);
        }, 500);
      } catch (e) {
        // Not valid JSON yet, keep buffering
      }
    }
  }
});

// Handle errors
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.error('❌ Server failed to start within 5 seconds');
    server.kill();
    process.exit(1);
  }
}, 5000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping test...');
  server.kill();
  process.exit(0);
});
