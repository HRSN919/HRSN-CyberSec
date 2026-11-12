const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_PORT = 32187;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;

function writeLog(message) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'startup.log'), `[${new Date().toISOString()}] ${message}\n`);
  } catch (error) {
    console.error('Could not write startup log:', error);
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The local Express server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('HRSN CyberSec local service did not start in time.');
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    writeLog(`Renderer load failed: ${code} ${description} (${url})`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeLog(`Renderer process exited: ${JSON.stringify(details)}`);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadURL(APP_URL);
}

app.whenReady().then(async () => {
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(APP_PORT);
  process.env.HRSN_DATA_DIR = path.join(app.getPath('userData'), 'data');
  // app.getAppPath() points inside app.asar; do not use process.chdir() on it.
  process.env.HRSN_WEB_DIST_DIR = path.join(app.getAppPath(), 'dist');

  try {
    writeLog(`Starting local service from ${app.getAppPath()}`);
    require(path.join(app.getAppPath(), 'server/server.cjs'));
    await waitForServer(APP_URL);
    writeLog('Local service is ready.');
    await createWindow();
    writeLog('Main window created.');
  } catch (error) {
    const message = error && error.stack ? error.stack : String(error);
    writeLog(`Startup failed: ${message}`);
    console.error('Failed to start HRSN CyberSec:', error);
    dialog.showErrorBox('HRSN CyberSec - Startup Error', message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().catch((error) => {
    writeLog(`Window activation failed: ${error.stack || error}`);
    dialog.showErrorBox('HRSN CyberSec - Window Error', String(error));
  });
});
