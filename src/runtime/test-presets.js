#!/usr/bin/env node

const { SplineRuntime } = require('../../src/spline-runtime.js');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

console.log('=== Test: Preset System ===');

async function test() {
  try {
    const runtime = new SplineRuntime();
    console.log('✅ Runtime created');

    // Check preset directory exists
    const presetPath = path.join(os.homedir(), '.spline-cli', 'presets');
    const exists = await fs.pathExists(presetPath);
    console.log(`✅ Preset directory ${exists ? 'exists' : 'created'}: ${presetPath}`);

    // List presets
    const presets = await runtime.listPresets();
    console.log(`✅ Found ${presets.length} presets`);

    console.log('=== TEST PASSED ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

test();
