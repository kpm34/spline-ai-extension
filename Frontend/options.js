// Options Page Script
(function() {
    'use strict';

    // Default settings
    const DEFAULT_SETTINGS = {
        simaiApiKey: '',  // Optional - only for SIM.ai workflow visualization
        viewerPort: 8080,
        viewerUrl: 'http://localhost:8080',
        autoLoadWorkflows: true,
        showNotifications: true,
        debugMode: false
    };

    let settings = { ...DEFAULT_SETTINGS };

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        console.log('Options page initialized');

        // Load current settings
        await loadSettings();

        // Setup event listeners
        setupEventListeners();

        // Update port in URL when port changes
        document.getElementById('viewer-port').addEventListener('input', (e) => {
            const port = e.target.value;
            document.getElementById('viewer-url').value = `http://localhost:${port}`;
        });
    }

    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
            settings = { ...DEFAULT_SETTINGS, ...result };

            // Update UI
            document.getElementById('simai-api-key').value = settings.simaiApiKey || '';
            document.getElementById('viewer-port').value = settings.viewerPort;
            document.getElementById('viewer-url').value = settings.viewerUrl;
            document.getElementById('auto-load-workflows').checked = settings.autoLoadWorkflows;
            document.getElementById('show-notifications').checked = settings.showNotifications;
            document.getElementById('debug-mode').checked = settings.debugMode;
        } catch (error) {
            console.error('Failed to load settings:', error);
            showStatus('Failed to load settings', 'error');
        }
    }

    // Save settings
    async function saveSettings() {
        // Get values from form
        settings.simaiApiKey = document.getElementById('simai-api-key').value.trim();
        settings.viewerPort = parseInt(document.getElementById('viewer-port').value) || 8080;
        settings.viewerUrl = document.getElementById('viewer-url').value.trim();
        settings.autoLoadWorkflows = document.getElementById('auto-load-workflows').checked;
        settings.showNotifications = document.getElementById('show-notifications').checked;
        settings.debugMode = document.getElementById('debug-mode').checked;

        try {
            await chrome.storage.sync.set(settings);
            showStatus('✅ Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showStatus('❌ Failed to save settings', 'error');
        }
    }

    // Reset settings to defaults
    async function resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        settings = { ...DEFAULT_SETTINGS };

        try {
            await chrome.storage.sync.set(settings);

            // Update UI
            document.getElementById('simai-api-key').value = '';
            document.getElementById('viewer-port').value = 8080;
            document.getElementById('viewer-url').value = 'http://localhost:8080';
            document.getElementById('auto-load-workflows').checked = true;
            document.getElementById('show-notifications').checked = true;
            document.getElementById('debug-mode').checked = false;

            showStatus('✅ Settings reset to defaults', 'success');
        } catch (error) {
            console.error('Failed to reset settings:', error);
            showStatus('❌ Failed to reset settings', 'error');
        }
    }

    // Test SIM.ai connection
    async function testSimaiConnection() {
        const apiKey = document.getElementById('simai-api-key').value.trim();

        if (!apiKey) {
            showStatus('⚠️ Please enter an API key first', 'error');
            return;
        }

        showStatus('🔄 Testing SIM.ai connection...', 'info');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'validateSimaiKey',
                apiKey: apiKey
            });

            if (response.valid) {
                showStatus('✅ SIM.ai connection successful!', 'success');
            } else {
                showStatus(`❌ SIM.ai connection failed: ${response.error}`, 'error');
            }
        } catch (error) {
            console.error('Test failed:', error);
            showStatus(`❌ Test failed: ${error.message}`, 'error');
        }
    }

    // Test viewer connection
    async function testViewerConnection() {
        const viewerUrl = document.getElementById('viewer-url').value.trim();

        showStatus('🔄 Testing viewer connection...', 'info');

        try {
            const response = await fetch(`${viewerUrl}/api/health`);

            if (response.ok) {
                const data = await response.json();
                showStatus(`✅ Viewer connection successful! Status: ${data.status || 'running'}`, 'success');
            } else {
                showStatus(`❌ Viewer returned status: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('Viewer test failed:', error);
            showStatus('❌ Cannot connect to viewer. Make sure it\'s running with: spline-edit viewer', 'error');
        }
    }

    // Test Three-Agent API Server connection
    async function testAPIConnection() {
        showStatus('🔄 Testing Three-Agent API server...', 'info');

        try {
            const response = await fetch('http://localhost:8081/health');

            if (response.ok) {
                const data = await response.json();
                showStatus(`✅ API Server connected! Status: ${data.status}, Sessions: ${data.sessions}`, 'success');
                console.log('API Server health:', data);
            } else {
                showStatus(`❌ API Server returned status: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('API Server test failed:', error);
            showStatus('❌ Cannot connect to API server. Make sure it\'s running with: npm run api-server', 'error');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        document.getElementById('save-all-settings').addEventListener('click', saveSettings);
        document.getElementById('reset-settings').addEventListener('click', resetSettings);
        document.getElementById('test-simai-connection').addEventListener('click', testSimaiConnection);
        document.getElementById('test-viewer-connection').addEventListener('click', testViewerConnection);
        document.getElementById('test-api-connection').addEventListener('click', testAPIConnection);

        document.getElementById('open-simai-dashboard').addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://www.sim.ai/workspace' });
        });
    }

    // Show status message
    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status-message');

        const classMap = {
            success: 'success',
            error: 'error',
            info: 'info'
        };

        const iconMap = {
            success: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        statusDiv.innerHTML = `
            <div class="status-box ${classMap[type]}">
                <span class="status-icon">${iconMap[type]}</span>
                <span>${message}</span>
            </div>
        `;

        // Auto-hide after 5 seconds for success/info
        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }
    }
})();
