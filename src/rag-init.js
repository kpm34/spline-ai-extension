#!/usr/bin/env node

/**
 * RAG System Initialization Script
 *
 * Seeds the RAG system with initial UI patterns and material presets
 */

require('dotenv').config({ silent: true });
const { RAGSystem } = require('./rag-system');
const { uiPatterns, materialPresets } = require('./rag-seed-data');

async function initializeRAG() {
    console.log('🚀 Initializing RAG System...\n');

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: OPENAI_API_KEY not found in environment');
        console.error('   Please add it to your .env file');
        process.exit(1);
    }

    try {
        // Initialize RAG system
        const rag = new RAGSystem(apiKey);
        await rag.initialize();

        console.log('📊 Current stats before seeding:');
        const statsBefore = await rag.getStats();
        console.log(`   - UI Patterns: ${statsBefore.uiPatterns}`);
        console.log(`   - Materials: ${statsBefore.materials}`);
        console.log(`   - Total: ${statsBefore.total}\n`);

        // Ask if user wants to clear existing data
        if (statsBefore.total > 0) {
            console.log('⚠️  Warning: Collections already contain data');
            console.log('   Run with --clear flag to reset: node src/rag-init.js --clear\n');

            if (process.argv.includes('--clear')) {
                console.log('🗑️  Clearing existing data...');
                await rag.clearAll();
                console.log('✅ Data cleared\n');
            } else {
                console.log('   Skipping seeding. Use --clear to reset data.');
                process.exit(0);
            }
        }

        // Seed UI patterns
        console.log(`📋 Seeding ${uiPatterns.length} UI patterns...`);
        for (const pattern of uiPatterns) {
            await rag.addUIPattern(pattern);
        }
        console.log(`✅ ${uiPatterns.length} UI patterns added\n`);

        // Seed material presets
        console.log(`🎨 Seeding ${materialPresets.length} material presets...`);
        for (const material of materialPresets) {
            await rag.addMaterial(material);
        }
        console.log(`✅ ${materialPresets.length} materials added\n`);

        // Show final stats
        console.log('📊 Final stats after seeding:');
        const statsAfter = await rag.getStats();
        console.log(`   - UI Patterns: ${statsAfter.uiPatterns}`);
        console.log(`   - Materials: ${statsAfter.materials}`);
        console.log(`   - Total: ${statsAfter.total}\n`);

        // Test retrieval
        console.log('🔍 Testing retrieval...\n');

        console.log('Test Query 1: "open nexbot project"');
        const test1 = await rag.searchUIPatterns('open nexbot project', 2);
        console.log('Results:', test1.map(r => ({ id: r.id, doc: r.document.substring(0, 60) + '...' })));
        console.log('');

        console.log('Test Query 2: "glossy glass material"');
        const test2 = await rag.searchMaterials('glossy glass material', 2);
        console.log('Results:', test2.map(r => ({
            name: r.metadata.name,
            type: r.metadata.properties.type
        })));
        console.log('');

        console.log('✅ RAG system initialized successfully!');
        console.log('\n💡 Tips:');
        console.log('   - The API server will automatically use RAG for enhanced context');
        console.log('   - Add more materials by extracting from community projects');
        console.log('   - UI patterns are matched semantically, not by exact keywords');

    } catch (error) {
        console.error('❌ Error initializing RAG system:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeRAG()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { initializeRAG };
