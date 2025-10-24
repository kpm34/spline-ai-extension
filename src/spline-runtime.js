require('dotenv').config({ silent: true });
const { Application } = require('@splinetool/runtime');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * SplineRuntime - Real Spline API Integration
 *
 * Uses @splinetool/runtime for actual scene manipulation
 * (not simulated API calls)
 */
class SplineRuntime {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.loaded = false;
    this.currentSceneUrl = null;
    this.presetPath = path.join(os.homedir(), '.spline-cli', 'presets');

    // Ensure preset directory exists
    fs.ensureDirSync(this.presetPath);
  }

  /**
   * Initialize the Spline application with a canvas element
   * This is required before loading scenes
   */
  async initialize(canvasElement) {
    if (this.app) {
      console.warn('⚠️ Runtime already initialized');
      return;
    }

    this.canvas = canvasElement;
    this.app = new Application(this.canvas);
    console.log('✅ Spline runtime initialized');
  }

  /**
   * Load a Spline scene from a .splinecode URL
   */
  async load(sceneUrl) {
    if (!this.app) {
      throw new Error('Runtime not initialized. Call initialize() first.');
    }

    try {
      console.log(`📥 Loading scene: ${sceneUrl}`);
      await this.app.load(sceneUrl);
      this.loaded = true;
      this.currentSceneUrl = sceneUrl;
      console.log('✅ Scene loaded successfully');
      return { success: true, url: sceneUrl };
    } catch (error) {
      console.error('❌ Failed to load scene:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find an object in the scene by name
   */
  findObject(name) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    const object = this.app.findObjectByName(name);
    if (!object) {
      throw new Error(`Object "${name}" not found in scene`);
    }

    return object;
  }

  /**
   * Get object property value
   */
  getObjectProperty(objectName, property) {
    const obj = this.findObject(objectName);

    switch (property.toLowerCase()) {
      case 'position':
        return {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z
        };
      case 'rotation':
        return {
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z
        };
      case 'scale':
        return {
          x: obj.scale.x,
          y: obj.scale.y,
          z: obj.scale.z
        };
      case 'visible':
        return obj.visible;
      default:
        throw new Error(`Unknown property: ${property}`);
    }
  }

  /**
   * Set object property value
   */
  setObjectProperty(objectName, property, value) {
    const obj = this.findObject(objectName);

    switch (property.toLowerCase()) {
      case 'position':
        if (typeof value === 'object') {
          obj.position.set(value.x || 0, value.y || 0, value.z || 0);
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.position.set(x || 0, y || 0, z || 0);
        }
        break;

      case 'rotation':
        if (typeof value === 'object') {
          obj.rotation.set(value.x || 0, value.y || 0, value.z || 0);
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.rotation.set(x || 0, y || 0, z || 0);
        }
        break;

      case 'scale':
        if (typeof value === 'object') {
          obj.scale.set(value.x || 1, value.y || 1, value.z || 1);
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.scale.set(x || 1, y || 1, z || 1);
        } else if (typeof value === 'number') {
          obj.scale.set(value, value, value);
        }
        break;

      case 'visible':
        obj.visible = Boolean(value);
        break;

      default:
        throw new Error(`Cannot set property: ${property}`);
    }

    return { success: true, object: objectName, property, value };
  }

  /**
   * Get Spline variable value
   */
  getVariable(name) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    return this.app.getVariable(name);
  }

  /**
   * Set Spline variable value
   */
  setVariable(name, value) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    this.app.setVariable(name, value);
    return { success: true, variable: name, value };
  }

  /**
   * Emit a Spline event
   */
  emitEvent(eventName, data = {}) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    this.app.emitEvent(eventName, data);
    return { success: true, event: eventName, data };
  }

  /**
   * Add event listener
   */
  addEventListener(eventName, callback) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    this.app.addEventListener(eventName, callback);
    return { success: true, event: eventName };
  }

  /**
   * Get all objects in the scene (approximation)
   * Note: Spline doesn't provide direct API for this, so we try common patterns
   */
  getAllObjects() {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    // This is a limitation - Spline API doesn't provide scene graph traversal
    // We can only find objects by name if we know their names
    console.warn('⚠️ getAllObjects() is limited - Spline API doesn\'t provide scene traversal');
    return [];
  }

  /**
   * Capture current scene state (for presets)
   */
  captureState(objectNames = []) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    const state = {
      url: this.currentSceneUrl,
      timestamp: new Date().toISOString(),
      objects: {},
      variables: {}
    };

    // Capture specified objects
    for (const name of objectNames) {
      try {
        const obj = this.findObject(name);
        state.objects[name] = {
          position: { ...obj.position },
          rotation: { ...obj.rotation },
          scale: { ...obj.scale },
          visible: obj.visible
        };
      } catch (error) {
        console.warn(`⚠️ Could not capture object "${name}": ${error.message}`);
      }
    }

    return state;
  }

  /**
   * Apply a preset state to the scene
   */
  applyState(state) {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    const results = {
      success: true,
      applied: [],
      failed: []
    };

    // Apply object states
    for (const [name, props] of Object.entries(state.objects || {})) {
      try {
        const obj = this.findObject(name);
        if (props.position) obj.position.set(props.position.x, props.position.y, props.position.z);
        if (props.rotation) obj.rotation.set(props.rotation.x, props.rotation.y, props.rotation.z);
        if (props.scale) obj.scale.set(props.scale.x, props.scale.y, props.scale.z);
        if (typeof props.visible !== 'undefined') obj.visible = props.visible;
        results.applied.push(name);
      } catch (error) {
        results.failed.push({ object: name, error: error.message });
      }
    }

    // Apply variables
    for (const [name, value] of Object.entries(state.variables || {})) {
      try {
        this.app.setVariable(name, value);
        results.applied.push(`var:${name}`);
      } catch (error) {
        results.failed.push({ variable: name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Save a preset
   */
  async savePreset(name, objectNames = []) {
    const state = this.captureState(objectNames);
    const filePath = path.join(this.presetPath, `${name}.json`);

    await fs.writeJson(filePath, state, { spaces: 2 });

    return {
      success: true,
      preset: name,
      path: filePath,
      objects: Object.keys(state.objects).length
    };
  }

  /**
   * Load a preset
   */
  async loadPreset(name) {
    const filePath = path.join(this.presetPath, `${name}.json`);

    if (!await fs.pathExists(filePath)) {
      throw new Error(`Preset "${name}" not found`);
    }

    const state = await fs.readJson(filePath);
    const results = this.applyState(state);

    return {
      success: true,
      preset: name,
      ...results
    };
  }

  /**
   * List all presets
   */
  async listPresets() {
    const files = await fs.readdir(this.presetPath);
    const presets = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));

    const details = await Promise.all(
      presets.map(async (name) => {
        const filePath = path.join(this.presetPath, `${name}.json`);
        const state = await fs.readJson(filePath);
        return {
          name,
          objects: Object.keys(state.objects || {}).length,
          variables: Object.keys(state.variables || {}).length,
          timestamp: state.timestamp
        };
      })
    );

    return details;
  }

  /**
   * Delete a preset
   */
  async deletePreset(name) {
    const filePath = path.join(this.presetPath, `${name}.json`);
    await fs.remove(filePath);
    return { success: true, preset: name };
  }

  /**
   * Get runtime info
   */
  getInfo() {
    return {
      initialized: this.app !== null,
      loaded: this.loaded,
      sceneUrl: this.currentSceneUrl,
      hasCanvas: this.canvas !== null
    };
  }
}

module.exports = { SplineRuntime };
