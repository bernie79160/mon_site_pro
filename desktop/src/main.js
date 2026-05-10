const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveStartPage() {
  const candidates = [
    path.join(app.getAppPath(), 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join(__dirname, '..', '..', 'index.html'),
    path.join(process.resourcesPath || '', 'app.asar', 'index.html'),
    path.join(process.resourcesPath || '', 'index.html')
  ];

  return candidates.find((filePath) => filePath && fs.existsSync(filePath));
}

function renderErrorPage(mainWindow, details) {
  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Erreur de lancement</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f7f8fa; color: #1f2937; padding: 24px; }
      .box { max-width: 860px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; color: #b91c1c; }
      code, pre { background: #f3f4f6; border-radius: 8px; padding: 4px 8px; }
      pre { white-space: pre-wrap; padding: 12px; }
      ul { line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Impossible de charger l'application</h1>
      <p>Le fichier d'accueil n'a pas pu être ouvert. Vérifiez l'installation puis relancez l'application.</p>
      <h3>Détails techniques</h3>
      <pre>${escapeHtml(details)}</pre>
      <h3>Actions recommandées</h3>
      <ul>
        <li>Réinstaller la dernière version depuis la release GitHub.</li>
        <li>Éviter de déplacer uniquement l'exécutable sans les fichiers voisins.</li>
        <li>Si le problème persiste, transmettre cette capture au support formateur.</li>
      </ul>
    </div>
  </body>
</html>`;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

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
