/**
 * Python Bridge module for Ocularum
 * 
 * This module provides a bridge between Electron and the Python backend.
 * It handles spawning the Python process, sending commands, and receiving responses.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { app, ipcMain } = require('electron');
const log = require('electron-log');

// Set up logger
log.transports.file.level = 'info';

class PythonBridge {
  constructor() {
    this.pythonProcess = null;
    this.callbacks = new Map();
    this.notificationListeners = new Map();
    this.pendingData = '';
    this.isInitialized = false;
    this.pythonPath = '';
    this.scriptPath = '';
    this.findPythonPaths();
  }

  /**
   * Find paths to Python and the backend script
   * Looks for Python in common locations and the script in the app's resources
   */
  findPythonPaths() {
    // In development mode, use the Python from the project directory
    if (process.env.NODE_ENV === 'development') {
      this.pythonPath = 'python3';
      this.scriptPath = path.join(app.getAppPath(), 'python', 'main.py');
      return;
    }

    // In production, look for Python in the packaged app resources
    const resourcesPath = process.resourcesPath || app.getAppPath();
    
    // Platform-specific paths
    if (process.platform === 'win32') {
      this.pythonPath = path.join(resourcesPath, 'python', 'python.exe');
      this.scriptPath = path.join(resourcesPath, 'python', 'main.py');
    } else if (process.platform === 'darwin') {
      this.pythonPath = path.join(resourcesPath, 'python', 'bin', 'python3');
      this.scriptPath = path.join(resourcesPath, 'python', 'main.py');
    } else {
      // Linux
      this.pythonPath = path.join(resourcesPath, 'python', 'bin', 'python3');
      this.scriptPath = path.join(resourcesPath, 'python', 'main.py');
    }

    // Fallback to system Python if packaged version not found
    if (!fs.existsSync(this.pythonPath)) {
      log.info('Packaged Python not found, falling back to system Python');
      this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    }
  }

  /**
   * Initialize the Python backend
   * @param {Object} options - Options for initialization
   * @param {string} options.clientId - Twitch client ID
   * @param {string} options.clientSecret - Twitch client secret
   * @param {boolean} options.debug - Enable debug logging
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      log.info('Python bridge already initialized');
      return true;
    }

    try {
      log.info(`Starting Python backend: ${this.pythonPath} ${this.scriptPath}`);
      
      // Spawn the Python process
      const args = [this.scriptPath];
      
      if (options.clientId) {
        args.push('--client-id', options.clientId);
      }
      
      if (options.clientSecret) {
        args.push('--client-secret', options.clientSecret);
      }
      
      if (options.debug) {
        args.push('--debug');
      }

      this.pythonProcess = spawn(this.pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle Python process events
      this.pythonProcess.on('error', (err) => {
        log.error(`Python process error: ${err.message}`);
        this.isInitialized = false;
      });

      this.pythonProcess.on('exit', (code) => {
        log.info(`Python process exited with code ${code}`);
        this.isInitialized = false;
        this.pythonProcess = null;
      });

      // Handle output from the Python process
      this.pythonProcess.stdout.on('data', (data) => {
        const strData = data.toString();
        this._processOutput(strData);
      });

      this.pythonProcess.stderr.on('data', (data) => {
        log.error(`Python error: ${data.toString()}`);
      });

      // Register IPC handlers
      this._registerIpcHandlers();
      
      // Initialize the Python backend
      const initResult = await this.sendCommand('initialize', {
        client_id: options.clientId,
        client_secret: options.clientSecret,
      });

      this.isInitialized = initResult;
      return initResult;

    } catch (error) {
      log.error(`Failed to initialize Python bridge: ${error.message}`);
      return false;
    }
  }

  /**
   * Process output from the Python process
   * Handles JSON responses and notifications
   * @param {string} data - Data from Python process
   */
  _processOutput(data) {
    // Append to any pending data
    this.pendingData += data;

    // Process complete JSON objects
    let startIdx = 0;
    let endIdx = 0;
    
    try {
      while ((endIdx = this.pendingData.indexOf('\n', startIdx)) !== -1) {
        const line = this.pendingData.substring(startIdx, endIdx).trim();
        startIdx = endIdx + 1;

        if (!line) continue;

        try {
          const jsonData = JSON.parse(line);

          // Handle notifications
          if (jsonData.notification) {
            this._handleNotification(jsonData.notification);
            continue;
          }

          // Handle command responses
          if (jsonData.id && this.callbacks.has(jsonData.id)) {
            const { resolve, reject } = this.callbacks.get(jsonData.id);
            this.callbacks.delete(jsonData.id);

            if (jsonData.success) {
              resolve(jsonData);
            } else {
              reject(new Error(jsonData.error || 'Unknown error'));
            }
          }
        } catch (e) {
          log.error(`Error parsing JSON from Python: ${e.message}`);
          log.error(`Problem data: ${line}`);
        }
      }

      // Keep any remaining incomplete data
      if (startIdx < this.pendingData.length) {
        this.pendingData = this.pendingData.substring(startIdx);
      } else {
        this.pendingData = '';
      }
    } catch (error) {
      log.error(`Error processing Python output: ${error.message}`);
      this.pendingData = '';
    }
  }

  /**
   * Handle notification from Python backend
   * @param {Object} notification - Notification object
   */
  _handleNotification(notification) {
    const { type, data } = notification;
    log.info(`Received notification: ${type}`);

    // Forward to renderer process
    if (type) {
      const listeners = this.notificationListeners.get(type) || [];
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          log.error(`Error in notification listener: ${error.message}`);
        }
      });
    }
  }

  /**
   * Register IPC handlers for communication with renderer process
   */
  _registerIpcHandlers() {
    // Generic command handler
    ipcMain.handle('python-command', async (event, command, params) => {
      return this.sendCommand(command, params);
    });

    // Register notification listener
    ipcMain.handle('register-notification', (event, type, listenerId) => {
      const forwardToRenderer = (data) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(`notification-${type}-${listenerId}`, data);
        }
      };

      if (!this.notificationListeners.has(type)) {
        this.notificationListeners.set(type, []);
      }
      this.notificationListeners.get(type).push(forwardToRenderer);

      return true;
    });

    // Unregister notification listener
    ipcMain.handle('unregister-notification', (event, type, listenerId) => {
      // Nothing to do for now since we can't easily remove specific forwarding functions
      // In a real implementation, we'd track the listeners by ID
      return true;
    });
  }

  /**
   * Send a command to the Python backend
   * @param {string} type - Command type
   * @param {Object} params - Command parameters
   * @returns {Promise<Object>} - Command result
   */
  sendCommand(type, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess || this.pythonProcess.killed) {
        reject(new Error('Python process not running'));
        return;
      }

      const commandId = uuidv4();
      this.callbacks.set(commandId, { resolve, reject });

      const command = {
        id: commandId,
        type,
        params,
      };

      try {
        this.pythonProcess.stdin.write(JSON.stringify(command) + '\n');
      } catch (error) {
        this.callbacks.delete(commandId);
        reject(new Error(`Failed to send command: ${error.message}`));
      }
    });
  }

  /**
   * Register a notification listener
   * @param {string} type - Notification type
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to unregister the listener
   */
  onNotification(type, callback) {
    if (!this.notificationListeners.has(type)) {
      this.notificationListeners.set(type, []);
    }
    this.notificationListeners.get(type).push(callback);

    // Return a function to unregister the listener
    return () => {
      const listeners = this.notificationListeners.get(type) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Authenticate with Twitch
   * @param {Array<string>} scopes - Authorization scopes
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(scopes = []) {
    return this.sendCommand('authenticate', { scopes });
  }

  /**
   * Get user information
   * @param {Object} params - Parameters
   * @param {string} params.username - Twitch username
   * @param {string} params.userId - Twitch user ID
   * @returns {Promise<Object>} - User information
   */
  async getUserInfo({ username, userId }) {
    return this.sendCommand('get_user_info', {
      username,
      user_id: userId,
    });
  }

  /**
   * Get followed channels
   * @param {string} userId - Twitch user ID
   * @returns {Promise<Object>} - Followed channels
   */
  async getFollowedChannels(userId) {
    return this.sendCommand('get_followed_channels', { user_id: userId });
  }

  /**
   * Get live streams
   * @param {Array<string>} userIds - Twitch user IDs
   * @returns {Promise<Object>} - Live streams
   */
  async getLiveStreams(userIds) {
    return this.sendCommand('get_live_streams', { user_ids: userIds });
  }

  /**
   * Start a stream
   * @param {Object} params - Parameters
   * @param {string} params.channel - Twitch channel
   * @param {string} params.quality - Stream quality
   * @param {string} params.player - External player
   * @returns {Promise<Object>} - Stream result
   */
  async startStream({ channel, quality = 'best', player }) {
    return this.sendCommand('start_stream', { channel, quality, player });
  }

  /**
   * Stop a stream
   * @param {string} streamId - Stream ID
   * @returns {Promise<Object>} - Stop result
   */
  async stopStream(streamId) {
    return this.sendCommand('stop_stream', { stream_id: streamId });
  }

  /**
   * Get available stream qualities
   * @param {string} channel - Twitch channel
   * @returns {Promise<Object>} - Stream qualities
   */
  async getStreamQualities(channel) {
    return this.sendCommand('get_stream_qualities', { channel });
  }

  /**
   * Get active streams
   * @returns {Promise<Object>} - Active streams
   */
  async getActiveStreams() {
    return this.sendCommand('get_active_streams');
  }

  /**
   * Start the autotune manager
   * @returns {Promise<Object>} - Start result
   */
  async startAutotune() {
    return this.sendCommand('start_autotune');
  }

  /**
   * Stop the autotune manager
   * @returns {Promise<Object>} - Stop result
   */
  async stopAutotune() {
    return this.sendCommand('stop_autotune');
  }

  /**
   * Add a streamer to autotune
   * @param {string} username - Twitch username
   * @param {Object} settings - Streamer settings
   * @returns {Promise<Object>} - Add result
   */
  async addAutotunedStreamer(username, settings) {
    return this.sendCommand('add_autotuned_streamer', { username, settings });
  }

  /**
   * Remove a streamer from autotune
   * @param {string} username - Twitch username
   * @returns {Promise<Object>} - Remove result
   */
  async removeAutotunedStreamer(username) {
    return this.sendCommand('remove_autotuned_streamer', { username });
  }

  /**
   * Get autotuned streamers
   * @returns {Promise<Object>} - Autotuned streamers
   */
  async getAutotunedStreamers() {
    return this.sendCommand('get_autotuned_streamers');
  }

  /**
   * Check live status of autotuned streamers
   * @returns {Promise<Object>} - Live status
   */
  async checkLiveStatus() {
    return this.sendCommand('check_live_status');
  }

  /**
   * Shutdown the Python bridge
   */
  shutdown() {
    if (this.pythonProcess && !this.pythonProcess.killed) {
      log.info('Shutting down Python process');
      
      // Send SIGTERM signal
      this.pythonProcess.kill('SIGTERM');
      
      // Clear all callbacks with an error
      for (const [id, { reject }] of this.callbacks.entries()) {
        reject(new Error('Python bridge shutting down'));
        this.callbacks.delete(id);
      }
      
      this.isInitialized = false;
    }
  }
}

// Export a singleton instance
const pythonBridge = new PythonBridge();
module.exports = pythonBridge; 