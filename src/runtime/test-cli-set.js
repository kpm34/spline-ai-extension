#!/usr/bin/env node

const axios = require('axios');

console.log('=== Test: CLI Set Command ===');

async function test() {
  try {
    const port = 8080;
    const apiUrl = `http://localhost:${port}`;

    // Test 1: Send set command via API
    console.log('Testing set command...');
    const setResponse = await axios.post(`${apiUrl}/api/set`, {
      object: 'Cube',
      property: 'position',
      value: '10,20,30'
    });

    if (setResponse.data.success) {
      console.log('✅ Set command sent successfully');
    } else {
      throw new Error('Set command failed');
    }

    // Test 2: Verify command was queued
    console.log('Verifying command queue...');
    const commandResponse = await axios.get(`${apiUrl}/api/commands/last`);
    if (commandResponse.data.type === 'set') {
      console.log('✅ Set command is queued');
      console.log(`   Object: ${commandResponse.data.object}`);
      console.log(`   Property: ${commandResponse.data.property}`);
      console.log(`   Value: ${commandResponse.data.value}`);
    } else {
      throw new Error('Set command not found in queue');
    }

    // Test 3: Clear command
    console.log('Testing command clear...');
    await axios.post(`${apiUrl}/api/commands/clear`);

    const clearedResponse = await axios.get(`${apiUrl}/api/commands/last`);
    if (!clearedResponse.data || clearedResponse.data.type === 'none') {
      console.log('✅ Command cleared successfully');
    } else {
      throw new Error('Command was not cleared');
    }

    console.log('=== TEST PASSED ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

test();
