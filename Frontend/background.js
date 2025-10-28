// Background Service Worker for Spline AI Extension
console.log('🚀 Spline AI Extension background service worker started');

// API Base URLs
const THREE_AGENT_API = 'http://localhost:8081/api';  // Primary: Three-Agent System
const SIMAI_API_BASE = 'http://localhost:3003/api';   // Optional: SIM.ai for workflows

// Session management
let currentSessionId = null;
let currentSceneUrl = null;

// Import AI Command Parser
importScripts('ai-command-parser.js');

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.action);

    // Handle async responses
    (async () => {
        try {
            let response;

            switch (request.action) {
                // Session initialization (called when scene loads)
                case 'initializeSession':
                    response = await initializeSession(request.sceneUrl, sender.tab.id);
                    break;

                // PRIMARY: Direct Three-Agent System API
                case 'executeAICommand':
                    response = await executeAICommand(request.prompt, request.context, sender.tab.id);
                    break;

                // OPTIONAL: SIM.ai workflow execution
                case 'validateSimaiKey':
                    response = await validateSimaiKey(request.apiKey);
                    break;

                case 'getWorkflows':
                    response = await getWorkflows(request.apiKey);
                    break;

                case 'executeWorkflow':
                    response = await executeWorkflow(request.workflowId, request.apiKey);
                    break;

                case 'executeGUIWorkflow':
                    response = await executeGUIWorkflow(request.formData, request.apiKey);
                    break;

                case 'pushWorkflow':
                    response = await pushWorkflow(request.workflow, request.apiKey);
                    break;

                case 'importWorkflow':
                    response = await importWorkflow(request.workflowId, request.apiKey);
                    break;

                case 'parseAICommand':
                    response = await parseAICommand(request.command);
                    break;

                default:
                    response = { success: false, error: 'Unknown action' };
            }

            sendResponse(response);
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    // Return true to indicate async response
    return true;
});

// Initialize a new Three-Agent session
async function initializeSession(sceneUrl, tabId) {
    console.log(`🔧 Initializing session for scene: ${sceneUrl}`);

    try {
        // Check if we already have a session for this scene
        if (currentSessionId && currentSceneUrl === sceneUrl) {
            console.log('✅ Using existing session:', currentSessionId);
            return {
                success: true,
                sessionId: currentSessionId,
                reused: true
            };
        }

        // Initialize new session in extension mode (no Puppeteer)
        const response = await fetch(`${THREE_AGENT_API}/session/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sceneUrl: sceneUrl,
                mode: 'extension'  // Extension mode: no browser launch
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Session init failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Store session info
        currentSessionId = data.sessionId;
        currentSceneUrl = sceneUrl;

        console.log('✅ Session initialized:', currentSessionId);

        // Store in chrome.storage for persistence
        await chrome.storage.local.set({
            sessionId: currentSessionId,
            sceneUrl: currentSceneUrl
        });

        return {
            success: true,
            sessionId: currentSessionId,
            reused: false
        };

    } catch (error) {
        console.error('❌ Failed to initialize session:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get or create session (helper function)
async function ensureSession(tabId) {
    // Check if we have a current session
    if (currentSessionId) {
        return currentSessionId;
    }

    // Try to restore from storage
    const stored = await chrome.storage.local.get(['sessionId', 'sceneUrl']);
    if (stored.sessionId && stored.sceneUrl) {
        currentSessionId = stored.sessionId;
        currentSceneUrl = stored.sceneUrl;
        console.log('🔄 Restored session from storage:', currentSessionId);
        return currentSessionId;
    }

    // No session available - need to initialize
    // Get current tab URL
    const tab = await chrome.tabs.get(tabId);
    const initResult = await initializeSession(tab.url, tabId);

    if (!initResult.success) {
        throw new Error(`Session initialization failed: ${initResult.error}`);
    }

    return initResult.sessionId;
}

// Validate SIM.ai API key
async function validateSimaiKey(apiKey) {
    if (!apiKey) {
        return { valid: false, error: 'No API key provided' };
    }

    try {
        const response = await fetch(`${SIMAI_API_BASE}/workflows`, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return { valid: true };
        } else if (response.status === 401 || response.status === 403) {
            return { valid: false, error: 'Invalid API key' };
        } else {
            return { valid: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        console.error('Failed to validate API key:', error);
        return { valid: false, error: error.message };
    }
}

// Get workflows from SIM.ai
async function getWorkflows(apiKey) {
    if (!apiKey) {
        return { success: false, error: 'No API key provided' };
    }

    try {
        const response = await fetch(`${SIMAI_API_BASE}/workflows?limit=50&tags=spline`, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                workflows: data.workflows || []
            };
        } else {
            return { success: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        console.error('Failed to get workflows:', error);
        return { success: false, error: error.message };
    }
}

// Execute workflow
async function executeWorkflow(workflowId, apiKey) {
    if (!apiKey) {
        return { success: false, error: 'No API key provided' };
    }

    try {
        const response = await fetch(`${SIMAI_API_BASE}/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {}
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                executionId: data.executionId,
                status: data.status
            };
        } else {
            return { success: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        console.error('Failed to execute workflow:', error);
        return { success: false, error: error.message };
    }
}

// Execute GUI workflow with form data
async function executeGUIWorkflow(formData, apiKey) {
    if (!apiKey) {
        return { success: false, error: 'No API key provided' };
    }

    try {
        // Get workflow ID from storage (user must configure this in options)
        const settings = await chrome.storage.sync.get(['splineWorkflowId']);
        const workflowId = settings.splineWorkflowId;

        if (!workflowId) {
            return {
                success: false,
                error: 'No workflow configured. Please set a Spline Workflow ID in extension options.'
            };
        }

        console.log('Executing workflow:', workflowId, 'with data:', formData);

        // Execute workflow with form data
        const response = await fetch(`${SIMAI_API_BASE}/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: formData
            })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                executionId: data.executionId,
                status: data.status,
                workflowId: workflowId
            };
        } else {
            const errorText = await response.text();
            return { success: false, error: `API error: ${response.status} - ${errorText}` };
        }
    } catch (error) {
        console.error('Failed to execute GUI workflow:', error);
        return { success: false, error: error.message };
    }
}

// Push workflow to SIM.ai
async function pushWorkflow(workflow, apiKey) {
    if (!apiKey) {
        return { success: false, error: 'No API key provided' };
    }

    try {
        const response = await fetch(`${SIMAI_API_BASE}/workflows`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(convertToSimAIFormat(workflow))
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                workflowId: data.id,
                url: data.url
            };
        } else {
            return { success: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        console.error('Failed to push workflow:', error);
        return { success: false, error: error.message };
    }
}

// Import workflow from SIM.ai
async function importWorkflow(workflowId, apiKey) {
    if (!apiKey) {
        return { success: false, error: 'No API key provided' };
    }

    try {
        const response = await fetch(`${SIMAI_API_BASE}/workflows/${workflowId}`, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                workflow: convertFromSimAIFormat(data)
            };
        } else {
            return { success: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        console.error('Failed to import workflow:', error);
        return { success: false, error: error.message };
    }
}

// Convert local workflow format to SIM.ai format
function convertToSimAIFormat(workflow) {
    return {
        name: workflow.name,
        description: workflow.description || '',
        version: workflow.version || '1.0',
        blocks: (workflow.nodes || []).map(node => ({
            id: node.id,
            type: mapNodeTypeToSimAI(node.type),
            config: node.inputs || {},
            position: {
                x: node.x || 0,
                y: node.y || 0
            }
        })),
        connections: (workflow.connections || []).map(conn => ({
            source: conn.from,
            target: conn.to,
            type: 'data'
        })),
        triggers: [
            {
                type: 'api',
                enabled: true
            }
        ],
        metadata: {
            created: workflow.created || new Date().toISOString(),
            source: 'spline-cli-extension',
            tags: ['spline', 'automation']
        }
    };
}

// Convert SIM.ai format to local format
function convertFromSimAIFormat(simaiWorkflow) {
    return {
        name: simaiWorkflow.name,
        description: simaiWorkflow.description,
        version: simaiWorkflow.version,
        nodes: (simaiWorkflow.blocks || []).map(block => ({
            id: block.id,
            type: mapSimAITypeToLocal(block.type),
            title: block.config.title || block.type,
            x: block.position?.x || 0,
            y: block.position?.y || 0,
            inputs: block.config
        })),
        connections: (simaiWorkflow.connections || []).map(conn => ({
            from: conn.source,
            to: conn.target
        }))
    };
}

// Map node types
function mapNodeTypeToSimAI(nodeType) {
    const mapping = {
        'ai-prompt': 'llm',
        'http-request': 'api',
        'condition': 'router',
        'loop': 'loop',
        'wait': 'delay',
        'log': 'output',
        'transform-data': 'function'
    };
    return mapping[nodeType] || 'custom';
}

function mapSimAITypeToLocal(blockType) {
    const mapping = {
        'llm': 'ai-prompt',
        'api': 'http-request',
        'router': 'condition',
        'loop': 'loop',
        'delay': 'wait',
        'output': 'log',
        'function': 'transform-data'
    };
    return mapping[blockType] || 'custom';
}

// Parse AI command using OpenAI
async function parseAICommand(command) {
    try {
        // Get OpenAI API key from settings
        const settings = await chrome.storage.sync.get(['openaiApiKey']);
        const apiKey = settings.openaiApiKey;

        if (!apiKey) {
            return {
                success: false,
                error: 'OpenAI API key not configured. Go to extension Options to add your key.'
            };
        }

        // Create parser instance
        const parser = new AICommandParser(apiKey);

        // Parse the command
        const result = await parser.parse(command);

        console.log('🤖 AI parsed command:', result);

        return result;
    } catch (error) {
        console.error('Failed to parse AI command:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute AI command via Three-Agent System API (Primary Method)
async function executeAICommand(prompt, context = {}, tabId) {
    if (!prompt) {
        return { success: false, error: 'No prompt provided' };
    }

    try {
        console.log(`🤖 Executing AI command: "${prompt}"`);
        if (Object.keys(context).length > 0) {
            console.log(`📋 Context:`, context);
        }

        // Ensure we have a session
        let sessionId;
        try {
            sessionId = await ensureSession(tabId);
            console.log(`📍 Using session: ${sessionId}`);
        } catch (sessionError) {
            console.error('⚠️ Session error:', sessionError.message);
            return {
                success: false,
                error: 'No active session. Initialize a session first.',
                details: sessionError.message,
                hint: 'Make sure you\'re on a Spline scene page (app.spline.design/file/...)'
            };
        }

        // Call Three-Agent System API with session
        const response = await fetch(`${THREE_AGENT_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                prompt: prompt,
                context: context
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            // Check if session expired
            if (response.status === 400 && errorText.includes('session')) {
                console.warn('⚠️ Session expired, reinitializing...');
                currentSessionId = null;
                await chrome.storage.local.remove(['sessionId', 'sceneUrl']);

                // Retry once with new session
                sessionId = await ensureSession(tabId);
                const retryResponse = await fetch(`${THREE_AGENT_API}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, prompt, context })
                });

                if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    return {
                        success: true,
                        executionId: retryData.executionId,
                        result: retryData.result,
                        prompt: prompt,
                        context: context,
                        sessionReinitalized: true
                    };
                }
            }

            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        console.log(`✅ AI command executed successfully`);
        console.log(`📊 Result:`, data);

        // Handle extension mode response (plan instead of execution)
        if (data.mode === 'extension' && data.plan) {
            console.log(`📋 Plan generated:`, data.plan);

            // TODO: Send plan to content script for execution
            // For now, just return the plan

            return {
                success: true,
                executionId: data.executionId,
                mode: 'extension',
                plan: data.plan,
                prompt: prompt,
                context: context,
                message: 'Plan generated. In-page execution coming soon!'
            };
        }

        // Handle puppeteer mode response (full execution)
        return {
            success: true,
            executionId: data.executionId,
            result: data.result,
            prompt: prompt,
            context: context
        };

    } catch (error) {
        console.error('❌ Failed to execute AI command:', error);

        // Check if Three-Agent API server is running
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return {
                success: false,
                error: 'Three-Agent API server not running. Start it with: npm run api-server',
                details: error.message
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('🎉 Spline AI Extension installed!');
        console.log('💡 Start Three-Agent API: npm run api-server');
        chrome.tabs.create({
            url: 'options.html'
        });
    } else if (details.reason === 'update') {
        console.log('🔄 Spline AI Extension updated!');
    }
});
