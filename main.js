/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require('fs');



const { createMainWindow } = require('./window/createMainWindow');
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

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
    // Build the Main Window
    mainWindow = createMainWindow();

    // Build the application menu.
    setupMainMenu();





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


