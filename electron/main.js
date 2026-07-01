const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000;
const isDev = !app.isPackaged;

// Determine project root
const ROOT = isDev
  ? path.resolve(__dirname, '..')
  : path.resolve(process.resourcesPath);

function getPythonPath() {
  if (process.platform === 'win32') return 'C:\\Program Files\\Python314\\python.exe';
  return 'python3';
}

function getBackendDir() {
  return path.join(ROOT, 'backend');
}

function getFrontendDir() {
  return path.join(ROOT, 'frontend');
}

function waitForServer(url, maxRetries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      retries++;
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else if (retries < maxRetries) {
          setTimeout(check, interval);
        } else {
          reject(new Error(`Server at ${url} not ready after ${maxRetries} retries`));
        }
      }).on('error', () => {
        if (retries < maxRetries) {
          setTimeout(check, interval);
        } else {
          reject(new Error(`Server at ${url} not ready after ${maxRetries} retries`));
        }
      });
    };
    check();
  });
}

function startBackend() {
  const pythonPath = getPythonPath();
  const backendDir = getBackendDir();
  
  console.log(`[VEDA] Starting backend from: ${backendDir}`);
  console.log(`[VEDA] Python: ${pythonPath}`);

  backendProcess = spawn(pythonPath, [
    '-m', 'uvicorn', 'app.main:app',
    '--port', String(BACKEND_PORT),
    '--host', '127.0.0.1',
    '--log-level', 'info'
  ], {
    cwd: backendDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[VEDA] Backend exited with code ${code}`);
    backendProcess = null;
  });

  backendProcess.on('error', (err) => {
    console.error(`[VEDA] Failed to start backend: ${err.message}`);
  });
}

function startFrontend() {
  const frontendDir = getFrontendDir();
  
  console.log(`[VEDA] Starting frontend from: ${frontendDir}`);

  if (isDev) {
    frontendProcess = spawn('npx', [
      'next', 'dev',
      '--port', String(FRONTEND_PORT)
    ], {
      cwd: frontendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, NEXT_PUBLIC_API_URL: `http://127.0.0.1:${BACKEND_PORT}/api/v1` }
    });
  } else {
    frontendProcess = spawn('npx', [
      'next', 'start',
      '--port', String(FRONTEND_PORT)
    ], {
      cwd: frontendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, NEXT_PUBLIC_API_URL: `http://127.0.0.1:${BACKEND_PORT}/api/v1` }
    });
  }

  frontendProcess.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });

  frontendProcess.on('close', (code) => {
    console.log(`[VEDA] Frontend exited with code ${code}`);
    frontendProcess = null;
  });

  frontendProcess.on('error', (err) => {
    console.error(`[VEDA] Failed to start frontend: ${err.message}`);
  });
}

function killProcesses() {
  if (backendProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[VEDA] Error killing backend:', e.message);
    }
    backendProcess = null;
  }

  if (frontendProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(frontendProcess.pid), '/f', '/t']);
      } else {
        frontendProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[VEDA] Error killing frontend:', e.message);
    }
    frontendProcess = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'VEDA - AI Scientist Platform',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#0f0f1a'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Custom menu
  const menuTemplate = [
    {
      label: 'VEDA',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.executeJavaScript('window.location.href = "/assistant"') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About VEDA',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About VEDA',
              message: 'VEDA - AI Scientist Platform',
              detail: 'Virtual Engine for Discovery & Analysis\nVersion 1.0.0\n\nTransforming Knowledge into Discovery.\n\nFree AI APIs: Gemini, Groq, OpenRouter, DeepSeek'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/veda-ai/veda')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load the app
  mainWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}`);

  // DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

async function tryConnect(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => { res.resume(); resolve(true); });
    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => { req.destroy(); resolve(false); });
  });
}

app.whenReady().then(async () => {
  console.log('[VEDA] Starting VEDA Desktop...');

  const backendRunning = await tryConnect(`http://127.0.0.1:${BACKEND_PORT}/api/v1/health`);

  if (backendRunning) {
    console.log('[VEDA] Backend already running');
  } else {
    startBackend();
    try {
      console.log('[VEDA] Waiting for backend...');
      await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/v1/health`, 60, 1000);
      console.log('[VEDA] Backend is ready');
    } catch (err) {
      console.error(`[VEDA] Backend failed to start: ${err.message}`);
      dialog.showErrorBox('Startup Error', `Backend failed to start.\n\n${err.message}\n\nMake sure Python and dependencies are installed.`);
      app.quit();
      return;
    }
  }

  const frontendRunning = await tryConnect(`http://127.0.0.1:${FRONTEND_PORT}`);

  if (frontendRunning) {
    console.log('[VEDA] Frontend already running');
  } else {
    startFrontend();
    try {
      console.log('[VEDA] Waiting for frontend...');
      await waitForServer(`http://127.0.0.1:${FRONTEND_PORT}`, 90, 1500);
      console.log('[VEDA] Frontend is ready');
    } catch (err) {
      console.error(`[VEDA] Frontend failed to start: ${err.message}`);
      dialog.showErrorBox('Startup Error', `Frontend failed to start.\n\n${err.message}`);
      app.quit();
      return;
    }
  }

  await createWindow();
  console.log('[VEDA] VEDA Desktop is running');
});

app.on('window-all-closed', () => {
  killProcesses();
  app.quit();
});

app.on('before-quit', () => {
  killProcesses();
});

app.on('will-quit', () => {
  killProcesses();
});
