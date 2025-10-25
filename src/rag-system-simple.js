/**
 * Simple File-Based RAG System for Spline AI Extension
 *
 * Uses JSON files for storage and cosine similarity for search
 * No external server required
 */

const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const os = require('os');

class SimpleRAGSystem {
    constructor(openaiApiKey) {
        if (!openaiApiKey) {
            throw new Error('OpenAI API key is required for RAG system');
        }

        this.openai = new OpenAI({ apiKey: openaiApiKey });
        this.storageDir = path.join(os.homedir(), '.spline-rag');
        this.collections = {
            uiPatterns: path.join(this.storageDir, 'ui-patterns.json'),
            materials: path.join(this.storageDir, 'materials.json')
        };
        this.cache = {
            uiPatterns: null,
            materials: null
        };
    }

    /**
     * Initialize storage directory and load data
     */
    async initialize() {
        // Create storage directory if it doesn't exist
        await fs.ensureDir(this.storageDir);

        // Load or create collections
        for (const [name, filePath] of Object.entries(this.collections)) {
            if (await fs.pathExists(filePath)) {
                this.cache[name] = await fs.readJSON(filePath);
            } else {
                this.cache[name] = [];
                await fs.writeJSON(filePath, [], { spaces: 2 });
            }
        }

        console.log(`RAG System initialized (storage: ${this.storageDir})`);
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
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Add UI pattern to knowledge base
     */
    async addUIPattern(pattern) {
        const { id, description, page, selector, metadata = {} } = pattern;

        // Generate embedding
        const embedding = await this.generateEmbedding(description);

        // Create entry
        const entry = {
            id,
            document: description,
            embedding,
            metadata: {
                page,
                selector,
                ...metadata
            },
            timestamp: new Date().toISOString()
        };

        // Check if ID already exists
        const existingIndex = this.cache.uiPatterns.findIndex(p => p.id === id);
        if (existingIndex >= 0) {
            this.cache.uiPatterns[existingIndex] = entry;
        } else {
            this.cache.uiPatterns.push(entry);
        }

        // Save to file
        await fs.writeJSON(this.collections.uiPatterns, this.cache.uiPatterns, { spaces: 2 });

        console.log(`Added UI pattern: ${id}`);
    }

    /**
     * Add material preset to knowledge base
     */
    async addMaterial(material) {
        const { id, name, description, source, properties, animation = null } = material;

        // Generate embedding
        const embedding = await this.generateEmbedding(description);

        // Create entry
        const entry = {
            id,
            document: description,
            embedding,
            metadata: {
                name,
                source,
                properties,
                animation,
                timestamp: new Date().toISOString()
            }
        };

        // Check if ID already exists
        const existingIndex = this.cache.materials.findIndex(m => m.id === id);
        if (existingIndex >= 0) {
            this.cache.materials[existingIndex] = entry;
        } else {
            this.cache.materials.push(entry);
        }

        // Save to file
        await fs.writeJSON(this.collections.materials, this.cache.materials, { spaces: 2 });

        console.log(`Added material: ${name} (${id})`);
    }

    /**
     * Search UI patterns relevant to user prompt
     */
    async searchUIPatterns(query, k = 3, page = null) {
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Filter by page if specified
        let candidates = this.cache.uiPatterns;
        if (page) {
            candidates = candidates.filter(p => p.metadata.page === page);
        }

        // Calculate similarities
        const results = candidates.map(pattern => ({
            ...pattern,
            similarity: this.cosineSimilarity(queryEmbedding, pattern.embedding)
        }));

        // Sort by similarity (highest first) and take top k
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, k).map(({ embedding, similarity, ...rest }) => ({
            ...rest,
            distance: 1 - similarity // Convert similarity to distance
        }));
    }

    /**
     * Search materials relevant to user prompt
     */
    async searchMaterials(query, k = 3) {
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Calculate similarities
        const results = this.cache.materials.map(material => ({
            ...material,
            similarity: this.cosineSimilarity(queryEmbedding, material.embedding)
        }));

        // Sort by similarity (highest first) and take top k
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, k).map(({ embedding, similarity, ...rest }) => ({
            ...rest,
            distance: 1 - similarity
        }));
    }

    /**
     * Enhance user prompt with relevant context from RAG
     */
    async enhancePrompt(userPrompt, currentPage = 'scene-editor') {
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
     * Get collection statistics
     */
    async getStats() {
        return {
            uiPatterns: this.cache.uiPatterns.length,
            materials: this.cache.materials.length,
            total: this.cache.uiPatterns.length + this.cache.materials.length,
            storageDir: this.storageDir
        };
    }

    /**
     * Clear all data from collections (for testing)
     */
    async clearAll() {
        this.cache.uiPatterns = [];
        this.cache.materials = [];

        await fs.writeJSON(this.collections.uiPatterns, [], { spaces: 2 });
        await fs.writeJSON(this.collections.materials, [], { spaces: 2 });

        console.log('All RAG data cleared');
    }
}

module.exports = { SimpleRAGSystem };
