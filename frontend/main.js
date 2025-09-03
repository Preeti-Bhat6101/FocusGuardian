const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess = null;
let counterWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
    title: "Focus Guardian"
  });
  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'build/index.html')}`;
  mainWindow.loadURL(startUrl);
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  mainWindow.on('closed', () => (mainWindow = null));
}

// THIS IS THE CORRECTED FUNCTION
function createCounterWindow() {
  if (counterWindow) return;
  counterWindow = new BrowserWindow({
    width: 220,
    height: 70,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    webPreferences: { preload: path.join(__dirname, 'counterPreload.js') },
  });

  const counterUrl = isDev
    ? 'http://localhost:3000/counter.html'
    : `file://${path.join(__dirname, 'build/counter.html')}`;

  counterWindow.loadURL(counterUrl);

  if (isDev) {
    counterWindow.webContents.openDevTools({ mode: 'detach' });
  }
  counterWindow.on('closed', () => (counterWindow = null));
}

ipcMain.on('start-local-engine', (event, { sessionId, token }) => {
  if (pythonProcess) pythonProcess.kill();
  const pythonScriptPath = path.join(__dirname, '..', 'Backend', 'run_local_analysis.py');
  const pythonExecutable = path.join(__dirname, '..', 'Backend', 'venv_prod', 'Scripts', 'python.exe');
  pythonProcess = spawn(pythonExecutable, [pythonScriptPath, '--session', sessionId, '--token', token]);
  let isEngineReady = false;

  pythonProcess.stdout.on('data', (data) => {
    const line = data.toString();
    if (!isEngineReady && line.includes('PYTHON_ENGINE_READY')) {
      isEngineReady = true;
      console.log('[Main Process] Engine ready. Creating counter.');
      createCounterWindow();
      if (mainWindow) mainWindow.webContents.send('engine-ready');
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const line = data.toString();
    if (!isEngineReady && line.includes('PYTHON_ENGINE_FAILED')) {
      isEngineReady = true;
      if(mainWindow) mainWindow.webContents.send('engine-failed');
    }
  });

  pythonProcess.on('close', () => {
    pythonProcess = null;
    if (counterWindow) counterWindow.close();
    if(mainWindow) mainWindow.webContents.send('engine-stopped');
  });
});

ipcMain.on('stop-local-engine', () => {
  console.log('[Main Process] Stop signal received.');
  if (counterWindow) counterWindow.close();
  if (pythonProcess && !pythonProcess.killed) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
    } else {
      pythonProcess.kill('SIGKILL');
    }
    pythonProcess = null;
  }
});

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() });
app.on('activate', () => { if (mainWindow === null) createWindow() });
app.on('will-quit', () => { if (pythonProcess) pythonProcess.kill() });