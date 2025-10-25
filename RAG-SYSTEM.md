# RAG System for Spline AI Extension

## Overview

The RAG (Retrieval-Augmented Generation) system enhances the AI's ability to navigate Spline and work with materials by storing and retrieving relevant context from a knowledge base.

## Architecture

```
ChromaDB Server (Docker)
        ↓
   RAG System (src/rag-system.js)
        ↓
   Planning Agent (enhanced with RAG context)
        ↓
   Better command understanding & execution
```

## What's Stored

### 1. UI Navigation Patterns (22 patterns)
- **Homepage**: Open projects, search, navigate to community/library
- **Scene Editor**: Select objects, materials, animations, hierarchy
- **Library**: Browse and apply material presets
- **Community**: Browse, open, and remix community projects
- **Workflows**: Multi-step tasks like copying materials between projects

### 2. Material Presets (expandable)
- Glass materials (transparent, frosted, colored)
- Metal materials (chrome, brushed, etc.)
- Properties: type, color, transparency, roughness, IOR, etc.
- Source tracking: which project materials came from

## Usage

### Start ChromaDB Server

```bash
# Start ChromaDB in Docker (required before using RAG)
npm run chroma:start

# Check if it's running
curl http://localhost:8000/api/v2

# View logs
npm run chroma:logs

# Stop server
npm run chroma:stop
```

### Initialize RAG with Seed Data

```bash
# Initialize with default UI patterns and materials
npm run rag:init

# Clear existing data and reinitialize
npm run rag:clear
```

### How It Works

When a user types a prompt like **"open the NEXBOT project"**:

1. **RAG searches** for relevant UI patterns:
   ```
   Query: "open nexbot project"

   Results:
   - "Find and click a specific project by name like 'NEXBOT'"
     Selector: '.project-card:has-text("{PROJECT_NAME}")'
   - "Open a community project to view or remix"
     Selector: '.community-card'
   ```

2. **Planning Agent receives** enhanced context:
   ```
   User Prompt: "open the NEXBOT project"

   Retrieved Context:
   - Use selector: .project-card:has-text("NEXBOT")
   - Action: click
   - Page: homepage
   ```

3. **Result**: AI knows exactly how to navigate the homepage and click the right element!

## Programmatic Usage

```javascript
const { RAGSystem } = require('./src/rag-system');

// Initialize (requires OpenAI API key for embeddings)
const rag = new RAGSystem(process.env.OPENAI_API_KEY);
await rag.initialize();

// Add a new UI pattern
await rag.addUIPattern({
    id: 'custom-pattern-1',
    description: 'Click the play button to start animation',
    page: 'scene-editor',
    selector: '.play-button',
    metadata: { action: 'click', category: 'animation' }
});

// Add a material extracted from a community project
await rag.addMaterial({
    id: 'nexbot-glass',
    name: 'NEXBOT Robot Glass',
    description: 'Semi-transparent blue glass with high reflectivity',
    source: 'community/nexbot',
    properties: {
        type: 'glass',
        color: '#4A90E2',
        transparency: 0.7,
        roughness: 0.1,
        ior: 1.5
    }
});

// Search for relevant patterns
const patterns = await rag.searchUIPatterns('open a project', 3);

// Search for materials
const materials = await rag.searchMaterials('glossy blue glass', 2);

// Enhance a user prompt with context
const enhanced = await rag.enhancePrompt(
    'copy the glass material from NEXBOT',
    'homepage' // current page
);

console.log(enhanced.contextSummary);
// Output:
// UI Patterns:
//   1. Find and click project by name (selector: .project-card:has-text("{PROJECT_NAME}"))
//
// Saved Materials:
//   1. NEXBOT Robot Glass: glass material (source: community/nexbot)
```

## Building the Material Library from Community

The real power comes from **extracting materials from actual Spline community projects**:

```javascript
// Future workflow (to be implemented):
// 1. Browse community projects
// 2. Visual Agent analyzes scenes and extracts materials
// 3. Materials stored in RAG with source attribution
// 4. Users can search: "give me a material like NEXBOT's glass"

// Example extracted material:
{
    id: 'nexbot-metallic-joints',
    name: 'NEXBOT Metallic Joints',
    description: 'Dark metallic material with subtle roughness for robotic joints',
    source: 'community/nexbot-robot-character',
    properties: {
        type: 'metal',
        color: '#2C2C2C',
        metalness: 0.9,
        roughness: 0.3
    }
}
```

## Cost Analysis

### Storage
- **Local**: Free (Docker container, ~500MB disk space)
- **Cloud**: ChromaDB Cloud (~$0.40/GB/month for production)

### API Costs (OpenAI)
- **Embeddings**: ~$0.00001 per pattern/material
- **Initial seed** (25 items): ~$0.00025
- **100 new materials**: ~$0.001
- **1000 searches/day**: ~$0.01/day

Total monthly cost for moderate usage: **< $1**

## Production Deployment

### Local Development
```bash
docker compose -f docker-compose.chroma.yml up -d
```

### Cloud Deployment Options

**Option 1: Self-hosted ChromaDB** (AWS, GCP, Azure)
```yaml
# Deploy ChromaDB container
# Configure with persistent volumes
# Set CHROMA_URL env variable
```

**Option 2: ChromaDB Cloud** (Managed)
```javascript
const rag = new RAGSystem(
    process.env.OPENAI_API_KEY,
    'https://your-instance.chromadb.cloud'
);
```

**Option 3: Hybrid** (Local dev, Cloud production)
```javascript
const chromaUrl = process.env.NODE_ENV === 'production'
    ? process.env.CHROMA_CLOUD_URL
    : 'http://localhost:8000';

const rag = new RAGSystem(apiKey, chromaUrl);
```

## Files

- `src/rag-system.js` - Core RAG system implementation
- `src/rag-init.js` - Initialization script with seeding
- `src/rag-seed-data.js` - Default UI patterns and materials
- `docker-compose.chroma.yml` - ChromaDB server configuration
- `chroma-data/` - Persistent storage directory (auto-created)

## Next Steps

1. ✅ **RAG system is operational**
2. 🔄 **Integrate with Planning Agent** - Pass RAG context to improve accuracy
3. 🔄 **Add material extraction endpoint** - Extract from community projects
4. 📋 **Build Chrome extension UI** - Search and browse materials
5. 🚀 **Community learning** - Auto-extract from popular Spline projects

## Testing

```bash
# Test semantic search
node -e "
const { RAGSystem } = require('./src/rag-system');
(async () => {
    const rag = new RAGSystem(process.env.OPENAI_API_KEY);
    await rag.initialize();

    console.log('\\nSearch: open nexbot');
    const patterns = await rag.searchUIPatterns('open nexbot', 2);
    console.log(patterns.map(p => p.id));

    console.log('\\nSearch: shiny glass');
    const materials = await rag.searchMaterials('shiny glass', 2);
    console.log(materials.map(m => m.metadata.name));
})();
"
```

## Troubleshooting

**ChromaDB not connecting:**
```bash
# Check if Docker is running
docker ps | grep chroma

# Restart ChromaDB
npm run chroma:stop && npm run chroma:start

# Check logs
npm run chroma:logs
```

**Embeddings failing:**
```bash
# Verify OpenAI API key
echo $OPENAI_API_KEY

# Test API access
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Storage full:**
```bash
# Clear all data
npm run rag:clear

# Or manually remove data
rm -rf chroma-data/
```
