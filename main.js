/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow, dialog, autoUpdater } = require('electron');
const path = require('path');
// const { autoUpdater } = require('electron-updater');
// const log = require('electron-log');

// log.transports.file.level = 'debug';
autoUpdater.logger = 'log';
let mainWindow;
// Constants
const DEFAULT_WINDOW_DIMENSIONS = {
    width: 280,
    height: 460,
};
const ICON_PATH = path.join(__dirname, '/images/icons/icon.ico');
const PRELOAD_SCRIPT_PATH = path.join(__dirname, 'renderer.js');

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

    // Delay avoids launching during Squirrel first run lock
    setTimeout(() => {
        autoUpdater.checkForUpdates();
    }, 200);

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
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
});

autoUpdater.on('update-available', () => {
    console.log('Update available. Downloading...');
});

autoUpdater.on('update-not-available', () => {
    console.log('No update available...');
});

autoUpdater.on('error', err => {
    console.log('Update error: ', err);
});

autoUpdater.on('download-progress', progress => {
    console.log(`Download speed: ${progress.bytesPerSecond} B/s - ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Restart now', 'Later'],
        title: `Update available: ${releaseName}`,
        message: 'New version downloaded. Would you like to install it now?',
        detail: releaseNotes || "No release notes provided."
    });

    if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
    }
});
