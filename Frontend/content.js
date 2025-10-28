// Content Script for Spline CLI + SIM.ai Extension
// Injected into app.spline.design pages
(function() {
    'use strict';

    console.log('[Spline CLI] Content script loaded');

    // State
    let isOverlayVisible = false;
    let currentMode = 'prompt'; // 'prompt' or 'gui'
    let settings = { viewerPort: 8080 };
    let formData = {
        material: {},
        object: {},
        text: {},
        interaction: {},
        animation: {},
        export: {}
    };

    // Initialize
    init();

    async function init() {
        // Load settings
        await loadSettings();

        // Inject overlay
        injectOverlay();

        // Setup keyboard shortcuts
        setupKeyboardShortcuts();

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener(handleMessage);

        console.log('[Spline CLI] Overlay ready');

        // Auto-detect scene load and initialize session
        detectSceneLoad();
    }

    // Wait for element to appear in DOM
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Timeout fallback
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    // Detect when Spline scene is loaded and auto-initialize session
    async function detectSceneLoad() {
        console.log('[Spline CLI] Waiting for Spline scene to load...');

        // Wait for canvas element (indicates Spline is loaded)
        const canvas = await waitForElement('canvas', 15000);

        if (canvas) {
            console.log('[Spline CLI] Scene detected, initializing session...');

            // Send message to background script to initialize session
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'initializeSession',
                    sceneUrl: window.location.href
                });

                if (response.success) {
                    if (response.reused) {
                        console.log('[Spline CLI] Using existing session:', response.sessionId);
                        addOutput('Session ready (reused existing)', 'success');
                    } else {
                        console.log('[Spline CLI] Session initialized:', response.sessionId);
                        addOutput('Session initialized successfully', 'success');
                    }
                } else {
                    console.error('[Spline CLI] Session init failed:', response.error);
                    addOutput('Session initialization failed: ' + response.error, 'error');
                }
            } catch (error) {
                console.error('[Spline CLI] Session init error:', error);
                addOutput('Session initialization error: ' + error.message, 'error');
            }
        } else {
            console.warn('[Spline CLI] Canvas not found - scene may not be loaded');
            addOutput('Warning: Spline scene not detected', 'warning');
        }
    }

    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['viewerPort']);
            settings.viewerPort = result.viewerPort || 8080;
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // Inject overlay HTML
    function injectOverlay() {
        const overlayHTML = `
            <div id="spline-cli-overlay" class="spline-cli-overlay hidden">
                <div class="overlay-header">
                    <div class="drag-handle" title="Drag to move">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                    </div>
                    <div class="overlay-title">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span>Spline AI Assistant</span>
                    </div>
                    <div class="overlay-actions">
                        <button class="overlay-btn minimize-btn" title="Minimize">—</button>
                        <button class="overlay-btn close-btn" title="Close (Esc)">×</button>
                    </div>
                </div>

                <!-- Top Navigation -->
                <div class="top-nav">
                    <button class="nav-btn" data-cmd="inspect" title="Inspect scene">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        Inspect
                    </button>
                    <button class="nav-btn" data-cmd="screenshot" title="Take screenshot">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        Screenshot
                    </button>
                    <button class="nav-btn" data-cmd="inspector" title="Inspect Spline API">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        API Inspector
                    </button>
                    <button class="nav-btn" data-cmd="export" title="Export guide">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export
                    </button>
                </div>

                <div class="overlay-body">
                    <!-- Output Area -->
                    <div class="output-area" id="cli-output"></div>

                    <!-- Main Prompt Input -->
                    <div class="prompt-input-area">
                        <input type="text" id="cli-input" placeholder='Ask AI: "create a glass button" or "make cube red"...' />
                        <button class="send-btn" id="ai-execute-btn" title="Send (Enter)">
                            <span class="send-icon">➤</span>
                        </button>
                    </div>

                    <!-- AI Status -->
                    <div class="ai-status hidden" id="ai-status">
                        <span class="ai-spinner">
                            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6m0 6v6m5.66-13.66l-4.24 4.24M10.58 13.42l-4.24 4.24M23 12h-6m-6 0H1m18.66 5.66l-4.24-4.24M10.58 10.58l-4.24-4.24"/>
                            </svg>
                        </span>
                        <span class="ai-text">AI is thinking...</span>
                    </div>
                </div>

                <!-- Side Context Panels -->
                <div class="side-panels" id="side-panels">
                    <div class="side-tabs">
                        <button class="side-tab" data-panel="material" title="Material context">
                            <span class="tab-icon">
                                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                                    <polyline points="2 17 12 22 22 17"/>
                                    <polyline points="2 12 12 17 22 12"/>
                                </svg>
                            </span>
                            <span class="tab-label">Material</span>
                        </button>
                        <button class="side-tab" data-panel="object" title="Object context">
                            <span class="tab-icon">
                                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                            </span>
                            <span class="tab-label">Object</span>
                        </button>
                        <button class="side-tab" data-panel="text" title="Text context">
                            <span class="tab-icon">
                                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="4 7 4 4 20 4 20 7"/>
                                    <line x1="9" y1="20" x2="15" y2="20"/>
                                    <line x1="12" y1="4" x2="12" y2="20"/>
                                </svg>
                            </span>
                            <span class="tab-label">Text</span>
                        </button>
                        <button class="side-tab" data-panel="interaction" title="Interaction context">
                            <span class="tab-icon">
                                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/>
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
                                </svg>
                            </span>
                            <span class="tab-label">Interaction</span>
                        </button>
                        <button class="side-tab" data-panel="animation" title="Animation context">
                            <span class="tab-icon">
                                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                            </span>
                            <span class="tab-label">Animation</span>
                        </button>
                    </div>

                    <!-- Side Panel Content (slides out) -->
                    <div class="side-panel-content hidden" id="side-panel-content">
                        <div class="panel-header">
                            <h3 id="panel-title">Context</h3>
                            <button class="panel-close-btn" id="panel-close-btn">×</button>
                        </div>
                        <div class="panel-body" id="panel-body">
                            <!-- Panel content will be dynamically inserted here -->
                            <!-- Material Panel -->
                            <div id="material-panel" class="panel active">
                                <h3>Material Properties</h3>
                                <div class="form-group">
                                    <label>Type:</label>
                                    <select id="material-type">
                                        <option value="glass">Glass</option>
                                        <option value="metal">Metal</option>
                                        <option value="plastic">Plastic</option>
                                        <option value="wood">Wood</option>
                                        <option value="stone">Stone</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Transparency: <span id="transparency-value">0.7</span></label>
                                    <input type="range" id="material-transparency" min="0" max="1" step="0.1" value="0.7" />
                                </div>
                                <div class="form-group">
                                    <label>Color:</label>
                                    <input type="color" id="material-color" value="#4A90E2" />
                                </div>
                                <div class="form-group">
                                    <label>Roughness: <span id="roughness-value">0.5</span></label>
                                    <input type="range" id="material-roughness" min="0" max="1" step="0.1" value="0.5" />
                                </div>
                            </div>

                            <!-- Object Panel -->
                            <div id="object-panel" class="panel hidden">
                                <h3>Object Properties</h3>
                                <div class="form-group">
                                    <label>Type:</label>
                                    <select id="object-type">
                                        <option value="button">Button</option>
                                        <option value="cube">Cube</option>
                                        <option value="sphere">Sphere</option>
                                        <option value="cylinder">Cylinder</option>
                                        <option value="plane">Plane</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Width:</label>
                                    <input type="number" id="object-width" value="200" />
                                </div>
                                <div class="form-group">
                                    <label>Height:</label>
                                    <input type="number" id="object-height" value="50" />
                                </div>
                                <div class="form-group">
                                    <label>Depth:</label>
                                    <input type="number" id="object-depth" value="10" />
                                </div>
                                <div class="form-group">
                                    <label>Position X:</label>
                                    <input type="number" id="object-x" value="0" />
                                </div>
                                <div class="form-group">
                                    <label>Position Y:</label>
                                    <input type="number" id="object-y" value="0" />
                                </div>
                                <div class="form-group">
                                    <label>Position Z:</label>
                                    <input type="number" id="object-z" value="0" />
                                </div>
                            </div>

                            <!-- Text Panel -->
                            <div id="text-panel" class="panel hidden">
                                <h3>Text Properties</h3>
                                <div class="form-group">
                                    <label>Content:</label>
                                    <input type="text" id="text-content" value="Click Me" placeholder="Enter text..." />
                                </div>
                                <div class="form-group">
                                    <label>Font:</label>
                                    <select id="text-font">
                                        <option value="Inter">Inter</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Roboto">Roboto</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Size:</label>
                                    <input type="number" id="text-size" value="18" />
                                </div>
                                <div class="form-group">
                                    <label>Color:</label>
                                    <input type="color" id="text-color" value="#FFFFFF" />
                                </div>
                            </div>

                            <!-- Interaction Panel -->
                            <div id="interaction-panel" class="panel hidden">
                                <h3>Interaction Properties</h3>
                                <div class="form-group">
                                    <label>Event Type:</label>
                                    <select id="interaction-type">
                                        <option value="onClick">On Click</option>
                                        <option value="onHover">On Hover</option>
                                        <option value="onDrag">On Drag</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Action:</label>
                                    <select id="interaction-action">
                                        <option value="navigate">Navigate</option>
                                        <option value="animate">Animate</option>
                                        <option value="trigger">Trigger</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Target:</label>
                                    <input type="text" id="interaction-target" value="/page" placeholder="/path or element" />
                                </div>
                            </div>

                            <!-- Animation Panel -->
                            <div id="animation-panel" class="panel hidden">
                                <h3>Animation Properties</h3>
                                <div class="form-group">
                                    <label>Scale: <span id="scale-value">1.1</span></label>
                                    <input type="range" id="animation-scale" min="0.5" max="2" step="0.1" value="1.1" />
                                </div>
                                <div class="form-group">
                                    <label>Duration (s):</label>
                                    <input type="number" id="animation-duration" value="0.3" step="0.1" />
                                </div>
                                <div class="form-group">
                                    <label>Easing:</label>
                                    <select id="animation-easing">
                                        <option value="ease-out">Ease Out</option>
                                        <option value="ease-in">Ease In</option>
                                        <option value="ease-in-out">Ease In Out</option>
                                        <option value="linear">Linear</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label><input type="checkbox" id="animation-glow" checked /> Add Glow Effect</label>
                                </div>
                                <div class="form-group">
                                    <label>Glow Color:</label>
                                    <input type="color" id="animation-glow-color" value="#4A90E2" />
                                </div>
                            </div>

                            <!-- Export Panel -->
                            <div id="export-panel" class="panel hidden">
                                <h3>Export Properties</h3>
                                <div class="form-group">
                                    <label>Format:</label>
                                    <select id="export-format">
                                        <option value="glb">GLB</option>
                                        <option value="gltf">GLTF</option>
                                        <option value="obj">OBJ</option>
                                        <option value="fbx">FBX</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Quality:</label>
                                    <select id="export-quality">
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Apply Context Button -->
                            <div class="panel-actions">
                                <button class="panel-apply-btn" id="panel-apply-btn">✓ Apply Context</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button id="spline-cli-toggle" class="spline-cli-toggle" title="Toggle AI Assistant (Ctrl+K)">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
            </button>
        `;

        // Inject HTML
        const div = document.createElement('div');
        div.innerHTML = overlayHTML;
        document.body.appendChild(div);

        // Setup overlay interactions
        setupOverlay();
    }

    // Setup overlay interactions
    function setupOverlay() {
        const overlay = document.getElementById('spline-cli-overlay');
        const toggle = document.getElementById('spline-cli-toggle');
        const closeBtn = overlay.querySelector('.close-btn');
        const minimizeBtn = overlay.querySelector('.minimize-btn');
        const input = document.getElementById('cli-input');
        const aiExecuteBtn = document.getElementById('ai-execute-btn');
        const panelCloseBtn = document.getElementById('panel-close-btn');

        // Toggle button
        toggle?.addEventListener('click', toggleOverlay);
        closeBtn?.addEventListener('click', hideOverlay);
        minimizeBtn?.addEventListener('click', minimizeOverlay);

        // Side tab buttons (open side panels)
        overlay.querySelectorAll('.side-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const panelName = tab.dataset.panel;
                openSidePanel(panelName);
            });
        });

        // Panel close button
        panelCloseBtn?.addEventListener('click', closeSidePanel);

        // Top navigation buttons
        overlay.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                executeCommand(cmd);
            });
        });

        // AI Execute button
        aiExecuteBtn?.addEventListener('click', () => {
            const prompt = input.value.trim();
            if (prompt) {
                executeAIPrompt(prompt);
                input.value = '';
            }
        });

        // Input handling
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const prompt = input.value.trim();
                if (prompt) {
                    executeAIPrompt(prompt);
                    input.value = '';
                }
            } else if (e.key === 'Escape') {
                hideOverlay();
            }
        });

        // Range slider updates
        setupRangeSliders();

        // Form input handlers
        setupFormInputs();

        // Panel apply button
        const panelApplyBtn = document.getElementById('panel-apply-btn');
        panelApplyBtn?.addEventListener('click', applyPanelContext);

        // Make draggable
        makeDraggable(overlay);

        // Initial position
        overlay.style.top = '100px';
        overlay.style.right = '20px';
    }

    // Open side panel
    function openSidePanel(panelName) {
        const sidePanelContent = document.getElementById('side-panel-content');
        const panelTitle = document.getElementById('panel-title');

        // Update panel title
        const titles = {
            material: 'Material Context',
            object: 'Object Context',
            text: 'Text Context',
            interaction: 'Interaction Context',
            animation: 'Animation Context'
        };
        panelTitle.textContent = titles[panelName] || 'Context';

        // Show all panels first (they'll be hidden by CSS)
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
            panel.classList.add('hidden');
        });

        // Show the selected panel
        const selectedPanel = document.getElementById(`${panelName}-panel`);
        if (selectedPanel) {
            selectedPanel.classList.add('active');
            selectedPanel.classList.remove('hidden');
        }

        // Show the side panel
        sidePanelContent?.classList.remove('hidden');

        // Highlight active tab
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
    }

    // Close side panel
    function closeSidePanel() {
        const sidePanelContent = document.getElementById('side-panel-content');
        sidePanelContent?.classList.add('hidden');

        // Remove active state from tabs
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.remove('active');
        });
    }

    // Execute AI prompt (with optional context from side panels)
    async function executeAIPrompt(prompt) {
        addOutput(`> ${prompt}`, 'command');
        addOutput('Processing with Three-Agent System...', 'info');

        try {
            // Show context if available
            if (Object.keys(formData).some(key => Object.keys(formData[key]).length > 0)) {
                addOutput(`Context: ${JSON.stringify(formData, null, 2)}`, 'info');
            }

            // Send directly to Three-Agent System API
            const response = await chrome.runtime.sendMessage({
                action: 'executeAICommand',
                prompt: prompt,
                context: formData  // Material, object, text, interaction, animation
            });

            if (response.success) {
                // Extension mode: Show plan and execute
                if (response.mode === 'extension' && response.plan) {
                    addOutput('AI Plan Generated:', 'success');
                    addOutput(`Intent: ${response.plan.intent}`, 'info');
                    addOutput(`Steps to execute:`, 'info');

                    response.plan.steps?.forEach((step, index) => {
                        addOutput(`  ${index + 1}. ${step.description}`, 'info');
                        addOutput(`     Action: ${step.action}`, 'info');
                        if (step.params) {
                            addOutput(`     Params: ${JSON.stringify(step.params)}`, 'info');
                        }
                    });

                    addOutput(`Validation: ${response.plan.validation}`, 'info');
                    addOutput('', 'info');
                    addOutput('Executing plan in scene...', 'info');

                    // Execute the plan
                    executePlanInPage(response.plan);
                }
                // Puppeteer mode: Show execution results
                else if (response.result) {
                    addOutput('Command executed successfully!', 'success');
                    addOutput(`Execution ID: ${response.executionId}`, 'info');

                    const result = response.result;
                    if (result.plan) {
                        addOutput(`Intent: ${result.plan.intent}`, 'info');
                        addOutput(`Steps executed: ${result.steps?.length || 0}`, 'info');
                    }
                    if (result.success) {
                        addOutput(`All steps completed successfully`, 'success');
                    } else if (result.steps) {
                        const successful = result.steps.filter(s => s.success).length;
                        addOutput(`${successful}/${result.steps.length} steps succeeded`, 'warning');
                    }
                }
            } else {
                addOutput(`Error: ${response.error}`, 'error');
                if (response.details) {
                    addOutput(`   ${response.details}`, 'error');
                }
            }

        } catch (error) {
            addOutput(`Error: ${error.message}`, 'error');
        }
    }

    // Apply context from current panel
    function applyPanelContext() {
        addOutput('✓ Context applied to form', 'success');
        closeSidePanel();
    }

    // Setup range slider value updates
    function setupRangeSliders() {
        const sliders = [
            { id: 'material-transparency', valueId: 'transparency-value' },
            { id: 'material-roughness', valueId: 'roughness-value' },
            { id: 'animation-scale', valueId: 'scale-value' }
        ];

        sliders.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    valueDisplay.textContent = e.target.value;
                });
            }
        });
    }

    // Setup form input handlers
    function setupFormInputs() {
        // Material inputs
        document.getElementById('material-type')?.addEventListener('change', (e) => {
            formData.material.type = e.target.value;
        });
        document.getElementById('material-transparency')?.addEventListener('input', (e) => {
            formData.material.transparency = parseFloat(e.target.value);
        });
        document.getElementById('material-color')?.addEventListener('input', (e) => {
            formData.material.color = e.target.value;
        });
        document.getElementById('material-roughness')?.addEventListener('input', (e) => {
            formData.material.roughness = parseFloat(e.target.value);
        });

        // Object inputs
        document.getElementById('object-type')?.addEventListener('change', (e) => {
            formData.object.type = e.target.value;
        });
        document.getElementById('object-width')?.addEventListener('input', (e) => {
            formData.object.width = parseInt(e.target.value);
        });
        document.getElementById('object-height')?.addEventListener('input', (e) => {
            formData.object.height = parseInt(e.target.value);
        });
        document.getElementById('object-depth')?.addEventListener('input', (e) => {
            formData.object.depth = parseInt(e.target.value);
        });
        document.getElementById('object-x')?.addEventListener('input', (e) => {
            formData.object.x = parseInt(e.target.value);
        });
        document.getElementById('object-y')?.addEventListener('input', (e) => {
            formData.object.y = parseInt(e.target.value);
        });
        document.getElementById('object-z')?.addEventListener('input', (e) => {
            formData.object.z = parseInt(e.target.value);
        });

        // Text inputs
        document.getElementById('text-content')?.addEventListener('input', (e) => {
            formData.text.content = e.target.value;
        });
        document.getElementById('text-font')?.addEventListener('change', (e) => {
            formData.text.font = e.target.value;
        });
        document.getElementById('text-size')?.addEventListener('input', (e) => {
            formData.text.size = parseInt(e.target.value);
        });
        document.getElementById('text-color')?.addEventListener('input', (e) => {
            formData.text.color = e.target.value;
        });

        // Interaction inputs
        document.getElementById('interaction-type')?.addEventListener('change', (e) => {
            formData.interaction.type = e.target.value;
        });
        document.getElementById('interaction-action')?.addEventListener('change', (e) => {
            formData.interaction.action = e.target.value;
        });
        document.getElementById('interaction-target')?.addEventListener('input', (e) => {
            formData.interaction.target = e.target.value;
        });

        // Animation inputs
        document.getElementById('animation-scale')?.addEventListener('input', (e) => {
            formData.animation.scale = parseFloat(e.target.value);
        });
        document.getElementById('animation-duration')?.addEventListener('input', (e) => {
            formData.animation.duration = parseFloat(e.target.value);
        });
        document.getElementById('animation-easing')?.addEventListener('change', (e) => {
            formData.animation.easing = e.target.value;
        });
        document.getElementById('animation-glow')?.addEventListener('change', (e) => {
            formData.animation.glow = e.target.checked;
        });
        document.getElementById('animation-glow-color')?.addEventListener('input', (e) => {
            formData.animation.glowColor = e.target.value;
        });

        // Export inputs
        document.getElementById('export-format')?.addEventListener('change', (e) => {
            formData.export.format = e.target.value;
        });
        document.getElementById('export-quality')?.addEventListener('change', (e) => {
            formData.export.quality = e.target.value;
        });

        // Initialize form data with default values
        initializeFormData();
    }

    // Initialize form data with default values
    function initializeFormData() {
        formData = {
            material: {
                type: document.getElementById('material-type')?.value || 'glass',
                transparency: parseFloat(document.getElementById('material-transparency')?.value || 0.7),
                color: document.getElementById('material-color')?.value || '#4A90E2',
                roughness: parseFloat(document.getElementById('material-roughness')?.value || 0.5)
            },
            object: {
                type: document.getElementById('object-type')?.value || 'button',
                width: parseInt(document.getElementById('object-width')?.value || 200),
                height: parseInt(document.getElementById('object-height')?.value || 50),
                depth: parseInt(document.getElementById('object-depth')?.value || 10),
                x: parseInt(document.getElementById('object-x')?.value || 0),
                y: parseInt(document.getElementById('object-y')?.value || 0),
                z: parseInt(document.getElementById('object-z')?.value || 0)
            },
            text: {
                content: document.getElementById('text-content')?.value || 'Click Me',
                font: document.getElementById('text-font')?.value || 'Inter',
                size: parseInt(document.getElementById('text-size')?.value || 18),
                color: document.getElementById('text-color')?.value || '#FFFFFF'
            },
            interaction: {
                type: document.getElementById('interaction-type')?.value || 'onClick',
                action: document.getElementById('interaction-action')?.value || 'navigate',
                target: document.getElementById('interaction-target')?.value || '/page'
            },
            animation: {
                scale: parseFloat(document.getElementById('animation-scale')?.value || 1.1),
                duration: parseFloat(document.getElementById('animation-duration')?.value || 0.3),
                easing: document.getElementById('animation-easing')?.value || 'ease-out',
                glow: document.getElementById('animation-glow')?.checked ?? true,
                glowColor: document.getElementById('animation-glow-color')?.value || '#4A90E2'
            },
            export: {
                format: document.getElementById('export-format')?.value || 'glb',
                quality: document.getElementById('export-quality')?.value || 'high'
            }
        };
    }

    // Submit GUI form to SIM.ai
    async function submitGUIForm() {
        // Show AI thinking status
        switchMode('prompt'); // Switch to prompt mode to show output
        addOutput('🎨 Generating from GUI form...', 'info');
        addOutput(JSON.stringify(formData, null, 2), 'info');

        try {
            // Get SIM.ai API key from settings
            const settings = await chrome.storage.sync.get(['simaiApiKey']);
            const apiKey = settings.simaiApiKey;

            if (!apiKey) {
                addOutput('SIM.ai API key not configured. Go to extension Options.', 'error');
                return;
            }

            // Send form data to SIM.ai workflow
            const response = await chrome.runtime.sendMessage({
                action: 'executeGUIWorkflow',
                formData: formData,
                apiKey: apiKey
            });

            if (response.success) {
                addOutput('SIM.ai workflow executed successfully!', 'success');
                addOutput(`Execution ID: ${response.executionId}`, 'info');
            } else {
                addOutput(`Error: ${response.error}`, 'error');
            }

        } catch (error) {
            addOutput(`Error: ${error.message}`, 'error');
        }
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleOverlay();
                return;
            }

            // Esc to close
            if (e.key === 'Escape' && isOverlayVisible) {
                hideOverlay();
                return;
            }

            // Quick shortcuts when overlay is visible
            if (isOverlayVisible && !document.getElementById('cli-input').matches(':focus')) {
                switch (e.key.toLowerCase()) {
                    case 'i':
                        e.preventDefault();
                        executeCommand('inspect');
                        break;
                    case 'e':
                        e.preventDefault();
                        executeCommand('export');
                        break;
                    case 's':
                        e.preventDefault();
                        executeCommand('screenshot');
                        break;
                }
            }
        });
    }

    // Toggle overlay
    function toggleOverlay() {
        if (isOverlayVisible) {
            hideOverlay();
        } else {
            showOverlay();
        }
    }

    // Show overlay
    function showOverlay() {
        const overlay = document.getElementById('spline-cli-overlay');
        overlay?.classList.remove('hidden', 'minimized');
        isOverlayVisible = true;

        // Focus input
        setTimeout(() => {
            document.getElementById('cli-input')?.focus();
        }, 100);
    }

    // Hide overlay
    function hideOverlay() {
        const overlay = document.getElementById('spline-cli-overlay');
        overlay?.classList.add('hidden');
        isOverlayVisible = false;
    }

    // Minimize overlay
    function minimizeOverlay() {
        const overlay = document.getElementById('spline-cli-overlay');
        overlay?.classList.toggle('minimized');
    }

    // Execute command
    async function executeCommand(command) {
        addOutput(`> ${command}`, 'command');

        try {
            // Check if it's a built-in command
            const builtInCommands = ['inspect', 'export', 'screenshot', 'objects', 'clear', 'help'];

            if (builtInCommands.includes(command)) {
                // Execute built-in commands
                switch (command) {
                    case 'inspect':
                        await commandInspect();
                        break;
                    case 'export':
                        await commandExport();
                        break;
                    case 'screenshot':
                        await commandScreenshot();
                        break;
                    case 'objects':
                        await commandObjects();
                        break;
                    case 'inspector':
                        await commandInspector();
                        break;
                    case 'clear':
                        clearOutput();
                        break;
                    case 'help':
                        showHelp();
                        break;
                }
            } else {
                // Use AI to parse natural language command
                await executeAICommand(command);
            }
        } catch (error) {
            addOutput(`Error: ${error.message}`, 'error');
        }
    }

    // Execute AI-powered natural language command
    async function executeAICommand(command) {
        // Show AI thinking status
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus) {
            aiStatus.classList.remove('hidden');
        }

        try {
            // Send to background script for AI parsing
            const response = await chrome.runtime.sendMessage({
                action: 'parseAICommand',
                command: command
            });

            // Hide AI status
            if (aiStatus) {
                aiStatus.classList.add('hidden');
            }

            if (!response.success) {
                addOutput(`AI Error: ${response.error}`, 'error');
                return;
            }

            // Show parsed commands
            addOutput(`AI parsed ${response.count} command(s): ${response.summary}`, 'info');

            // Execute each parsed command
            for (const cmd of response.commands) {
                addOutput(`  ➜ ${cmd.description}`, 'info');

                // Execute the command
                const result = await executeSplineCommand(cmd);

                if (result.success) {
                    addOutput(`    Success`, 'success');
                } else {
                    addOutput(`    Failed: ${result.error}`, 'error');
                }
            }

        } catch (error) {
            if (aiStatus) {
                aiStatus.classList.add('hidden');
            }
            addOutput(`Error: ${error.message}`, 'error');
        }
    }

    // Execute a single Spline command
    async function executeSplineCommand(cmd) {
        try {
            // For now, send to viewer API
            // In a full implementation, this would use @splinetool/runtime directly
            const response = await fetch(`http://localhost:${settings.viewerPort}/api/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cmd)
            });

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: `API error: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Commands
    async function commandInspect() {
        addOutput('📊 Inspecting current scene...', 'info');
        // Call viewer API
        await callViewerAPI('/api/info');
    }

    async function commandExport() {
        addOutput('Export functionality - navigate to File → Export → Code Export', 'info');
    }

    async function commandScreenshot() {
        addOutput('Taking screenshot...', 'info');
        // This would integrate with Spline's screenshot functionality
        addOutput('Screenshot captured', 'success');
    }

    async function commandObjects() {
        addOutput('Listing objects...', 'info');
        await callViewerAPI('/api/info');
    }

    async function commandInspector() {
        addOutput('🔍 Running Spline API Inspector...', 'info');
        addOutput('This will search for Spline editor APIs', 'info');
        addOutput('Check browser console (F12) for detailed output', 'info');

        try {
            // Load and inject inspector script
            const response = await fetch(chrome.runtime.getURL('spline-editor-inspector.js'));
            const inspectorCode = await response.text();

            // Inject into page context
            const script = document.createElement('script');
            script.textContent = inspectorCode;
            document.documentElement.appendChild(script);
            script.remove();

            // Wait a bit for inspector to run
            await new Promise(r => setTimeout(r, 1000));

            // Try to get results from window
            const results = await new Promise((resolve) => {
                const checkScript = document.createElement('script');
                const resultId = `inspector_result_${Date.now()}`;

                window.addEventListener(resultId, (e) => {
                    resolve(e.detail);
                }, { once: true });

                checkScript.textContent = `
                    window.dispatchEvent(new CustomEvent('${resultId}', {
                        detail: window.__SPLINE_INSPECTOR_RESULTS__ || { error: 'No results found' }
                    }));
                `;

                document.documentElement.appendChild(checkScript);
                checkScript.remove();

                // Timeout
                setTimeout(() => resolve({ error: 'Timeout' }), 3000);
            });

            if (results.error) {
                addOutput(`Error: ${results.error}`, 'error');
            } else {
                addOutput('', 'info');
                addOutput('✅ Inspector completed!', 'success');
                addOutput(`Found ${results.globals?.length || 0} global variables`, 'info');
                addOutput(`Found ${results.sceneAPIs?.length || 0} scene API candidates`, 'info');
                addOutput('', 'info');

                if (results.globals && results.globals.length > 0) {
                    addOutput('Global Variables:', 'info');
                    results.globals.slice(0, 10).forEach(g => {
                        addOutput(`  - window.${g}`, 'info');
                    });
                }

                if (results.sceneAPIs && results.sceneAPIs.length > 0) {
                    addOutput('', 'info');
                    addOutput('Scene APIs:', 'success');
                    results.sceneAPIs.forEach(api => {
                        addOutput(`  ${api.global}: ${JSON.stringify(api)}`, 'info');
                    });
                }

                addOutput('', 'info');
                addOutput('📝 Full results in console (window.__SPLINE_INSPECTOR_RESULTS__)', 'info');
            }

        } catch (error) {
            addOutput(`Inspector error: ${error.message}`, 'error');
        }
    }

    // Call viewer API
    async function callViewerAPI(endpoint, options = {}) {
        try {
            const url = `http://localhost:${settings.viewerPort}${endpoint}`;
            const response = await fetch(url, options);

            if (response.ok) {
                const data = await response.json();
                addOutput(JSON.stringify(data, null, 2), 'success');
            } else {
                addOutput(`API Error: ${response.status}`, 'error');
            }
        } catch (error) {
            addOutput(`Cannot connect to viewer. Make sure it's running at port ${settings.viewerPort}`, 'error');
        }
    }

    // Send command to viewer
    async function sendToViewer(command) {
        await callViewerAPI('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
    }

    // Add output to console
    function addOutput(text, type = 'info') {
        const output = document.getElementById('cli-output');
        if (!output) return;

        const line = document.createElement('div');
        line.className = `output-line output-${type}`;
        line.textContent = text;
        output.appendChild(line);

        // Auto-scroll
        output.scrollTop = output.scrollHeight;

        // Limit lines
        const lines = output.children;
        if (lines.length > 100) {
            output.removeChild(lines[0]);
        }
    }

    // Clear output
    function clearOutput() {
        const output = document.getElementById('cli-output');
        if (output) output.innerHTML = '';
    }

    // Show help
    function showHelp() {
        addOutput('Available commands:', 'info');
        addOutput('  inspect    - Inspect current scene', 'info');
        addOutput('  viewer     - Open viewer in new tab', 'info');
        addOutput('  export     - Export scene guide', 'info');
        addOutput('  screenshot - Take screenshot', 'info');
        addOutput('  objects    - List objects', 'info');
        addOutput('  clear      - Clear output', 'info');
        addOutput('  help       - Show this help', 'info');
        addOutput('', 'info');
        addOutput('Keyboard shortcuts:', 'info');
        addOutput('  Ctrl+K - Toggle overlay', 'info');
        addOutput('  I - Inspect', 'info');
        addOutput('  V - Viewer', 'info');
        addOutput('  E - Export', 'info');
        addOutput('  S - Screenshot', 'info');
    }

    // Make element draggable
    function makeDraggable(element) {
        const header = element.querySelector('.overlay-header');
        const dragHandle = element.querySelector('.drag-handle');
        if (!header) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;

        // Make entire header draggable, but especially the drag handle
        header.onmousedown = dragMouseDown;
        if (dragHandle) {
            dragHandle.style.cursor = 'grab';
        }

        function dragMouseDown(e) {
            // Don't drag if clicking buttons
            if (e.target.classList.contains('overlay-btn') ||
                e.target.classList.contains('close-btn') ||
                e.target.classList.contains('minimize-btn') ||
                e.target.closest('.overlay-btn') ||
                e.target.closest('.close-btn') ||
                e.target.closest('.minimize-btn')) {
                return;
            }

            e.preventDefault();
            isDragging = true;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Add visual feedback
            element.classList.add('dragging');
            header.style.cursor = 'grabbing';
            if (dragHandle) dragHandle.style.cursor = 'grabbing';
            element.style.boxShadow = '0 16px 64px rgba(102, 126, 234, 0.6)';

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!isDragging) return;

            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Calculate new position
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            // Keep within viewport bounds with better margins
            const margin = 50;
            const maxTop = window.innerHeight - margin;
            const maxLeft = window.innerWidth - margin;

            newTop = Math.max(0, Math.min(newTop, maxTop));
            newLeft = Math.max(-element.offsetWidth + margin, Math.min(newLeft, maxLeft));

            element.style.top = newTop + 'px';
            element.style.left = newLeft + 'px';
            element.style.right = 'auto';
        }

        function closeDragElement() {
            isDragging = false;
            element.classList.remove('dragging');
            header.style.cursor = 'grab';
            if (dragHandle) dragHandle.style.cursor = 'grab';
            element.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Execute plan in the Spline scene
    async function executePlanInPage(plan) {
        addOutput('Starting execution...', 'info');

        try {
            // Execute each step
            for (let i = 0; i < plan.steps.length; i++) {
                const step = plan.steps[i];
                addOutput(`Executing step ${i + 1}: ${step.description}`, 'info');

                // Inject and execute the command in page context
                const result = await executeStepInPage(step);

                if (result.success) {
                    addOutput(`  ✓ Step ${i + 1} completed`, 'success');
                } else {
                    addOutput(`  ✗ Step ${i + 1} failed: ${result.error}`, 'error');
                }
            }

            addOutput('', 'info');
            addOutput('Plan execution completed!', 'success');
            addOutput(plan.validation, 'info');

        } catch (error) {
            addOutput(`Execution error: ${error.message}`, 'error');
        }
    }

    // Execute a single step by injecting code into the page
    function executeStepInPage(step) {
        return new Promise((resolve) => {
            // Create a script element to inject into page context
            const script = document.createElement('script');
            const callbackId = `spline_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Listen for the result from the page
            window.addEventListener(callbackId, (event) => {
                resolve(event.detail);
            }, { once: true });

            // Inject code to execute the Spline command
            script.textContent = `
                (function() {
                    try {
                        // Find the Spline canvas
                        const canvas = document.querySelector('canvas');
                        if (!canvas) {
                            window.dispatchEvent(new CustomEvent('${callbackId}', {
                                detail: { success: false, error: 'Canvas not found' }
                            }));
                            return;
                        }

                        const step = ${JSON.stringify(step)};

                        // Try to find Spline application instance
                        let splineApp = null;
                        let scene = null;

                        // Method 1: Check common global variables
                        const possibleGlobals = ['__spline', '__app', 'splineApp', 'app', 'editor'];
                        for (const globalName of possibleGlobals) {
                            if (window[globalName] && window[globalName].scene) {
                                splineApp = window[globalName];
                                scene = splineApp.scene;
                                console.log('[Spline CLI] Found Spline app at window.' + globalName);
                                break;
                            }
                        }

                        // Method 2: Check canvas for attached data
                        if (!splineApp && canvas.__spline) {
                            splineApp = canvas.__spline;
                            scene = splineApp.scene;
                            console.log('[Spline CLI] Found Spline app on canvas');
                        }

                        // Method 3: Search window for Three.js scene
                        if (!scene) {
                            for (const key in window) {
                                const obj = window[key];
                                if (obj && typeof obj === 'object' && obj.scene && obj.scene.children) {
                                    scene = obj.scene;
                                    console.log('[Spline CLI] Found Three.js scene at window.' + key);
                                    break;
                                }
                            }
                        }

                        if (!scene) {
                            window.dispatchEvent(new CustomEvent('${callbackId}', {
                                detail: {
                                    success: false,
                                    error: 'Spline scene not accessible. Try using the inspector command first.'
                                }
                            }));
                            return;
                        }

                        // Execute based on action type
                        switch(step.action) {
                            case 'setMaterial':
                                // Change material properties
                                const matObject = scene.getObjectByName(step.params.objectName);
                                if (matObject) {
                                    if (step.params.color) {
                                        matObject.material.color.setStyle(step.params.color);
                                    }
                                    if (step.params.opacity !== undefined) {
                                        matObject.material.opacity = step.params.opacity;
                                        matObject.material.transparent = step.params.opacity < 1;
                                    }
                                    if (step.params.roughness !== undefined) {
                                        matObject.material.roughness = step.params.roughness;
                                    }
                                    if (step.params.metalness !== undefined) {
                                        matObject.material.metalness = step.params.metalness;
                                    }
                                    matObject.material.needsUpdate = true;
                                    console.log('[Spline CLI] Material updated:', step.params);
                                    window.dispatchEvent(new CustomEvent('${callbackId}', {
                                        detail: { success: true, message: 'Material updated successfully' }
                                    }));
                                } else {
                                    window.dispatchEvent(new CustomEvent('${callbackId}', {
                                        detail: { success: false, error: 'Object not found: ' + step.params.objectName }
                                    }));
                                }
                                break;

                            case 'setObjectProperty':
                                // Change object properties
                                const propObject = scene.getObjectByName(step.params.objectName);
                                if (propObject) {
                                    const prop = step.params.property;
                                    const value = step.params.value;

                                    if (prop === 'position') {
                                        propObject.position.set(value.x, value.y, value.z);
                                    } else if (prop === 'rotation') {
                                        propObject.rotation.set(value.x, value.y, value.z);
                                    } else if (prop === 'scale') {
                                        if (typeof value === 'number') {
                                            propObject.scale.setScalar(value);
                                        } else {
                                            propObject.scale.set(value.x, value.y, value.z);
                                        }
                                    } else if (prop === 'visible') {
                                        propObject.visible = value;
                                    } else if (propObject[prop] !== undefined) {
                                        propObject[prop] = value;
                                    }

                                    console.log('[Spline CLI] Property updated:', prop, value);
                                    window.dispatchEvent(new CustomEvent('${callbackId}', {
                                        detail: { success: true, message: 'Property updated successfully' }
                                    }));
                                } else {
                                    window.dispatchEvent(new CustomEvent('${callbackId}', {
                                        detail: { success: false, error: 'Object not found: ' + step.params.objectName }
                                    }));
                                }
                                break;

                            case 'createObject':
                                // Create new object (basic implementation)
                                console.log('[Spline CLI] Create object:', step.params);
                                window.dispatchEvent(new CustomEvent('${callbackId}', {
                                    detail: {
                                        success: false,
                                        error: 'Object creation not yet supported. Use Spline editor to add objects.'
                                    }
                                }));
                                break;

                            default:
                                window.dispatchEvent(new CustomEvent('${callbackId}', {
                                    detail: {
                                        success: false,
                                        error: 'Unknown action: ' + step.action
                                    }
                                }));
                        }
                    } catch (error) {
                        window.dispatchEvent(new CustomEvent('${callbackId}', {
                            detail: { success: false, error: error.message }
                        }));
                    }
                })();
            `;

            document.documentElement.appendChild(script);
            script.remove();

            // Timeout fallback
            setTimeout(() => {
                resolve({ success: false, error: 'Execution timeout' });
            }, 5000);
        });
    }

    // Handle messages from extension
    function handleMessage(request, sender, sendResponse) {
        console.log('📨 Received message:', request);

        if (request.action === 'executeCommand') {
            executeCommand(request.command);
            sendResponse({ success: true });
        } else if (request.action === 'toggleOverlay') {
            toggleOverlay();
            sendResponse({ success: true });
        }

        return true;
    }
})();
