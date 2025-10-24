#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('=== Test: CLI Load Command ===');

async function test() {
  try {
    const port = 8080;
    const apiUrl = `http://localhost:${port}`;

    // Test 1: Check API server is running
    console.log('Testing API server health...');
    const healthResponse = await axios.get(`${apiUrl}/api/health`);
    if (healthResponse.data.status === 'ok') {
      console.log('✅ API server is healthy');
    } else {
      throw new Error('API server health check failed');
    }

    // Test 2: Check runtime info endpoint
    console.log('Testing runtime info endpoint...');
    const infoResponse = await axios.get(`${apiUrl}/api/info`);
    console.log(`✅ Runtime info: loaded=${infoResponse.data.loaded}`);

    // Test 3: Send load command via API
    console.log('Testing load command...');
    const loadResponse = await axios.post(`${apiUrl}/api/load`, {
      url: 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode'
    });

    if (loadResponse.data.success) {
      console.log('✅ Load command sent successfully');
    } else {
      throw new Error('Load command failed');
    }

    // Test 4: Verify command was queued
    const commandResponse = await axios.get(`${apiUrl}/api/commands/last`);
    if (commandResponse.data.type === 'load') {
      console.log('✅ Load command is queued for browser execution');
    } else {
      throw new Error('Load command not found in queue');
    }

    console.log('=== TEST PASSED ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

test();
