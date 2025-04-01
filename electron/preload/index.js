/**
 * Preload script for Ocularum
 * 
 * This script exposes a limited set of Electron APIs to the renderer process
 * in a secure way using contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');
const { v4: uuidv4 } = require('uuid');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Send command to Python backend
  invoke: async (command, params) => {
    return ipcRenderer.invoke('python-command', command, params);
  },
  
  // Register notification listener
  onNotification: (type, callback) => {
    const listenerId = uuidv4();
    
    // Register with main process
    ipcRenderer.invoke('register-notification', type, listenerId);
    
    // Set up event listener
    const listener = (event, data) => {
      callback(data);
    };
    
    // Add event listener
    ipcRenderer.on(`notification-${type}-${listenerId}`, listener);
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(`notification-${type}-${listenerId}`, listener);
      ipcRenderer.invoke('unregister-notification', type, listenerId);
    };
  },
  
  // App utilities
  app: {
    // Open external URL
    openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
    
    // Install update
    installUpdate: () => ipcRenderer.invoke('app:install-update')
  },
  
  // Update events
  onUpdateAvailable: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  
  onUpdateDownloaded: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  }
}); 