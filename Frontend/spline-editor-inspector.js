/**
 * Spline Editor API Inspector
 *
 * This script is injected into the Spline editor page to discover
 * internal APIs for scene manipulation.
 *
 * Usage: Inject via content script, inspect console output
 */

(function() {
    'use strict';

    console.log('[Spline Inspector] Starting API discovery...');

    const discoveries = {
        globals: [],
        splineObjects: [],
        sceneAPIs: [],
        possibleMethods: []
    };

    // 1. Search for Spline-related global variables
    console.log('\n🔍 Step 1: Searching window globals...');

    const globalKeys = Object.keys(window);
    const splineGlobals = globalKeys.filter(key =>
        key.toLowerCase().includes('spline') ||
        key.toLowerCase().includes('scene') ||
        key.toLowerCase().includes('editor') ||
        key.toLowerCase().includes('app') ||
        key.startsWith('__')
    );

    console.log(`Found ${splineGlobals.length} potential globals:`, splineGlobals);
    discoveries.globals = splineGlobals;

    // 2. Inspect each global for useful APIs
    console.log('\n🔍 Step 2: Inspecting globals...');

    splineGlobals.forEach(globalName => {
        const obj = window[globalName];
        if (obj && typeof obj === 'object') {
            console.log(`\n📦 window.${globalName}:`, {
                type: typeof obj,
                constructor: obj.constructor?.name,
                keys: Object.keys(obj).slice(0, 10),
                hasScene: 'scene' in obj,
                hasObjects: 'objects' in obj,
                hasCanvas: 'canvas' in obj
            });

            // Check for scene-related properties
            if (obj.scene || obj.objects || obj.getScene) {
                discoveries.sceneAPIs.push({
                    global: globalName,
                    hasScene: !!obj.scene,
                    hasObjects: !!obj.objects,
                    hasGetScene: !!obj.getScene,
                    methods: Object.keys(obj).filter(k => typeof obj[k] === 'function')
                });
            }
        }
    });

    // 3. Check React/Vue dev tools for component state
    console.log('\n🔍 Step 3: Checking framework state...');

    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools detected');
        // Could inspect React fiber tree here
    }

    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ Vue DevTools detected');
    }

    // 4. Inspect canvas element for attached data
    console.log('\n🔍 Step 4: Inspecting canvas...');

    const canvas = document.querySelector('canvas');
    if (canvas) {
        console.log('📺 Canvas element found:');

        // Check for attached properties
        Object.keys(canvas).forEach(key => {
            if (!key.startsWith('on') && typeof canvas[key] !== 'function') {
                console.log(`  canvas.${key}:`, typeof canvas[key]);
            }
        });

        // Check for WebGL context
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
            console.log('  WebGL context:', gl.constructor.name);
        }
    }

    // 5. Search for Three.js objects (Spline uses Three.js)
    console.log('\n🔍 Step 5: Searching for Three.js...');

    if (window.THREE) {
        console.log('✅ THREE.js exposed globally');
        discoveries.possibleMethods.push('window.THREE');
    }

    // Check for scene graph in window
    globalKeys.forEach(key => {
        const obj = window[key];
        if (obj && obj.scene && obj.scene.children) {
            console.log(`✅ Found Three.js scene at window.${key}.scene`);
            console.log(`   Objects in scene: ${obj.scene.children.length}`);
            discoveries.sceneAPIs.push({
                global: key,
                path: `${key}.scene`,
                objectCount: obj.scene.children.length
            });
        }
    });

    // 6. Try to find object by name (common pattern)
    console.log('\n🔍 Step 6: Testing object lookup patterns...');

    const testPatterns = [
        () => window.app?.scene?.getObjectByName('Cube'),
        () => window.editor?.scene?.getObjectByName('Cube'),
        () => window.__app?.scene?.getObjectByName('Cube'),
        () => document.querySelector('[data-spline-scene]'),
        () => canvas?.__spline__?.scene
    ];

    testPatterns.forEach((pattern, i) => {
        try {
            const result = pattern();
            if (result) {
                console.log(`✅ Pattern ${i} successful:`, pattern.toString());
                discoveries.possibleMethods.push(pattern.toString());
            }
        } catch (e) {
            // Silent fail
        }
    });

    // 7. Summary
    console.log('\n📊 API Discovery Summary:');
    console.log('='.repeat(60));
    console.log('Discoveries:', JSON.stringify(discoveries, null, 2));
    console.log('='.repeat(60));

    // Make discoveries available to extension
    window.__SPLINE_INSPECTOR_RESULTS__ = discoveries;

    console.log('\n✅ Inspector complete! Check window.__SPLINE_INSPECTOR_RESULTS__');
    console.log('💡 Try these in console:');
    splineGlobals.forEach(g => {
        console.log(`   window.${g}`);
    });

})();
