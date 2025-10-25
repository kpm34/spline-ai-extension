/**
 * RAG System for Spline AI Extension
 *
 * Provides Retrieval-Augmented Generation capabilities:
 * 1. Store and retrieve UI navigation patterns
 * 2. Store and retrieve material/animation presets
 * 3. Semantic search for context enhancement
 */

const { ChromaClient } = require('chromadb');
const OpenAI = require('openai');

class RAGSystem {
    constructor(openaiApiKey, chromaUrl = 'http://localhost:8000') {
        if (!openaiApiKey) {
            throw new Error('OpenAI API key is required for RAG system');
        }

        this.apiKey = openaiApiKey;
        this.openai = new OpenAI({ apiKey: openaiApiKey });
        this.chromaUrl = chromaUrl;
        this.client = null;
        this.collections = {
            uiPatterns: null,
            materials: null
        };
        this.initialized = false;
    }

    /**
     * Initialize ChromaDB client and collections
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize ChromaDB client
            this.client = new ChromaClient({ path: this.chromaUrl });

            // Get or create UI patterns collection
            try {
                this.collections.uiPatterns = await this.client.getOrCreateCollection({
                    name: 'spline-ui-patterns',
                    metadata: { description: 'UI navigation patterns and selectors for Spline' }
                });
            } catch (error) {
                console.error('Failed to get/create UI patterns collection:', error);
                throw error;
            }

            // Get or create materials collection
            try {
                this.collections.materials = await this.client.getOrCreateCollection({
                    name: 'spline-materials',
                    metadata: { description: 'Material and animation presets extracted from Spline projects' }
                });
            } catch (error) {
                console.error('Failed to get/create materials collection:', error);
                throw error;
            }

            this.initialized = true;
            console.log('RAG System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize RAG system:', error);
            throw error;
        }
    }

    /**
     * Generate embedding for text using OpenAI
     */
    async generateEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Failed to generate embedding:', error);
            throw error;
        }
    }

    /**
     * Add UI pattern to knowledge base
     *
     * @param {Object} pattern
     * @param {string} pattern.id - Unique identifier
     * @param {string} pattern.description - What this pattern does
     * @param {string} pattern.page - Which Spline page (homepage, scene-editor, library, community)
     * @param {string} pattern.selector - CSS selector or action description
     * @param {Object} pattern.metadata - Additional context
     */
    async addUIPattern(pattern) {
        await this.ensureInitialized();

        const { id, description, page, selector, metadata = {} } = pattern;

        // Generate embedding
        const embedding = await this.generateEmbedding(description);

        // Store in ChromaDB
        await this.collections.uiPatterns.add({
            ids: [id],
            embeddings: [embedding],
            documents: [description],
            metadatas: [{
                page,
                selector,
                ...metadata
            }]
        });

        console.log(`Added UI pattern: ${id}`);
    }

    /**
     * Add material preset to knowledge base
     *
     * @param {Object} material
     * @param {string} material.id - Unique identifier
     * @param {string} material.name - Human-readable name
     * @param {string} material.description - Searchable description
     * @param {string} material.source - Source project (e.g., "community/nexbot")
     * @param {Object} material.properties - Material properties (type, color, transparency, etc.)
     * @param {Object} material.animation - Optional animation data
     */
    async addMaterial(material) {
        await this.ensureInitialized();

        const { id, name, description, source, properties, animation = null } = material;

        // Generate embedding
        const embedding = await this.generateEmbedding(description);

        // Store in ChromaDB (avoid null values in metadata)
        const metadata = {
            name,
            source,
            properties: JSON.stringify(properties),
            timestamp: new Date().toISOString()
        };

        if (animation) {
            metadata.animation = JSON.stringify(animation);
        }

        await this.collections.materials.add({
            ids: [id],
            embeddings: [embedding],
            documents: [description],
            metadatas: [metadata]
        });

        console.log(`Added material: ${name} (${id})`);
    }

    /**
     * Search UI patterns relevant to user prompt
     *
     * @param {string} query - User's prompt or query
     * @param {number} k - Number of results to return
     * @param {string} page - Optional filter by page type
     * @returns {Promise<Array>} - Matching UI patterns
     */
    async searchUIPatterns(query, k = 3, page = null) {
        await this.ensureInitialized();

        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Search in ChromaDB
        const where = page ? { page } : undefined;
        const results = await this.collections.uiPatterns.query({
            queryEmbeddings: [queryEmbedding],
            nResults: k,
            where
        });

        // Format results
        return this.formatResults(results);
    }

    /**
     * Search materials relevant to user prompt
     *
     * @param {string} query - User's description (e.g., "glossy blue glass")
     * @param {number} k - Number of results to return
     * @returns {Promise<Array>} - Matching materials
     */
    async searchMaterials(query, k = 3) {
        await this.ensureInitialized();

        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Search in ChromaDB
        const results = await this.collections.materials.query({
            queryEmbeddings: [queryEmbedding],
            nResults: k
        });

        // Format results and parse JSON properties
        const formatted = this.formatResults(results);
        return formatted.map(item => ({
            ...item,
            metadata: {
                ...item.metadata,
                properties: JSON.parse(item.metadata.properties),
                animation: item.metadata.animation ? JSON.parse(item.metadata.animation) : null
            }
        }));
    }

    /**
     * Enhance user prompt with relevant context from RAG
     *
     * @param {string} userPrompt - Original user prompt
     * @param {string} currentPage - Current Spline page user is on
     * @returns {Promise<Object>} - Enhanced context object
     */
    async enhancePrompt(userPrompt, currentPage = 'scene-editor') {
        await this.ensureInitialized();

        // Search for relevant UI patterns
        const uiPatterns = await this.searchUIPatterns(userPrompt, 3, currentPage);

        // Search for relevant materials (if prompt mentions materials/appearance)
        const materialKeywords = ['material', 'color', 'glass', 'metal', 'texture', 'appearance', 'style'];
        const hasMaterialIntent = materialKeywords.some(kw => userPrompt.toLowerCase().includes(kw));
        const materials = hasMaterialIntent ? await this.searchMaterials(userPrompt, 2) : [];

        return {
            originalPrompt: userPrompt,
            currentPage,
            retrievedUIPatterns: uiPatterns,
            retrievedMaterials: materials,
            contextSummary: this.generateContextSummary(uiPatterns, materials)
        };
    }

    /**
     * Generate a summary of retrieved context for Planning Agent
     */
    generateContextSummary(uiPatterns, materials) {
        const parts = [];

        if (uiPatterns.length > 0) {
            parts.push('UI Patterns:');
            uiPatterns.forEach((pattern, i) => {
                parts.push(`  ${i + 1}. ${pattern.document} (selector: ${pattern.metadata.selector})`);
            });
        }

        if (materials.length > 0) {
            parts.push('\nSaved Materials:');
            materials.forEach((mat, i) => {
                const props = mat.metadata.properties;
                parts.push(`  ${i + 1}. ${mat.metadata.name}: ${props.type} material (source: ${mat.metadata.source})`);
            });
        }

        return parts.join('\n') || 'No relevant context found in knowledge base.';
    }

    /**
     * Format ChromaDB query results
     */
    formatResults(results) {
        if (!results.ids || results.ids.length === 0 || results.ids[0].length === 0) {
            return [];
        }

        const formatted = [];
        for (let i = 0; i < results.ids[0].length; i++) {
            formatted.push({
                id: results.ids[0][i],
                document: results.documents[0][i],
                metadata: results.metadatas[0][i],
                distance: results.distances ? results.distances[0][i] : null
            });
        }

        return formatted;
    }

    /**
     * Ensure RAG system is initialized
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Get collection statistics
     */
    async getStats() {
        await this.ensureInitialized();

        const uiCount = await this.collections.uiPatterns.count();
        const materialsCount = await this.collections.materials.count();

        return {
            uiPatterns: uiCount,
            materials: materialsCount,
            total: uiCount + materialsCount
        };
    }

    /**
     * Clear all data from collections (for testing)
     */
    async clearAll() {
        await this.ensureInitialized();

        try {
            await this.client.deleteCollection({ name: 'spline-ui-patterns' });
            await this.client.deleteCollection({ name: 'spline-materials' });
            this.initialized = false;
            await this.initialize();
            console.log('All RAG data cleared');
        } catch (error) {
            console.error('Failed to clear RAG data:', error);
        }
    }
}

module.exports = { RAGSystem };
