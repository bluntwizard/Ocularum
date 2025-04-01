/**
 * Main process entry point for Ocularum
 * 
 * This file sets up the Electron app and creates the main window.
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const pythonBridge = require('./python-bridge');

// Set up logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Global references to prevent garbage collection
let mainWindow = null;
let tray = null;
let forceQuit = false;

// App configuration
const appConfig = {
  minWidth: 800,
  minHeight: 600,
  width: 1280,
  height: 720,
  icon: path.join(__dirname, '../../resources/icons/icon.png')
};

// Initialize Electron
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: appConfig.width,
    height: appConfig.height,
    minWidth: appConfig.minWidth,
    minHeight: appConfig.minHeight,
    icon: appConfig.icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../../build/index.html'),
        protocol: 'file:',
        slashes: true
      });

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!forceQuit) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create tray icon
  createTray();

  // Initialize Python bridge
  initPythonBridge();
}

// Create system tray icon
function createTray() {
  tray = new Tray(appConfig.icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Ocularum', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Check for Updates', click: () => autoUpdater.checkForUpdatesAndNotify() },
    { type: 'separator' },
    { label: 'Quit', click: () => {
        forceQuit = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Ocularum');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// Initialize Python bridge
async function initPythonBridge() {
  try {
    // Initialize Python bridge with client credentials
    // In a real app, these would be securely stored and retrieved
    const initialized = await pythonBridge.initialize({
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      debug: isDev
    });
    
    if (initialized) {
      log.info('Python bridge initialized successfully');
    } else {
      log.error('Failed to initialize Python bridge');
    }
  } catch (error) {
    log.error('Error initializing Python bridge:', error);
  }
}

// App ready event
app.on('ready', () => {
  createWindow();
  
  // Check for updates
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Activate event (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// All windows closed event
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// App will quit event
app.on('will-quit', async () => {
  // Shut down Python bridge
  pythonBridge.shutdown();
});

// Register IPC handlers
ipcMain.handle('app:open-external', (event, url) => {
  shell.openExternal(url);
  return true;
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

// Install the update
ipcMain.handle('app:install-update', () => {
  autoUpdater.quitAndInstall();
  return true;
}); 