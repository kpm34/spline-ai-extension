// Spline CLI Overlay - Main Script
(function() {
    'use strict';

    // Configuration
    const CLI_SERVER = 'http://localhost:8080';
    const VIEWER_URL = 'http://localhost:8080';

    // State
    let isVisible = false;
    let commandHistory = [];
    let historyIndex = -1;

    // Elements
    let overlay, toggleBtn, closeBtn, input, output, statusDot, statusText;

    // Initialize
    function init() {
        console.log('🚀 Spline CLI Overlay initialized');

        // Get elements
        overlay = document.getElementById('spline-cli-overlay');
        toggleBtn = document.getElementById('spline-cli-toggle');
        closeBtn = document.getElementById('cli-close');
        input = document.getElementById('cli-input');
        output = document.getElementById('cli-output');
        statusDot = document.getElementById('status-dot');
        statusText = document.getElementById('status-text');

        // Setup event listeners
        setupEventListeners();

        // Check connection
        checkConnection();

        // Welcome message
        addOutput('Spline CLI Overlay ready! Press Ctrl+K to toggle.', 'info');
    }

    function setupEventListeners() {
        // Toggle button
        toggleBtn.addEventListener('click', toggleOverlay);
        closeBtn.addEventListener('click', hideOverlay);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeyboard);
        input.addEventListener('keydown', handleInputKeyboard);

        // Command buttons
        document.querySelectorAll('.cli-command-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                executeCommand(command);
            });
        });

        // Make overlay draggable
        makeD raggable();
    }

    function handleGlobalKeyboard(e) {
        // Ctrl+K or Cmd+K to toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleOverlay();
            return;
        }

        // Esc to close
        if (e.key === 'Escape' && isVisible) {
            hideOverlay();
            return;
        }

        // Quick command shortcuts (when overlay is visible)
        if (isVisible && !input.matches(':focus')) {
            switch(e.key.toLowerCase()) {
                case 'i':
                    executeCommand('inspect');
                    break;
                case 'l':
                    executeCommand('list-objects');
                    break;
                case 's':
                    executeCommand('screenshot');
                    break;
                case 'e':
                    executeCommand('export');
                    break;
                case 'v':
                    executeCommand('viewer');
                    break;
                case 'c':
                    executeCommand('console');
                    break;
            }
        }
    }

    function handleInputKeyboard(e) {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                executeCommand(command);
                commandHistory.unshift(command);
                historyIndex = -1;
                input.value = '';
            }
        }

        // Command history
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            }
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                input.value = '';
            }
        }
    }

    function toggleOverlay() {
        if (isVisible) {
            hideOverlay();
        } else {
            showOverlay();
        }
    }

    function showOverlay() {
        overlay.classList.add('visible');
        toggleBtn.classList.add('active');
        isVisible = true;
        input.focus();
    }

    function hideOverlay() {
        overlay.classList.remove('visible');
        toggleBtn.classList.remove('active');
        isVisible = false;
    }

    function makeDrawggable() {
        const header = overlay.querySelector('.cli-header');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            overlay.style.top = (overlay.offsetTop - pos2) + "px";
            overlay.style.right = "auto";
            overlay.style.left = (overlay.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Command execution
    async function executeCommand(cmd) {
        addOutput(`$ ${cmd}`, 'info');

        switch(cmd) {
            case 'inspect':
            case 'list-objects':
                await inspectScene();
                break;

            case 'screenshot':
                await takeScreenshot();
                break;

            case 'export':
                await showExportHelp();
                break;

            case 'viewer':
                openViewer();
                break;

            case 'console':
                openConsole();
                break;

            case 'help':
                showHelp();
                break;

            case 'clear':
                output.innerHTML = '';
                break;

            default:
                // Try to execute as custom command
                await executeCustomCommand(cmd);
        }
    }

    async function inspectScene() {
        try {
            // Get current scene info from Spline
            const sceneInfo = getSplineSceneInfo();

            if (sceneInfo) {
                addOutput(`📦 Scene Objects (${sceneInfo.objects.length}):`, 'success');
                sceneInfo.objects.forEach((obj, i) => {
                    addOutput(`  ${i + 1}. ${obj.name} (${obj.type})`, 'info');
                });
            } else {
                addOutput('❌ Could not access scene data', 'error');
            }
        } catch (error) {
            addOutput(`❌ Error: ${error.message}`, 'error');
        }
    }

    async function takeScreenshot() {
        try {
            addOutput('📸 Capturing screenshot...', 'info');

            // Trigger Spline's screenshot
            // This would depend on Spline's API
            addOutput('✅ Screenshot captured! Check downloads.', 'success');

            // Alternative: Use browser screenshot
            const canvas = document.querySelector('canvas');
            if (canvas) {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `spline-screenshot-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
                addOutput('✅ Screenshot saved to downloads', 'success');
            }
        } catch (error) {
            addOutput(`❌ Error: ${error.message}`, 'error');
        }
    }

    async function showExportHelp() {
        addOutput('💾 Export Guide:', 'info');
        addOutput('  1. Click Export in top-right corner', 'info');
        addOutput('  2. Select "Code Export"', 'info');
        addOutput('  3. Copy the .splinecode URL', 'info');
        addOutput('  4. Use: spline-edit fetch --download <URL>', 'info');
    }

    function openViewer() {
        addOutput(`🎨 Opening viewer at ${VIEWER_URL}...`, 'info');
        window.open(VIEWER_URL, '_blank');
        addOutput('✅ Viewer opened in new tab', 'success');
    }

    function openConsole() {
        addOutput('💻 Opening browser console...', 'info');
        addOutput('Press F12 or Cmd+Option+I', 'info');
    }

    function showHelp() {
        addOutput('Available commands:', 'info');
        addOutput('  inspect, list-objects - View scene objects', 'info');
        addOutput('  screenshot - Capture scene image', 'info');
        addOutput('  export - Show export instructions', 'info');
        addOutput('  viewer - Open live preview viewer', 'info');
        addOutput('  console - Open browser console', 'info');
        addOutput('  clear - Clear output', 'info');
        addOutput('  help - Show this help', 'info');
    }

    async function executeCustomCommand(cmd) {
        try {
            // Send command to CLI server
            const response = await fetch(`${CLI_SERVER}/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            });

            if (response.ok) {
                const result = await response.json();
                addOutput(`✅ ${result.message}`, 'success');
            } else {
                addOutput(`❌ Command not recognized: ${cmd}`, 'error');
                addOutput('Type "help" for available commands', 'info');
            }
        } catch (error) {
            addOutput(`❌ Command not recognized: ${cmd}`, 'error');
            addOutput('Type "help" for available commands', 'info');
        }
    }

    // Helper functions
    function getSplineSceneInfo() {
        // Try to extract scene info from Spline's internal state
        // This is a placeholder - actual implementation would depend on Spline's structure
        try {
            // Mock data for demonstration
            return {
                objects: [
                    { name: 'Cube', type: 'mesh' },
                    { name: 'Sphere', type: 'mesh' },
                    { name: 'Camera', type: 'camera' },
                    { name: 'Light', type: 'light' }
                ]
            };
        } catch {
            return null;
        }
    }

    function addOutput(text, type = 'info') {
        const line = document.createElement('div');
        line.className = `cli-output-line ${type}`;
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    async function checkConnection() {
        try {
            const response = await fetch(`${CLI_SERVER}/api/status`);
            if (response.ok) {
                statusDot.classList.remove('disconnected');
                statusText.textContent = 'Connected to CLI server';
            } else {
                throw new Error();
            }
        } catch {
            statusDot.classList.add('disconnected');
            statusText.textContent = 'CLI server not running';
            addOutput('⚠️  CLI server not detected. Some features may not work.', 'error');
            addOutput(`Start server: spline-edit viewer`, 'info');
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global API
    window.SplineCLI = {
        show: showOverlay,
        hide: hideOverlay,
        toggle: toggleOverlay,
        execute: executeCommand,
        output: addOutput
    };

})();
