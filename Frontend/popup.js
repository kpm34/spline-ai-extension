// Popup Script for Spline CLI + SIM.ai Extension
(function() {
    'use strict';

    // State
    let settings = {
        simaiApiKey: '',
        viewerPort: 8080
    };
    let workflows = [];

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        console.log('🚀 Popup initialized');

        // Load settings
        await loadSettings();

        // Setup tab switching
        setupTabs();

        // Setup quick commands
        setupQuickCommands();

        // Setup settings
        setupSettings();

        // Check status
        await checkStatus();

        // Note: Workflow listing disabled - use configured workflow ID instead
        // This avoids CORS issues with the /api/workflows endpoint
        showWorkflowsInfo();

        // Setup footer links
        setupFooterLinks();
    }

    // Tab Switching
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active content
                tabContents.forEach(tc => tc.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['simaiApiKey', 'viewerPort']);
            settings.simaiApiKey = result.simaiApiKey || '';
            settings.viewerPort = result.viewerPort || 8080;

            // Update UI
            const apiKeyInput = document.getElementById('simai-api-key');
            const portInput = document.getElementById('viewer-port');
            if (apiKeyInput) apiKeyInput.value = settings.simaiApiKey;
            if (portInput) portInput.value = settings.viewerPort;
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // Save settings
    async function saveSettings() {
        const apiKeyInput = document.getElementById('simai-api-key');
        const portInput = document.getElementById('viewer-port');

        settings.simaiApiKey = apiKeyInput.value.trim();
        settings.viewerPort = parseInt(portInput.value) || 8080;

        try {
            await chrome.storage.sync.set({
                simaiApiKey: settings.simaiApiKey,
                viewerPort: settings.viewerPort
            });

            showNotification('Settings saved!', 'success');

            // Refresh status
            await checkStatus();
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    }

    // Setup settings handlers
    function setupSettings() {
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSettings);
        }
    }

    // Check status of viewer and SIM.ai
    async function checkStatus() {
        // Check viewer
        try {
            const response = await fetch(`http://localhost:${settings.viewerPort}/api/health`);
            if (response.ok) {
                updateStatus('viewer', true);
            } else {
                updateStatus('viewer', false);
            }
        } catch (error) {
            updateStatus('viewer', false);
        }

        // Check SIM.ai - simplified check (just verify API key is set)
        // Note: We don't validate against the API to avoid CORS issues
        if (settings.simaiApiKey && settings.simaiApiKey.length > 0) {
            updateStatus('simai', true);
        } else {
            updateStatus('simai', false);
        }
    }

    // Update status indicator
    function updateStatus(service, connected) {
        const dot = document.getElementById(`${service}-status`);
        const text = document.getElementById(`${service}-text`);

        if (dot) {
            dot.classList.toggle('connected', connected);
        }

        if (text) {
            text.textContent = connected
                ? (service === 'viewer' ? 'Viewer ✓' : 'SIM.ai ✓')
                : (service === 'viewer' ? 'Viewer ✗' : 'SIM.ai ✗');
        }
    }

    // Load workflows from SIM.ai
    async function loadWorkflows() {
        const container = document.getElementById('workflows-list');
        if (!container) return;

        container.innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading workflows...</div></div>';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getWorkflows',
                apiKey: settings.simaiApiKey
            });

            if (response.success && response.workflows) {
                workflows = response.workflows;
                renderWorkflows(workflows);
            } else {
                showWorkflowsEmptyState();
            }
        } catch (error) {
            console.error('Failed to load workflows:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <div class="empty-state-text">Failed to load workflows</div>
                </div>
            `;
        }
    }

    // Render workflows
    function renderWorkflows(workflowList) {
        const container = document.getElementById('workflows-list');
        if (!container) return;

        if (workflowList.length === 0) {
            showWorkflowsEmptyState();
            return;
        }

        container.innerHTML = workflowList.map(workflow => `
            <div class="workflow-item">
                <div class="workflow-name">${escapeHtml(workflow.name)}</div>
                <div class="workflow-desc">${escapeHtml(workflow.description || 'No description')}</div>
                <div class="workflow-actions">
                    <button class="btn btn-primary execute-workflow" data-id="${workflow.id}">▶ Run</button>
                    <button class="btn edit-workflow" data-id="${workflow.id}">✏️ Edit</button>
                </div>
            </div>
        `).join('');

        // Setup workflow action handlers
        container.querySelectorAll('.execute-workflow').forEach(btn => {
            btn.addEventListener('click', () => executeWorkflow(btn.dataset.id));
        });

        container.querySelectorAll('.edit-workflow').forEach(btn => {
            btn.addEventListener('click', () => editWorkflow(btn.dataset.id));
        });
    }

    // Show workflows info (replaces listing since we use configured workflow ID)
    function showWorkflowsInfo() {
        const container = document.getElementById('workflows-list');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚡</div>
                <div class="empty-state-text">
                    Configure your workflow ID in Settings.<br>
                    <br>
                    The extension uses your configured workflow ID<br>
                    instead of listing workflows.
                </div>
            </div>
        `;
    }

    // Show empty state (kept for compatibility)
    function showWorkflowsEmptyState() {
        showWorkflowsInfo();
    }

    // Execute workflow
    async function executeWorkflow(workflowId) {
        try {
            showNotification('Executing workflow...', 'info');

            const response = await chrome.runtime.sendMessage({
                action: 'executeWorkflow',
                workflowId: workflowId,
                apiKey: settings.simaiApiKey
            });

            if (response.success) {
                showNotification('Workflow executed successfully!', 'success');
            } else {
                showNotification('Workflow execution failed', 'error');
            }
        } catch (error) {
            console.error('Failed to execute workflow:', error);
            showNotification('Failed to execute workflow', 'error');
        }
    }

    // Edit workflow
    function editWorkflow(workflowId) {
        // Open workflow builder with this workflow
        const url = `http://localhost:3001?workflowId=${workflowId}`;
        chrome.tabs.create({ url });
    }

    // Setup quick commands
    function setupQuickCommands() {
        const commands = document.querySelectorAll('.quick-cmd');
        commands.forEach(cmd => {
            cmd.addEventListener('click', () => {
                const command = cmd.dataset.cmd;
                executeQuickCommand(command);
            });
        });
    }

    // Execute quick command
    async function executeQuickCommand(command) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                showNotification('No active tab found', 'error');
                return;
            }

            if (!tab.url || !tab.url.includes('app.spline.design')) {
                showNotification('Please open a Spline project first', 'error');
                return;
            }

            // Send message to content script
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'executeCommand',
                    command: command
                });
                showNotification(`Executing: ${command}`, 'info');
            } catch (msgError) {
                console.error('Content script not ready:', msgError);
                showNotification('Overlay not ready. Press Ctrl+K on Spline page first.', 'error');
            }
        } catch (error) {
            console.error('Failed to execute command:', error);
            showNotification('Failed to execute command', 'error');
        }
    }

    // Setup footer links
    function setupFooterLinks() {
        document.getElementById('open-workflow-builder')?.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'http://localhost:3001' });
        });

        document.getElementById('open-docs')?.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://github.com/yourusername/spline-cli-editor' });
        });

        document.getElementById('open-options')?.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // You could implement a toast notification here
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
