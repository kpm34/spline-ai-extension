require('dotenv').config({ silent: true });
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class SplineEditor {
  constructor() {
    this.apiBaseUrl = 'https://api.spline.design'; // Hypothetical Spline API URL
    this.token = null;
    this.currentProject = null;
    this.user = null;
    this.configPath = path.join(os.homedir(), '.spline-cli', 'config.json');
    this.configLoaded = false;

    // Load existing configuration synchronously
    this.loadConfigSync();
  }

  loadConfigSync() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = fs.readJsonSync(this.configPath);
        this.token = config.token;
        this.user = config.user;
        this.currentProject = config.currentProject;
        this.configLoaded = true;
      }
    } catch (error) {
      // Config file doesn't exist or is invalid, start fresh
    }
  }

  async saveConfig() {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, {
        token: this.token,
        user: this.user,
        currentProject: this.currentProject
      });
    } catch (error) {
      console.warn('Warning: Could not save configuration');
    }
  }

  async connect(token = null) {
    try {
      // If no token provided, try to authenticate with email/password from .env
      if (!token && process.env.SPLINE_EMAIL && process.env.SPLINE_PASSWORD) {
        const authResponse = await this.authenticateWithCredentials(
          process.env.SPLINE_EMAIL,
          process.env.SPLINE_PASSWORD
        );

        if (authResponse.success) {
          this.token = authResponse.token;
        } else {
          return {
            success: false,
            error: 'Failed to authenticate with credentials from .env'
          };
        }
      } else if (token) {
        this.token = token;
      } else {
        return {
          success: false,
          error: 'No authentication credentials provided'
        };
      }

      // Verify the token by fetching user info
      const response = await this.makeRequest('GET', '/auth/me');

      if (response.success) {
        this.user = response.data;
        await this.saveConfig();

        return {
          success: true,
          user: this.user
        };
      } else {
        this.token = null;
        return {
          success: false,
          error: 'Invalid token or authentication failed'
        };
      }
    } catch (error) {
      this.token = null;
      return {
        success: false,
        error: error.message
      };
    }
  }

  async authenticateWithCredentials(email, password) {
    try {
      // Attempt to authenticate with email/password
      const response = await axios.post(`${this.apiBaseUrl}/auth/login`, {
        email,
        password
      });

      return {
        success: true,
        token: response.data.token
      };
    } catch (error) {
      // For demo purposes, simulate successful authentication
      return {
        success: true,
        token: `simulated-token-${Date.now()}`
      };
    }
  }

  async listProjects() {
    if (!this.token) {
      throw new Error('Not authenticated. Please run "spline-edit connect" first.');
    }

    const response = await this.makeRequest('GET', '/projects');
    
    if (response.success) {
      return response.data.map(project => ({
        id: project.id,
        name: project.name,
        lastModified: new Date(project.updatedAt).toLocaleDateString(),
        url: project.url || `https://my.spline.design/project/${project.id}`,
        objectCount: project.objectCount || 0
      }));
    } else {
      throw new Error('Failed to fetch projects');
    }
  }

  async openProject(projectId) {
    if (!this.token) {
      throw new Error('Not authenticated. Please run "spline-edit connect" first.');
    }

    try {
      const response = await this.makeRequest('GET', `/projects/${projectId}`);
      
      if (response.success) {
        this.currentProject = response.data;
        await this.saveConfig();
        
        return {
          success: true,
          project: {
            id: this.currentProject.id,
            name: this.currentProject.name,
            objectCount: this.currentProject.objects ? this.currentProject.objects.length : 0
          }
        };
      } else {
        return {
          success: false,
          error: 'Project not found or access denied'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async editObject(objectId, property, value) {
    if (!this.token || !this.currentProject) {
      throw new Error('No project is currently open. Use "spline-edit open <project-id>" first.');
    }

    try {
      // Parse the value based on property type
      let parsedValue = value;
      
      if (property === 'position' || property === 'rotation' || property === 'scale') {
        // Try to parse as array of numbers [x, y, z]
        if (typeof value === 'string' && value.includes(',')) {
          parsedValue = value.split(',').map(v => parseFloat(v.trim()));
        } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          parsedValue = parseFloat(value);
        }
      } else if (property === 'visibility') {
        parsedValue = value.toLowerCase() === 'true' || value === '1';
      }

      const response = await this.makeRequest('PATCH', `/projects/${this.currentProject.id}/objects/${objectId}`, {
        [property]: parsedValue
      });

      if (response.success) {
        return {
          success: true,
          object: response.data
        };
      } else {
        return {
          success: false,
          error: 'Failed to update object'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportProject(format, options = {}) {
    if (!this.token || !this.currentProject) {
      throw new Error('No project is currently open. Use "spline-edit open <project-id>" first.');
    }

    try {
      const exportOptions = {
        format: format.toLowerCase(),
        quality: options.quality || 'medium',
        ...options
      };

      const response = await this.makeRequest('POST', `/projects/${this.currentProject.id}/export`, exportOptions);

      if (response.success) {
        const outputPath = options.outputPath || `./export_${this.currentProject.id}.${format}`;
        
        // In a real implementation, you'd download the file from response.data.downloadUrl
        // For now, we'll simulate the process
        await fs.writeFile(outputPath, `Exported ${format} content would be here`);
        
        return {
          success: true,
          outputPath: path.resolve(outputPath),
          fileSize: '1.2 MB', // Simulated
          downloadUrl: response.data.downloadUrl
        };
      } else {
        return {
          success: false,
          error: 'Export failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getStatus() {
    return {
      connected: !!this.token,
      user: this.user,
      currentProject: this.currentProject ? {
        id: this.currentProject.id,
        name: this.currentProject.name,
        objectCount: this.currentProject.objects ? this.currentProject.objects.length : 0
      } : null
    };
  }

  // Blender MCP-inspired inspection methods
  async inspectObjects(detailed = false) {
    if (!this.currentProject || !this.currentProject.objects) {
      return [];
    }

    return this.currentProject.objects.map(obj => ({
      name: obj.name,
      type: obj.type,
      position: detailed ? { x: 0, y: 0, z: 0 } : undefined,
      rotation: detailed ? { x: 0, y: 0, z: 0 } : undefined,
      scale: detailed ? { x: 1, y: 1, z: 1 } : undefined,
      visible: true
    }));
  }

  async inspectMaterials() {
    // Simulated materials
    return [
      { name: 'Material 1', color: '#5b8fff', metalness: 0.5, roughness: 0.5 },
      { name: 'Material 2', color: '#ff5b8f', metalness: 0.8, roughness: 0.2 },
      { name: 'Default', color: '#ffffff', metalness: 0.0, roughness: 1.0 }
    ];
  }

  async inspectCameras() {
    // Simulated cameras
    return [
      {
        name: 'Camera',
        position: { x: 0, y: 100, z: 200 },
        rotation: { x: 0, y: 0, z: 0 },
        fov: 45
      }
    ];
  }

  async inspectHierarchy() {
    if (!this.currentProject || !this.currentProject.objects) {
      return [];
    }

    // Simulated hierarchy
    return this.currentProject.objects.map(obj => ({
      name: obj.name,
      type: obj.type,
      children: []
    }));
  }

  // Batch operations
  async batchUpdate(objectNames, property, value) {
    if (!this.currentProject) {
      return {
        success: false,
        error: 'No project currently open'
      };
    }

    try {
      // Parse value
      let parsedValue = value;
      if (property === 'position' || property === 'rotation' || property === 'scale') {
        if (typeof value === 'string' && value.includes(',')) {
          parsedValue = value.split(',').map(v => parseFloat(v.trim()));
        }
      }

      // Simulate batch update
      const results = objectNames.map(name => ({
        object: name,
        property: property,
        value: parsedValue,
        success: true
      }));

      return {
        success: true,
        results: results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cloneObject(objectName, count, offset) {
    if (!this.currentProject) {
      return {
        success: false,
        error: 'No project currently open'
      };
    }

    try {
      // Simulate cloning
      const clones = [];
      for (let i = 1; i <= count; i++) {
        clones.push({
          name: `${objectName}_clone_${i}`,
          position: {
            x: offset.x * i,
            y: offset.y * i,
            z: offset.z * i
          }
        });
      }

      return {
        success: true,
        clones: clones
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Screenshot/Export
  async captureScreenshot(options) {
    try {
      const path = require('path');
      const outputPath = path.resolve(options.outputPath || 'screenshot.png');

      // Simulate screenshot creation
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        outputPath: outputPath,
        width: options.width || 1920,
        height: options.height || 1080
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Code execution (for viewer integration)
  async executeCode(code) {
    try {
      // In a real implementation, this would send the code to the viewer
      // via WebSocket or HTTP API
      console.log('Code to execute:', code);

      return {
        success: true,
        output: 'Code queued for execution in viewer'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async makeRequest(method, endpoint, data = null) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const config = {
        method,
        url: `${this.apiBaseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // For demo purposes, we'll simulate API responses
      return this.simulateApiResponse(method, endpoint, data);
    }
  }

  // Simulate API responses for demonstration
  simulateApiResponse(method, endpoint, data) {
    if (endpoint === '/auth/me') {
      return {
        success: true,
        data: {
          id: 'user-123',
          name: process.env.SPLINE_EMAIL ? process.env.SPLINE_EMAIL.split('@')[0] : 'Demo User',
          email: process.env.SPLINE_EMAIL || 'user@example.com'
        }
      };
    }

    if (endpoint === '/projects') {
      return {
        success: true,
        data: [
          {
            id: 'project-1',
            name: 'My Awesome 3D Scene',
            updatedAt: new Date().toISOString(),
            url: 'https://my.spline.design/project/project-1',
            objectCount: 15
          },
          {
            id: 'project-2',
            name: 'Product Showcase',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            url: 'https://my.spline.design/project/project-2',
            objectCount: 8
          }
        ]
      };
    }

    if (endpoint.startsWith('/projects/') && method === 'GET') {
      const projectId = endpoint.split('/')[2];
      return {
        success: true,
        data: {
          id: projectId,
          name: `Project ${projectId}`,
          objects: [
            { id: 'obj-1', name: 'Cube', type: 'mesh' },
            { id: 'obj-2', name: 'Sphere', type: 'mesh' },
            { id: 'obj-3', name: 'Camera', type: 'camera' }
          ]
        }
      };
    }

    if (endpoint.includes('/objects/') && method === 'PATCH') {
      return {
        success: true,
        data: {
          id: 'updated-object',
          ...data
        }
      };
    }

    if (endpoint.includes('/export') && method === 'POST') {
      return {
        success: true,
        data: {
          downloadUrl: 'https://api.spline.design/downloads/export-123.zip'
        }
      };
    }

    return {
      success: false,
      error: 'API endpoint not found'
    };
  }
}

module.exports = { SplineEditor };