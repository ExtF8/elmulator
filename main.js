/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require('fs');

const { fork } = require('child_process');
const { setupMainMenu } = require('./menu/menu');

// --- Single-instance lock (prevents second instance on Windows) ---
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.show();
            win.focus();
        }
    });
}

/**
 * Resolve a tool path depending on whether app is packaged or running in dev.
 * - In dev: tools live under __dirname
 * - In prod: must be unpacked from asar into app.asar.unpacked
 *
 * @param {string} rel - relative path to tool
 * @returns {string} absolute path to tool
 */
function getToolPath(rel) {
    // In production, files under asar must be unpacked to run via Node
    const base = app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : __dirname;
    return path.join(base, rel);
}

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
 * Crates the main application window with the application menu
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

    // Build the application menu.
    setupMainMenu();

    // Uncomment to open the DevTools by default.
    // mainWindow.webContents.openDevTools();
};

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
    createWindow();

    /**
     * Open a native file picker for a single PDF.
     *
     * Uses the sender's BrowserWindow as the parent so the dialog stays on top
     * and is modal relative to your app window.
     *
     * @returns {Promise<string|null>} Absolute path to the selected PDF, or null if canceled.
     */
    ipcMain.handle('choose:pdf', async event => {
        const parent = BrowserWindow.fromWebContents(event.sender);
        const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
            properties: ['openFile'],
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            title: 'Select PDF',
        });
        return canceled ? null : filePaths[0];
    });

    /**
     * Open a native directory picker for the photos folder.
     *
     * Uses the sender's BrowserWindow as the parent so the dialog stays on top
     * and is modal relative to your app window.
     *
     * @returns {Promise<string|null>} Absolute path to the selected directory, or null if canceled.
     */
    ipcMain.handle('choose:dir', async event => {
        const parent = BrowserWindow.fromWebContents(event.sender);
        const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
            properties: ['openDirectory'],
            title: 'Select Photos Folder',
        });
        return canceled ? null : filePaths[0];
    });

    /**
     * IPC handler for running the TI Rename tool.
     *
     * Renderer calls:  ipcRenderer.invoke('ti:run', payload)
     *
     * Payload fields:
     * @param {string} pdfPath    - Absolute path to the PDF with "<NAME> TI-<REF>" lines.
     * @param {string} photosDir  - Directory containing the FLIR/thermal images.
     * @param {'copy'|'inplace'} mode - Whether to copy into --out (copy) or rename originals (inplace).
     * @param {boolean} apply     - If true, actually perform renaming/copying. If false, dry-run only.
     * @param {number} [refDigits=4] - Number of leading digits from TI refs to keep when matching.
     * @param {string} [outDir]   - Custom output directory (used if mode==='copy').
     *
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     *          - ok: true if child exited with code 0, false otherwise
     *          - code: the child process exit code
     *          - error: error message if process failed
     */
    ipcMain.handle('ti:run', async (event, payload) => {
        const senderWin = BrowserWindow.fromWebContents(event.sender);
        try {
            const args = [
                '--pdf',
                payload.pdfPath,
                '--photos',
                payload.photosDir,
                '--refDigits',
                String(payload.refDigits ?? 4),
                ...(payload.mode === 'inplace'
                    ? ['--inplace']
                    : ['--out', payload.outDir || path.join(payload.photosDir, 'renamed_output')]),
                ...(payload.apply ? ['--apply'] : ['--inspect', '--showMap']),
            ];
            const result = await runChildTool(senderWin, {
                scriptRelPath: 'tools/renameTI.cjs',
                args,
                chan: 'ti',
            });
            return { ok: result.code === 0, code: result.code };
        } catch (err) {
            senderWin.webContents.send('ti:log', `Error: ${err?.message || String(err)}\n`);
            return { ok: false, code: -1, error: err?.message || String(err) };
        }
    });

    /**
     * IPC handler for running the Issues to Excel extraction tool.
     *
     * Renderer calls:  ipcRenderer.invoke('issues:run', payload)
     *
     * Payload fields:
     * @param {string} pdfPath    - Absolute path to the PDF with "Issue X" entries.
     * @param {string} outXlsx    - Absolute path for the Excel file to write.
     * @param {boolean} apply     - If true, actually write the Excel file. If false, dry-run only.
     * @param {boolean} [inspect] - If true, print debug info about parsed issues.
     *
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     *          - ok: true if child exited with code 0, false otherwise
     *          - code: the child process exit code
     *          - error: error message if process failed
     */
    ipcMain.handle('issues:run', async (event, payload) => {
        const senderWin = BrowserWindow.fromWebContents(event.sender);
        try {
            const args = [
                '--pdf',
                payload.pdfPath,
                '--out',
                payload.outXlsx,
                ...(payload.apply ? ['--apply'] : []),
                ...(payload.inspect ? ['--inspect'] : []),
            ];
            const result = await runChildTool(senderWin, {
                scriptRelPath: 'tools/extractIssuesToExcel.cjs',
                args,
                chan: 'issues',
            });
            return { ok: result.code === 0, code: result.code };
        } catch (err) {
            senderWin.webContents.send('issues:log', `Error: ${err?.message || String(err)}\n`);
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
 * Shared helper to fork a Node.js child process running a CLI tool
 *
 * @param {BrowserWindow} senderWin - the window to stream logs back to
 * @param {{
 *      scriptRelPath: string,
 *      args: string[],
 *      chan: string
 * }} config - relative path to CLI script, CLI args to pass, IPC chanel prefix, e.g., "ti" or "issues"
 * @returns {Promise<{code:number}>}
 */
function runChildTool(senderWin, { scriptRelPath, args, chan }) {
    const scriptPath = getToolPath(scriptRelPath);

    // Guard: ensure the unpacked tool exists in production
    if (!fs.existsSync(scriptPath)) {
        const msg =
            `Tool not found at: ${scriptPath}\n` +
            `Tip: ensure "asarUnpack": ["tools/**","node_modules/pdf-parse/**","node_modules/exceljs/**"] in build config.`;
        senderWin.webContents.send(`${chan}:log`, msg + '\n');
        return Promise.resolve({ code: -1 });
    }

    // Diagnostics: what exactly are we executing?
    senderWin.webContents.send(
        `${chan}:log`,
        `[run ${chan}] script: ${scriptPath}\n[args]: ${args.join(' ')}\n`
    );

    // IMPORTANT: use fork + silent to capture stdio; no new Electron instance
    const child = fork(scriptPath, args, {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        silent: true,
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    // Forward stdout/stderr to renderer
    child.stdout.on('data', chunk => {
        senderWin.webContents.send(`${chan}:log`, chunk);

        // Heuristic progress signals
        if (/Planned outputs:/.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 20);
        if (/Dry run\./.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 60);
        if (/^Done\./m.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 100);
    });

    child.stderr.on('data', chunk => {
        senderWin.webContents.send(`${chan}:log`, chunk);
    });

    child.on('error', err => {
        senderWin.webContents.send(`${chan}:log`, `Error spawning child: ${err.message}\n`);
    });

    return new Promise(resolve => {
        child.on('close', (code, signal) => {
            // if code is null, it usually means spawn error or killed by signal
            if (code === null && signal) {
                senderWin.webContents.send(
                    `${chan}:log`,
                    `Child terminated by signal: ${signal}\n`
                );
            }
            resolve({ code: code ?? -1 });
        });
    });
}
