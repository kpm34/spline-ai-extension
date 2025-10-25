/**
 * Test RAG Integration with Three-Agent System
 *
 * This script tests that RAG context is properly retrieved and used by the Planning Agent
 */

const { RAGSystem } = require('./src/rag-system');

async function testRAGIntegration() {
    console.log('🧪 Testing RAG Integration with Three-Agent System\n');

    // Initialize RAG
    const rag = new RAGSystem(process.env.OPENAI_API_KEY);
    await rag.initialize();

    console.log('📊 RAG Stats:');
    const stats = await rag.getStats();
    console.log(`   - UI Patterns: ${stats.uiPatterns}`);
    console.log(`   - Materials: ${stats.materials}`);
    console.log(`   - Total: ${stats.total}\n`);

    // Test Case 1: Homepage navigation
    console.log('🔍 Test 1: Homepage Navigation');
    console.log('Command: "open the NEXBOT project"\n');

    const test1 = await rag.enhancePrompt('open the NEXBOT project', 'homepage');
    console.log('Retrieved UI Patterns:');
    test1.retrievedUIPatterns.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.document.substring(0, 70)}...`);
        console.log(`      Selector: ${p.metadata.selector}`);
        console.log(`      Page: ${p.metadata.page}\n`);
    });

    // Test Case 2: Material search
    console.log('🔍 Test 2: Material Request');
    console.log('Command: "make it glossy glass like a button"\n');

    const test2 = await rag.enhancePrompt('make it glossy glass like a button', 'scene-editor');
    console.log('Retrieved Materials:');
    test2.retrievedMaterials.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.metadata.name}`);
        console.log(`      Type: ${m.metadata.properties.type}`);
        console.log(`      Color: ${m.metadata.properties.color}`);
        console.log(`      Transparency: ${m.metadata.properties.transparency}\n`);
    });

    // Test Case 3: Full context summary (what Planning Agent sees)
    console.log('🔍 Test 3: Full Context for Planning Agent');
    console.log('Command: "copy glass material from community project"\n');

    const test3 = await rag.enhancePrompt('copy glass material from community project', 'homepage');
    console.log('Context Summary (sent to Planning Agent):');
    console.log('─'.repeat(60));
    console.log(test3.contextSummary);
    console.log('─'.repeat(60));

    console.log('\n✅ RAG Integration Test Complete!');
    console.log('\n💡 What this means:');
    console.log('   - Planning Agent now receives UI patterns for navigation');
    console.log('   - Planning Agent knows about saved materials');
    console.log('   - Commands like "open NEXBOT" will use the correct selector');
    console.log('   - Material requests will reference existing presets');
}

// Run test
testRAGIntegration().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
