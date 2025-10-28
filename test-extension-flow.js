/**
 * Test Extension Flow
 *
 * Simulates what the Chrome extension does:
 * 1. Initialize session in extension mode
 * 2. Execute AI command
 * 3. Get plan response
 */

async function testExtensionFlow() {
    const API_URL = 'http://localhost:8081';

    console.log('🧪 Testing Extension Flow\n');

    // Step 1: Initialize session
    console.log('1️⃣  Initializing session in extension mode...');
    const initResponse = await fetch(`${API_URL}/api/session/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sceneUrl: 'https://app.spline.design/file/6458afb0-ebda-4463-8963-ca5f108616ec',
            mode: 'extension'
        })
    });

    if (!initResponse.ok) {
        const error = await initResponse.text();
        console.error('❌ Session init failed:', error);
        process.exit(1);
    }

    const initData = await initResponse.json();
    console.log('✅ Session initialized:', initData.sessionId);
    console.log('   Mode:', initData.mode);
    console.log('   Message:', initData.message);
    console.log();

    // Step 2: Execute AI command
    console.log('2️⃣  Executing AI command: "make the cube red"...');
    const executeResponse = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: initData.sessionId,
            prompt: 'make the cube red',
            context: {}
        })
    });

    if (!executeResponse.ok) {
        const error = await executeResponse.text();
        console.error('❌ Command execution failed:', error);
        process.exit(1);
    }

    const executeData = await executeResponse.json();
    console.log('✅ Command executed successfully');
    console.log('   Execution ID:', executeData.executionId);
    console.log('   Mode:', executeData.mode);
    console.log();

    // Step 3: Show plan
    if (executeData.plan) {
        console.log('📋 AI Plan:');
        console.log('   Intent:', executeData.plan.intent);
        console.log('   Steps:');
        executeData.plan.steps?.forEach((step, i) => {
            console.log(`     ${i + 1}. ${step.description}`);
            console.log(`        Action: ${step.action}`);
            console.log(`        Params:`, JSON.stringify(step.params, null, 10));
        });
        console.log('   Validation:', executeData.plan.validation);
    }

    console.log('\n✅ Test completed successfully!');
}

testExtensionFlow().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
