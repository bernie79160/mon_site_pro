const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const APP_URL = 'http://127.0.0.1:8080';
const API_HEALTH_URL = 'http://127.0.0.1:3001/health';
const FRONTEND_PORT = 8080;
const BACKEND_PORT = 3001;

let mainWindow = null;
let backendProcess = null;
let frontendServer = null;
let backendLogStream = null;
let frontendLogStream = null;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getRuntimeRootDir() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.join(__dirname, '..', '..');
}

function resolveSiteDir() {
  const rootDir = getRuntimeRootDir();
  const candidates = [
    path.join(rootDir, 'site'),
    rootDir
  ];

  return candidates.find((dirPath) => fs.existsSync(path.join(dirPath, 'index.html')));
}

function resolveBackendDir() {
  const rootDir = getRuntimeRootDir();
  const candidates = [
    path.join(rootDir, 'backend'),
    path.join(__dirname, '..', '..', 'backend')
  ];

  return candidates.find((dirPath) => fs.existsSync(path.join(dirPath, 'src', 'server.js')));
}

function ensureLogsDir() {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  return logsDir;
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    const done = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(750);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

function waitForHttp(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Service indisponible: ${url}`));
          return;
        }

        setTimeout(check, 1000);
      });

      request.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timeout d'attente: ${url}`));
          return;
        }

        setTimeout(check, 1000);
      });
    };

    check();
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(' ')}\n${stderr || stdout}`.trim()));
    });
  });
}

function runBundledNodeScript(scriptPath, scriptArgs = [], cwd) {
  return runCommand(
    process.execPath,
    [scriptPath, ...scriptArgs],
    {
      cwd,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1'
      }
    }
  );
}

async function ensureBackendEnv(backendDir) {
  const envPath = path.join(backendDir, '.env');
  const envExamplePath = path.join(backendDir, '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }
}

async function startPostgres(backendDir) {
  await runCommand('docker', ['info']);
  await runCommand('docker', ['compose', 'up', '-d', 'postgres'], { cwd: backendDir });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    try {
      await runCommand('docker', ['exec', 'mon_site_pro_postgres', 'pg_isready', '-U', 'postgres', '-d', 'mon_site_pro']);
      return;
    } catch (_error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('PostgreSQL ne répond pas après 30 secondes. Vérifiez Docker Desktop.');
}

async function prepareBackend(backendDir) {
  const prismaCli = path.join(backendDir, 'node_modules', 'prisma', 'build', 'index.js');
  const seedModules = path.join(backendDir, 'scripts', 'seed-modules.js');
  const seedQuestions = path.join(backendDir, 'scripts', 'seed-questions.js');
  const seedQuizs = path.join(backendDir, 'scripts', 'seed-quizs.js');

  if (!fs.existsSync(prismaCli)) {
    throw new Error('Le backend embarqué est incomplet: Prisma CLI introuvable.');
  }

  await runBundledNodeScript(prismaCli, ['generate'], backendDir);
  await runBundledNodeScript(prismaCli, ['migrate', 'deploy'], backendDir);
  await runBundledNodeScript(seedModules, [], backendDir);
  await runBundledNodeScript(seedQuestions, [], backendDir);
  await runBundledNodeScript(seedQuizs, [], backendDir);
}

async function startBackend(backendDir) {
  if (await isPortOpen(BACKEND_PORT)) {
    return;
  }

  const logsDir = ensureLogsDir();
  const backendLogPath = path.join(logsDir, 'desktop-backend.log');
  backendLogStream = fs.createWriteStream(backendLogPath, { flags: 'a' });

  backendProcess = spawn(process.execPath, [path.join(backendDir, 'src', 'server.js')], {
    cwd: backendDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1'
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (chunk) => backendLogStream.write(chunk));
  backendProcess.stderr.on('data', (chunk) => backendLogStream.write(chunk));
  backendProcess.on('exit', (code) => {
    if (backendLogStream) {
      backendLogStream.write(`\n[backend exit] code=${code}\n`);
    }
  });

  await waitForHttp(API_HEALTH_URL, 30000);
}

async function startFrontend(siteDir) {
  if (await isPortOpen(FRONTEND_PORT)) {
    return;
  }

  const logsDir = ensureLogsDir();
  const frontendLogPath = path.join(logsDir, 'desktop-frontend.log');
  frontendLogStream = fs.createWriteStream(frontendLogPath, { flags: 'a' });

  frontendServer = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const relativePath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
    const targetPath = path.normalize(path.join(siteDir, relativePath));

    if (!targetPath.startsWith(siteDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    let finalPath = targetPath;
    if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
      finalPath = path.join(finalPath, 'index.html');
    }

    fs.readFile(finalPath, (error, content) => {
      if (error) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        if (frontendLogStream) {
          frontendLogStream.write(`[404] ${finalPath}\n`);
        }
        return;
      }

      response.writeHead(200, { 'Content-Type': getMimeType(finalPath) });
      response.end(content);
    });
  });

  await new Promise((resolve, reject) => {
    frontendServer.once('error', reject);
    frontendServer.listen(FRONTEND_PORT, '0.0.0.0', resolve);
  });
}

function renderStatusPage(title, message) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; color: #1f2937; margin: 0; display: flex; min-height: 100vh; align-items: center; justify-content: center; }
      .box { width: min(680px, 92vw); background: white; border-radius: 18px; padding: 32px; box-shadow: 0 14px 40px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; color: #2c3e50; }
      p { line-height: 1.6; }
      .loader { width: 44px; height: 44px; border: 4px solid #dbeafe; border-top-color: #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 18px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="loader"></div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    </div>
  </body>
</html>`;
}

function renderErrorPage(details) {
  const logsDir = ensureLogsDir();
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Erreur de démarrage</title>
    <style>
      body { font-family: Arial, sans-serif; background: #fff7f7; color: #1f2937; margin: 0; padding: 24px; }
      .box { max-width: 900px; margin: 0 auto; background: white; border-radius: 18px; padding: 28px; box-shadow: 0 14px 40px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; color: #b91c1c; }
      pre { white-space: pre-wrap; background: #f8fafc; border-radius: 10px; padding: 14px; overflow: auto; }
      li { margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Impossible de démarrer le serveur central</h1>
      <p>L'application n'a pas réussi à lancer automatiquement le backend ou l'interface locale.</p>
      <ul>
        <li>Vérifiez que <strong>Docker Desktop</strong> est installé et démarré.</li>
        <li>Relancez ensuite l'application.</li>
        <li>Si le problème persiste, consultez les logs dans <code>${escapeHtml(logsDir)}</code>.</li>
      </ul>
      <h3>Détails techniques</h3>
      <pre>${escapeHtml(details)}</pre>
    </div>
  </body>
</html>`;
}

function updateWindowHtml(html) {
  if (!mainWindow) return;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:8080') || url.startsWith('http://localhost:8080')) {
      return { action: 'allow' };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function startEmbeddedCentralServer() {
  const siteDir = resolveSiteDir();
  const backendDir = resolveBackendDir();

  if (!siteDir) {
    throw new Error('Dossier site introuvable dans les ressources de l’application.');
  }

  if (!backendDir) {
    throw new Error('Dossier backend introuvable dans les ressources de l’application.');
  }

  updateWindowHtml(renderStatusPage('Démarrage en cours', 'Préparation du serveur central…'));
  await ensureBackendEnv(backendDir);

  updateWindowHtml(renderStatusPage('Base de données', 'Démarrage de PostgreSQL avec Docker…'));
  await startPostgres(backendDir);

  updateWindowHtml(renderStatusPage('Configuration', 'Préparation du backend et des données pédagogiques…'));
  await prepareBackend(backendDir);

  updateWindowHtml(renderStatusPage('API', 'Démarrage du backend pédagogique…'));
  await startBackend(backendDir);

  updateWindowHtml(renderStatusPage('Interface', 'Ouverture du site formateur et élève…'));
  await startFrontend(siteDir);
  await waitForHttp(APP_URL, 10000);
}

function cleanupProcesses() {
  if (frontendServer) {
    frontendServer.close();
    frontendServer = null;
  }

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }

  if (backendLogStream) {
    backendLogStream.end();
    backendLogStream = null;
  }

  if (frontendLogStream) {
    frontendLogStream.end();
    frontendLogStream = null;
  }
}

app.whenReady().then(async () => {
  createWindow();

  try {
    await startEmbeddedCentralServer();
    await mainWindow.loadURL(APP_URL);
  } catch (error) {
    updateWindowHtml(renderErrorPage(error?.stack || error?.message || String(error)));
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      await mainWindow.loadURL(APP_URL).catch(() => {
        updateWindowHtml(renderStatusPage('Relance', 'Réinitialisation de l’application…'));
      });
    }
  });
});

app.on('window-all-closed', () => {
  cleanupProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupProcesses();
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  const startPage = resolveStartPage();

  if (!startPage) {
    renderErrorPage(
      mainWindow,
      `Aucun fichier index.html trouvé.\nappPath=${app.getAppPath()}\n__dirname=${__dirname}\nresourcesPath=${process.resourcesPath}`
    );
  } else {
    mainWindow.loadFile(startPage).catch((error) => {
      renderErrorPage(mainWindow, `Échec loadFile(${startPage})\n${error?.message || error}`);
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    renderErrorPage(mainWindow, `did-fail-load code=${code}\ndescription=${description}\nurl=${url}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
