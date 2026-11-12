const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const APP_PORT = 32187;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;

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
  mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadURL(APP_URL);
}

app.whenReady().then(async () => {
  process.chdir(app.getAppPath());
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(APP_PORT);
  process.env.HRSN_DATA_DIR = path.join(app.getPath('userData'), 'data');

  try {
    require(path.join(app.getAppPath(), 'server/server.cjs'));
    await waitForServer(APP_URL);
    await createWindow();
  } catch (error) {
    console.error('Failed to start HRSN CyberSec:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(console.error);
});
