#!/usr/bin/env node

const axios = require('axios');

console.log('=== Test: CLI Variable Commands ===');

async function test() {
  try {
    const port = 8080;
    const apiUrl = `http://localhost:${port}`;

    // Test 1: Set variable
    console.log('Testing variable set command...');
    const setResponse = await axios.post(`${apiUrl}/api/var/set`, {
      name: 'testVar',
      value: 42
    });

    if (setResponse.data.success) {
      console.log('✅ Variable set command sent');
    } else {
      throw new Error('Variable set failed');
    }

    // Test 2: Get variable
    console.log('Testing variable get command...');
    const getResponse = await axios.post(`${apiUrl}/api/var/get`, {
      name: 'testVar'
    });

    if (getResponse.data.success) {
      console.log('✅ Variable get command sent');
    } else {
      throw new Error('Variable get failed');
    }

    // Test 3: Verify commands queued
    const commandResponse = await axios.get(`${apiUrl}/api/commands/last`);
    if (commandResponse.data.type && commandResponse.data.type.startsWith('var:')) {
      console.log('✅ Variable command queued');
    }

    console.log('=== TEST PASSED ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

test();
