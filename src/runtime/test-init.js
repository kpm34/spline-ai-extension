#!/usr/bin/env node

const { SplineRuntime } = require('../../src/spline-runtime.js');

console.log('=== Test: SplineRuntime Initialization ===');

try {
  const runtime = new SplineRuntime();
  console.log('✅ Runtime created successfully');

  const info = runtime.getInfo();
  console.log('✅ Info retrieved:', JSON.stringify(info, null, 2));

  if (info.initialized === false && info.loaded === false) {
    console.log('✅ Initial state correct');
    console.log('=== TEST PASSED ===');
    process.exit(0);
  } else {
    console.log('❌ Unexpected initial state');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ TEST FAILED:', error.message);
  process.exit(1);
}
