/**
 * Seed Data for RAG System
 *
 * Initial UI patterns and knowledge for navigating Spline
 */

const uiPatterns = [
    // HOMEPAGE PATTERNS
    {
        id: 'homepage-open-project-card',
        description: 'Click on a project card to open a Spline scene from the homepage',
        page: 'homepage',
        selector: '.project-card, [data-testid="project-card"]',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Project cards appear in grid layout on homepage'
        }
    },
    {
        id: 'homepage-search-projects',
        description: 'Search for projects by name using the search box',
        page: 'homepage',
        selector: 'input[type="search"], .search-input, [placeholder*="Search"]',
        metadata: {
            action: 'type',
            category: 'search',
            notes: 'Usually in top navigation bar'
        }
    },
    {
        id: 'homepage-create-new',
        description: 'Create a new Spline project',
        page: 'homepage',
        selector: 'button:has-text("Create"), [data-testid="create-button"]',
        metadata: {
            action: 'click',
            category: 'creation',
            notes: 'Opens new project creation dialog'
        }
    },
    {
        id: 'homepage-navigate-community',
        description: 'Navigate to community projects section',
        page: 'homepage',
        selector: 'a[href*="/community"], nav a:has-text("Community")',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Browse community-created projects'
        }
    },
    {
        id: 'homepage-navigate-library',
        description: 'Navigate to library section with materials and templates',
        page: 'homepage',
        selector: 'a[href*="/library"], nav a:has-text("Library")',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Access material library and templates'
        }
    },
    {
        id: 'homepage-project-by-name',
        description: 'Find and click a specific project by name like "NEXBOT" or "Sky Lab"',
        page: 'homepage',
        selector: '.project-card:has-text("{PROJECT_NAME}")',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Replace {PROJECT_NAME} with actual project title'
        }
    },

    // SCENE EDITOR PATTERNS
    {
        id: 'editor-select-object',
        description: 'Select an object in the 3D scene by name',
        page: 'scene-editor',
        selector: 'canvas',
        metadata: {
            action: 'click-object',
            category: 'selection',
            notes: 'Requires Visual Agent to locate object in scene'
        }
    },
    {
        id: 'editor-object-panel',
        description: 'Access object properties panel (right sidebar)',
        page: 'scene-editor',
        selector: '.properties-panel, .inspector-panel, [data-testid="properties"]',
        metadata: {
            action: 'view',
            category: 'inspection',
            notes: 'Shows selected object properties'
        }
    },
    {
        id: 'editor-material-properties',
        description: 'View or edit material properties of selected object',
        page: 'scene-editor',
        selector: '.material-section, [data-section="material"]',
        metadata: {
            action: 'edit',
            category: 'materials',
            notes: 'Requires object to be selected first'
        }
    },
    {
        id: 'editor-scene-hierarchy',
        description: 'View scene hierarchy/layers panel',
        page: 'scene-editor',
        selector: '.hierarchy-panel, .layers-panel, [data-testid="hierarchy"]',
        metadata: {
            action: 'view',
            category: 'navigation',
            notes: 'Shows all objects in scene as tree structure'
        }
    },
    {
        id: 'editor-export-menu',
        description: 'Open export menu to export scene or code',
        page: 'scene-editor',
        selector: 'button:has-text("Export"), [data-action="export"]',
        metadata: {
            action: 'click',
            category: 'export',
            notes: 'Exports to GLB, GLTF, code, etc.'
        }
    },
    {
        id: 'editor-animation-panel',
        description: 'Access animation timeline and settings',
        page: 'scene-editor',
        selector: '.animation-panel, [data-testid="timeline"]',
        metadata: {
            action: 'view',
            category: 'animation',
            notes: 'Create and edit animations'
        }
    },

    // LIBRARY PATTERNS
    {
        id: 'library-browse-materials',
        description: 'Browse available materials in library',
        page: 'library',
        selector: '.material-grid, [data-category="materials"]',
        metadata: {
            action: 'browse',
            category: 'materials',
            notes: 'Grid of material presets'
        }
    },
    {
        id: 'library-apply-material',
        description: 'Click material preset to apply or view details',
        page: 'library',
        selector: '.material-card, [data-type="material"]',
        metadata: {
            action: 'click',
            category: 'materials',
            notes: 'Shows material properties and preview'
        }
    },
    {
        id: 'library-search-materials',
        description: 'Search for specific material type (glass, metal, etc.)',
        page: 'library',
        selector: 'input[placeholder*="Search materials"]',
        metadata: {
            action: 'type',
            category: 'search',
            notes: 'Filter materials by keyword'
        }
    },

    // COMMUNITY PATTERNS
    {
        id: 'community-browse-projects',
        description: 'Browse community-created projects',
        page: 'community',
        selector: '.community-grid, [data-section="community"]',
        metadata: {
            action: 'browse',
            category: 'exploration',
            notes: 'Grid of featured community projects'
        }
    },
    {
        id: 'community-open-project',
        description: 'Open a community project to view or remix',
        page: 'community',
        selector: '.community-card, [data-type="community-project"]',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Opens project in editor or preview mode'
        }
    },
    {
        id: 'community-remix-project',
        description: 'Remix/duplicate a community project to your workspace',
        page: 'community',
        selector: 'button:has-text("Remix"), [data-action="remix"]',
        metadata: {
            action: 'click',
            category: 'creation',
            notes: 'Creates editable copy in your projects'
        }
    },

    // CROSS-PAGE PATTERNS
    {
        id: 'global-back-to-home',
        description: 'Navigate back to homepage',
        page: 'all',
        selector: '.logo, a[href="/home"], [data-nav="home"]',
        metadata: {
            action: 'click',
            category: 'navigation',
            notes: 'Usually clicking Spline logo in top-left'
        }
    },
    {
        id: 'global-user-menu',
        description: 'Open user account menu',
        page: 'all',
        selector: '.user-menu, [data-testid="user-menu"]',
        metadata: {
            action: 'click',
            category: 'account',
            notes: 'Access settings, logout, etc.'
        }
    },

    // WORKFLOW PATTERNS
    {
        id: 'workflow-copy-material-between-projects',
        description: 'Extract material from one project and apply to another - requires opening source project, inspecting object, saving material properties, navigating to target project, and applying',
        page: 'all',
        selector: 'multi-step-workflow',
        metadata: {
            action: 'workflow',
            category: 'materials',
            notes: 'Complex workflow requiring multiple page navigations and state management'
        }
    },
    {
        id: 'workflow-inspect-community-animation',
        description: 'Open community project to study animation settings - navigate to community, find project, open it, select animated object, view animation timeline',
        page: 'all',
        selector: 'multi-step-workflow',
        metadata: {
            action: 'workflow',
            category: 'animation',
            notes: 'Useful for learning from community examples'
        }
    }
];

// Example material presets (these would be extracted from actual projects)
const materialPresets = [
    {
        id: 'glass-blue-transparent',
        name: 'Glossy Blue Glass',
        description: 'Transparent blue glass material with high glossiness and refraction, perfect for modern UI elements and buttons',
        source: 'manual-seed',
        properties: {
            type: 'glass',
            color: '#4A90E2',
            transparency: 0.7,
            roughness: 0.1,
            metalness: 0,
            ior: 1.5,
            transmission: 0.9
        }
    },
    {
        id: 'metal-chrome',
        name: 'Chrome Metal',
        description: 'Highly reflective chrome metal material, great for futuristic and robotic elements',
        source: 'manual-seed',
        properties: {
            type: 'metal',
            color: '#CCCCCC',
            transparency: 0,
            roughness: 0.05,
            metalness: 1.0,
            clearcoat: 1.0
        }
    },
    {
        id: 'glass-frosted',
        name: 'Frosted Glass',
        description: 'Semi-transparent frosted glass with subtle blur effect, ideal for glassmorphism UI designs',
        source: 'manual-seed',
        properties: {
            type: 'glass',
            color: '#FFFFFF',
            transparency: 0.4,
            roughness: 0.3,
            metalness: 0,
            ior: 1.45,
            transmission: 0.7
        }
    }
];

module.exports = {
    uiPatterns,
    materialPresets
};
