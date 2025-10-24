#!/usr/bin/env node

/**
 * Test script for Maestro MCP Server
 */

const { spawn } = require('child_process');

console.log('🧪 Testing Maestro MCP Server...\n');

const server = spawn('maestro', ['mcp'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverStarted = false;
let responseReceived = false;

// Listen to stderr for startup messages
server.stderr.on('data', (data) => {
  const message = data.toString();
  console.log('STDERR:', message);
  if (message.includes('MCP') || message.includes('server')) {
    serverStarted = true;
    console.log('✅ Server started\n');
  }
});

// Send initialization request
console.log('📝 Sending initialize request...');
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

server.stdin.write(JSON.stringify(initRequest) + '\n');

// Listen to stdout for responses
let responseBuffer = '';
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  console.log('Received data:', data.toString());

  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop();

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('\n📥 Received response:');
        console.log(JSON.stringify(response, null, 2));
        responseReceived = true;

        if (response.result) {
          console.log('\n✅ Maestro MCP Server is working!');

          // Send tools/list request
          setTimeout(() => {
            console.log('\n📝 Requesting tools list...');
            const toolsRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            };
            server.stdin.write(JSON.stringify(toolsRequest) + '\n');
          }, 500);
        }

        if (response.result && response.result.tools) {
          console.log('\n🛠️  Available Maestro tools:');
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });

          setTimeout(() => {
            server.kill();
            process.exit(0);
          }, 500);
        }
      } catch (e) {
        // Not valid JSON yet
      }
    }
  }
});

// Handle errors
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (!responseReceived) {
    console.error('\n❌ Server closed without sending a response');
    console.error(`Exit code: ${code}`);
    process.exit(1);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('\n❌ Server test timed out after 5 seconds');
  if (!serverStarted) {
    console.error('   Server never started');
  } else if (!responseReceived) {
    console.error('   Server started but no response received');
  }
  server.kill();
  process.exit(1);
}, 5000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping test...');
  server.kill();
  process.exit(0);
});
