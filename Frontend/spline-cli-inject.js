// ==UserScript==
// @name         Spline CLI Overlay
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds CLI overlay to Spline editor
// @author       kashpm2002
// @match        https://app.spline.design/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Spline CLI Overlay - Injecting...');

    // Check if already injected
    if (document.getElementById('spline-cli-overlay')) {
        console.log('✅ CLI Overlay already present');
        return;
    }

    // Inject CSS
    function injectCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'http://localhost:8080/overlay/spline-cli-overlay.css';
        document.head.appendChild(link);

        // Inline critical CSS for faster load
        const style = document.createElement('style');
        style.textContent = `
            #spline-cli-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #5b8fff 0%, #4a7aee 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(91, 143, 255, 0.4);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
    }

    // Inject HTML
    function injectHTML() {
        fetch('http://localhost:8080/overlay/spline-cli-overlay.html')
            .then(response => response.text())
            .then(html => {
                const container = document.createElement('div');
                container.innerHTML = html;
                document.body.appendChild(container);

                console.log('✅ CLI Overlay HTML injected');

                // Inject JS after HTML is loaded
                injectJS();
            })
            .catch(error => {
                console.error('❌ Failed to load overlay:', error);
                fallbackInjection();
            });
    }

    // Inject JavaScript
    function injectJS() {
        const script = document.createElement('script');
        script.src = 'http://localhost:8080/overlay/spline-cli-overlay.js';
        script.onload = () => {
            console.log('✅ CLI Overlay JavaScript loaded');
        };
        script.onerror = () => {
            console.error('❌ Failed to load overlay script');
        };
        document.body.appendChild(script);
    }

    // Fallback injection if server not running
    function fallbackInjection() {
        console.log('⚠️  Using fallback injection');

        // Create minimal toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'spline-cli-toggle';
        toggleBtn.innerHTML = '⚡';
        toggleBtn.title = 'Spline CLI (Ctrl+K)';
        toggleBtn.onclick = () => {
            alert('CLI Server not running.\\n\\nStart with: spline-edit viewer');
        };
        document.body.appendChild(toggleBtn);
    }

    // Main injection
    function inject() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inject);
            return;
        }

        injectCSS();

        // Small delay to ensure page is fully loaded
        setTimeout(injectHTML, 1000);
    }

    inject();

    console.log('✅ Spline CLI Overlay injection complete');
})();
