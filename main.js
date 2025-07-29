/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

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
    // mainWindow.webContents.openDevTools();
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
