/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { spawn } = require('child_process');

// ENV for Hot Reloading in the development environment.
const env = process.env.NODE_ENV;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// If development environment
if (env === 'development') {
    console.log('DEV');
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true,
        });
    } catch (err) {
        console.log('Error:', err);
    }
}

let mainWindow;

// Constants
const DEFAULT_WINDOW_DIMENSIONS = {
    width: 340,
    height: 660,
};
const ICON_PATH = path.join(__dirname, '/images/icons/icon.ico');
const PRELOAD_SCRIPT_PATH = path.join(__dirname, 'preload.cjs');

/**
 * Crates the main application window
 */
const createWindow = () => {
    mainWindow = new BrowserWindow({
        icon: ICON_PATH,
        width: DEFAULT_WINDOW_DIMENSIONS.width,
        height: DEFAULT_WINDOW_DIMENSIONS.height,
        webPreferences: {
            preload: PRELOAD_SCRIPT_PATH,
            contextIsolation: true,
            nodeIntegration: false,
        },
        alwaysOnTop: true,
    });

    mainWindow.loadFile('index.html');

    // Uncomment to open the DevTools by default.
    mainWindow.webContents.openDevTools();
};

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
    createWindow();

    // Add app version to Help submenu
    const template = [
        ...(process.platform === 'darwin'
            ? [
                  {
                      label: app.name,
                      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
                  },
              ]
            : []),
        {
            label: 'File',
            submenu: [{ role: 'quit' }],
        },
        {
            label: 'Help',
            submenu: [{ label: `Version ${app.getVersion()}`, enabled: false }],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Pick a single PDF file
    ipcMain.handle('choose:pdf', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
        });
        return canceled ? null : filePaths[0];
    });

    // Pick a directory containing photos
    ipcMain.handle('choose:dir', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return canceled ? null : filePaths[0];
    });

    ipcMain.handle('ti:run', async (event, payload) => {
        const senderWin = BrowserWindow.fromWebContents(event.sender);
        try {
            const result = await runTiScript(senderWin, payload);
            return { ok: result.code === 0, code: result.code };
        } catch (err) {
            senderWin.webContents.send('ti:log', `Error: ${err?.message || String(err)}\n`);
            return { ok: false, code: -1, error: err?.message || String(err) };
        }
    });

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Handle window closing behavior
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Additional main process code can be added here or in separate modules

// Auto updater implementation
app.on('ready', function () {
    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
});

autoUpdater.on('update-available', () => {
    log.info('Update available. Downloading...');
});

autoUpdater.on('update-not-available', () => {
    log.info('No update available...');
});

autoUpdater.on('error', err => {
    log.info('Update error: ', err);
});

autoUpdater.on('download-progress', progress => {
    log.info(`Download speed: ${progress.bytesPerSecond} B/s - ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', (event, releaseNotes, name) => {
    const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Restart now', 'Later'],
        title: `Update available: ${name}`,
        message: 'New version downloaded. Would you like to install it now?',
        detail: releaseNotes || 'No release notes provided.',
    });

    if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
    }
});

/**
 * Spawn the rename script as a child process.
 * We do NOT change your working script; we just call it like CLI.
 * @param {BrowserWindow} senderWin - the window to stream logs back to
 * @param {object} args - { pdfPath, photosDir, mode, apply, refDigits }
 * @returns {Promise<{code:number}>}
 */
function runTiScript(senderWin, args) {
    const scriptPath = path.join(__dirname, 'tools', 'renameTI.cjs');
    const cliArgs = [
        scriptPath,
        '--pdf',
        args.pdfPath,
        '--photos',
        args.photosDir,
        '--refDigits',
        String(args.refDigits ?? 4),
    ];

    if (args.mode === 'inplace') {
        cliArgs.push('--inplace');
    } else {
        // default to copy mode; ensure an out dir exists/used
        const outDir = args.outDir || path.join(args.photosDir, 'renamed_output');
        cliArgs.push('--out', outDir);
    }

    if (args.apply) {
        cliArgs.push('--apply');
    } else {
        cliArgs.push('--debug', '--showMap'); // helpful logs on dry-run
    }

    // Use the same Node executable that launched Electron
    const child = spawn(process.execPath, cliArgs, {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Stream stdout/stderr lines to renderer
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', chunk => {
        senderWin.webContents.send('ti:log', chunk);
        // naive progress heuristic: bump on certain keywords if you want
        if (/Planned outputs:/.test(chunk)) senderWin.webContents.send('ti:progress', 20);
        if (/Dry run\./.test(chunk)) senderWin.webContents.send('ti:progress', 40);
        if (/Done\./.test(chunk)) senderWin.webContents.send('ti:progress', 100);
    });

    child.stderr.on('data', chunk => {
        senderWin.webContents.send('ti:log', chunk);
    });

    return new Promise(resolve => {
        child.on('close', code => resolve({ code }));
    });
}
