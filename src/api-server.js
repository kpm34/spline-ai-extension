#!/usr/bin/env node

/**
 * Three-Agent System API Server
 *
 * Provides REST API for Chrome extension to execute AI-powered Spline commands.
 * Eliminates the need for SIM.ai in the critical path.
 */

require('dotenv').config({ silent: true });
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { ThreeAgentSystem } = require('./three-agent-system');
const { SplineRuntime } = require('./spline-runtime');
const { RAGSystem } = require('./rag-system');

const app = express();
const PORT = process.env.API_PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Store active sessions
const sessions = new Map();

// Initialize RAG System (global, shared across sessions)
let ragSystem = null;

async function initializeRAG() {
    try {
        log('Initializing RAG system...', 'info');
        ragSystem = new RAGSystem(process.env.OPENAI_API_KEY);
        await ragSystem.initialize();
        const stats = await ragSystem.getStats();
        log(`RAG system ready (${stats.uiPatterns} UI patterns, ${stats.materials} materials)`, 'success');
    } catch (error) {
        log(`RAG initialization failed: ${error.message}`, 'warning');
        log('Three-Agent System will work without RAG context', 'warning');
        ragSystem = null;
    }
}

// Logging
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '📘',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    }[type] || 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Generate plan for extension mode (no Puppeteer)
 * Uses RAG + OpenAI to create execution plan
 */
async function generatePlanForExtension(prompt, context = {}, rag = null) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Enhance prompt with RAG if available
    let ragContext = '';
    if (rag) {
        try {
            const enhanced = await rag.enhancePrompt(prompt, 'scene-editor');
            ragContext = enhanced.contextSummary || '';
        } catch (error) {
            log(`RAG enhancement failed: ${error.message}`, 'warning');
        }
    }

    // Build system prompt
    const systemPrompt = `You are a Spline 3D scene planning assistant. Generate a step-by-step plan to execute the user's command.

${ragContext ? `\n### Knowledge Base Context:\n${ragContext}\n` : ''}

### User Context:
${JSON.stringify(context, null, 2)}

### Your Task:
Analyze the command and create a detailed execution plan with specific steps.

Return a JSON object with:
{
    "intent": "brief description of what user wants",
    "steps": [
        {
            "action": "spline_command_name",
            "description": "what this step does",
            "params": { /* command parameters */ }
        }
    ],
    "validation": "how to verify success"
}

Available Spline commands:
- setObjectProperty(name, property, value) - Change object properties
- setMaterial(objectName, material) - Apply material
- createObject(type, properties) - Create new object
- setVariable(name, value) - Set scene variable
- emitEvent(eventName) - Trigger event`;

    // Call OpenAI
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
    });

    const plan = JSON.parse(response.choices[0].message.content);
    return plan;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Three-Agent System API',
        version: '1.0.0',
        uptime: process.uptime(),
        sessions: sessions.size
    });
});

/**
 * Initialize a new session (Puppeteer mode - for standalone use)
 * POST /api/session/init
 * Body: { sceneUrl: string, mode?: 'puppeteer' | 'extension' }
 */
app.post('/api/session/init', async (req, res) => {
    try {
        const { sceneUrl, mode = 'extension' } = req.body;

        if (!sceneUrl) {
            return res.status(400).json({
                success: false,
                error: 'sceneUrl is required'
            });
        }

        log(`Initializing session for scene: ${sceneUrl} (mode: ${mode})`);

        // Extension mode: No Puppeteer, lightweight session
        if (mode === 'extension') {
            const sessionId = generateSessionId();
            sessions.set(sessionId, {
                mode: 'extension',
                sceneUrl,
                createdAt: Date.now(),
                ragSystem // Store RAG reference for agent queries
            });

            log(`Extension session initialized: ${sessionId}`, 'success');

            return res.json({
                success: true,
                sessionId,
                mode: 'extension',
                message: 'Extension session initialized (no browser launched)'
            });
        }

        // Puppeteer mode: Launch browser (for standalone CLI use)
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to Spline
        await page.goto(sceneUrl, { waitUntil: 'networkidle2' });

        // Wait for Spline to load
        await page.waitForSelector('canvas', { timeout: 30000 });

        // Initialize Spline Runtime
        const runtime = new SplineRuntime();
        await runtime.initialize(page);

        // Create Three-Agent System with RAG
        const system = new ThreeAgentSystem(page, runtime, ragSystem);

        // Store session
        const sessionId = generateSessionId();
        sessions.set(sessionId, {
            mode: 'puppeteer',
            browser,
            page,
            runtime,
            system,
            createdAt: Date.now()
        });

        log(`Puppeteer session initialized: ${sessionId}`, 'success');

        res.json({
            success: true,
            sessionId,
            mode: 'puppeteer',
            message: 'Puppeteer session initialized successfully'
        });

    } catch (error) {
        log(`Failed to initialize session: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Execute AI command with Three-Agent System
 * POST /api/execute
 * Body: {
 *   sessionId?: string,
 *   prompt: string,
 *   context?: { material, object, text, interaction, animation }
 * }
 */
app.post('/api/execute', async (req, res) => {
    try {
        const { sessionId, prompt, context = {} } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'prompt is required'
            });
        }

        // Get session if provided, otherwise use default
        let session;
        if (sessionId) {
            session = sessions.get(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }
        } else {
            // Use first available session or create error
            session = sessions.values().next().value;
            if (!session) {
                return res.status(400).json({
                    success: false,
                    error: 'No active session. Initialize a session first.'
                });
            }
        }

        log(`Executing command: "${prompt}" (mode: ${session.mode || 'puppeteer'})`);
        if (Object.keys(context).length > 0) {
            log(`Context provided: ${JSON.stringify(context)}`);
        }

        // Extension mode: Just run Planning Agent and return commands
        if (session.mode === 'extension') {
            const plan = await generatePlanForExtension(prompt, context, ragSystem);

            log(`Extension mode: Plan generated`, 'success');

            return res.json({
                success: true,
                executionId: generateExecutionId(),
                mode: 'extension',
                plan: plan,
                prompt: prompt,
                context: context,
                message: 'Extension should execute these commands in the page'
            });
        }

        // Puppeteer mode: Execute with Three-Agent System
        const result = await session.system.executeWithContext(prompt, context);

        log(`Command executed successfully`, 'success');

        res.json({
            success: true,
            executionId: generateExecutionId(),
            result: result,
            prompt: prompt,
            context: context
        });

    } catch (error) {
        log(`Execution failed: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Get suggestions based on current scene
 * POST /api/suggest
 * Body: { sessionId: string }
 */
app.post('/api/suggest', async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        log('Generating suggestions...');

        const suggestions = await session.system.suggestCommands();

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        log(`Failed to generate suggestions: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Close a session
 * POST /api/session/close
 * Body: { sessionId: string }
 */
app.post('/api/session/close', async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = sessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        log(`Closing session: ${sessionId} (mode: ${session.mode || 'puppeteer'})`);

        // Close browser only for Puppeteer mode
        if (session.mode === 'puppeteer' && session.browser) {
            await session.browser.close();
        }

        // Remove from sessions
        sessions.delete(sessionId);

        log(`Session closed: ${sessionId}`, 'success');

        res.json({
            success: true,
            message: 'Session closed successfully'
        });

    } catch (error) {
        log(`Failed to close session: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get active sessions
 * GET /api/sessions
 */
app.get('/api/sessions', (req, res) => {
    const sessionList = Array.from(sessions.entries()).map(([id, session]) => ({
        sessionId: id,
        createdAt: session.createdAt,
        uptime: Date.now() - session.createdAt
    }));

    res.json({
        success: true,
        sessions: sessionList,
        count: sessionList.length
    });
});

/**
 * Utility: Generate session ID
 */
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility: Generate execution ID
 */
function generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cleanup: Close all sessions on server shutdown
 */
async function cleanup() {
    log('Shutting down server...', 'warning');

    for (const [sessionId, session] of sessions.entries()) {
        try {
            // Only close browser for Puppeteer mode
            if (session.mode === 'puppeteer' && session.browser) {
                await session.browser.close();
            }
            log(`Closed session: ${sessionId}`, 'success');
        } catch (error) {
            log(`Error closing session ${sessionId}: ${error.message}`, 'error');
        }
    }

    sessions.clear();
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

/**
 * Start server
 */
app.listen(PORT, async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Three-Agent System API Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Active sessions: ${sessions.size}`);
    console.log('='.repeat(60) + '\n');

    log('Server ready to accept connections', 'success');

    // Initialize RAG system in background
    initializeRAG().catch(err => {
        log(`RAG initialization error: ${err.message}`, 'warning');
    });
});

module.exports = app;
