require('dotenv').config({ silent: true });
const axios = require('axios');

/**
 * sim.ai Integration Module
 * Provides integration with sim.ai workflow platform
 */
class SimAIIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.SIMAI_API_KEY;
    this.baseUrl = 'https://api.sim.ai/api/v1';
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Push workflow to sim.ai
   * Note: This is a conceptual implementation
   * Actual sim.ai API may require different format
   */
  async pushWorkflow(workflow) {
    if (!this.apiKey) {
      throw new Error('sim.ai API key not configured');
    }

    try {
      // Convert workflow to sim.ai format
      const simaiFormat = this.convertToSimAIFormat(workflow);

      console.log('📤 Pushing workflow to sim.ai...');
      console.log(`   Name: ${workflow.name}`);
      console.log(`   Nodes: ${workflow.nodes.length}`);
      console.log(`   Connections: ${workflow.connections.length}`);

      // Note: Actual endpoint would be something like /workflows
      // This is a placeholder as the exact endpoint structure isn't documented
      const response = await axios.post(
        `${this.baseUrl}/workflows`,
        simaiFormat,
        { headers: this.getHeaders() }
      );

      console.log('✅ Workflow pushed successfully!');
      console.log(`   Workflow ID: ${response.data.id || 'N/A'}`);

      return {
        success: true,
        workflowId: response.data.id,
        url: response.data.url
      };
    } catch (error) {
      console.error('❌ Failed to push workflow:', error.message);

      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Response:', error.response.data);
      }

      throw error;
    }
  }

  /**
   * Get workflow execution logs from sim.ai
   */
  async getExecutionLogs(options = {}) {
    if (!this.apiKey) {
      throw new Error('sim.ai API key not configured');
    }

    try {
      const params = {
        limit: options.limit || 10,
        ...options
      };

      const response = await axios.get(
        `${this.baseUrl}/logs`,
        {
          headers: this.getHeaders(),
          params
        }
      );

      return {
        success: true,
        logs: response.data.logs || []
      };
    } catch (error) {
      console.error('❌ Failed to get execution logs:', error.message);
      throw error;
    }
  }

  /**
   * Get specific execution details
   */
  async getExecutionDetails(executionId) {
    if (!this.apiKey) {
      throw new Error('sim.ai API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/logs/executions/${executionId}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        execution: response.data
      };
    } catch (error) {
      console.error('❌ Failed to get execution details:', error.message);
      throw error;
    }
  }

  /**
   * Execute workflow on sim.ai
   * Requires workflow to be already deployed
   */
  async executeWorkflow(workflowId, inputs = {}) {
    if (!this.apiKey) {
      throw new Error('sim.ai API key not configured');
    }

    try {
      console.log(`🚀 Executing workflow: ${workflowId}`);

      // Note: Actual execution endpoint would depend on workflow trigger type
      // This is a conceptual implementation
      const response = await axios.post(
        `${this.baseUrl}/workflows/${workflowId}/execute`,
        { inputs },
        { headers: this.getHeaders() }
      );

      console.log('✅ Workflow execution started!');
      console.log(`   Execution ID: ${response.data.executionId || 'N/A'}`);

      return {
        success: true,
        executionId: response.data.executionId,
        status: response.data.status
      };
    } catch (error) {
      console.error('❌ Failed to execute workflow:', error.message);
      throw error;
    }
  }

  /**
   * Convert local workflow format to sim.ai format
   */
  convertToSimAIFormat(workflow) {
    return {
      name: workflow.name,
      description: workflow.description || '',
      version: workflow.version || '1.0',
      blocks: workflow.nodes.map(node => ({
        id: node.id,
        type: this.mapNodeTypeToSimAI(node.type),
        config: this.convertNodeConfig(node),
        position: {
          x: node.x || 0,
          y: node.y || 0
        }
      })),
      connections: workflow.connections.map(conn => ({
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
        source: 'spline-cli-editor',
        tags: ['spline', 'automation']
      }
    };
  }

  /**
   * Map local node types to sim.ai block types
   */
  mapNodeTypeToSimAI(nodeType) {
    const mapping = {
      'login': 'custom',
      'fetch-projects': 'custom',
      'select-project': 'custom',
      'export-url': 'custom',
      'load-scene': 'custom',
      'set-property': 'custom',
      'save-preset': 'custom',
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

  /**
   * Convert node configuration to sim.ai format
   */
  convertNodeConfig(node) {
    const config = { ...node.inputs };

    // Add node-specific transformations
    switch (node.type) {
      case 'ai-prompt':
        return {
          prompt: config.prompt || '',
          model: config.model || 'gpt-4',
          temperature: config.temperature || 0.7
        };

      case 'http-request':
        return {
          url: config.url || '',
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body || {}
        };

      case 'condition':
        return {
          condition: config.condition || '',
          truthyPath: 'next',
          falsyPath: 'end'
        };

      default:
        return config;
    }
  }

  /**
   * Import workflow from sim.ai
   * Note: Would require list/get workflow endpoints
   */
  async importWorkflow(workflowId) {
    if (!this.apiKey) {
      throw new Error('sim.ai API key not configured');
    }

    try {
      console.log(`📥 Importing workflow from sim.ai: ${workflowId}`);

      const response = await axios.get(
        `${this.baseUrl}/workflows/${workflowId}`,
        { headers: this.getHeaders() }
      );

      const simaiWorkflow = response.data;

      // Convert back to local format
      const localWorkflow = {
        name: simaiWorkflow.name,
        description: simaiWorkflow.description,
        nodes: simaiWorkflow.blocks.map(block => ({
          id: block.id,
          type: this.mapSimAITypeToLocal(block.type),
          title: block.config.title || block.type,
          x: block.position?.x || 0,
          y: block.position?.y || 0,
          inputs: block.config
        })),
        connections: simaiWorkflow.connections.map(conn => ({
          from: conn.source,
          to: conn.target
        })),
        version: simaiWorkflow.version
      };

      console.log('✅ Workflow imported successfully!');

      return {
        success: true,
        workflow: localWorkflow
      };
    } catch (error) {
      console.error('❌ Failed to import workflow:', error.message);
      throw error;
    }
  }

  /**
   * Map sim.ai block types back to local node types
   */
  mapSimAITypeToLocal(blockType) {
    const mapping = {
      'llm': 'ai-prompt',
      'api': 'http-request',
      'router': 'condition',
      'loop': 'loop',
      'delay': 'wait',
      'output': 'log',
      'function': 'transform-data',
      'custom': 'custom'
    };

    return mapping[blockType] || 'custom';
  }

  /**
   * Validate API key
   */
  async validateApiKey() {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      // Try to get logs to validate the key
      await axios.get(
        `${this.baseUrl}/logs`,
        {
          headers: this.getHeaders(),
          params: { limit: 1 }
        }
      );

      return { valid: true };
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: false, error: error.message };
    }
  }
}

module.exports = { SimAIIntegration };
