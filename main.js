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
const { registerIcpHandlers } = require('./ipc');
const dialogs  = require('./services/dialogs');
const childRunner = require('./services/childRunner');

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

    // Register IPC handlers
    registerIcpHandlers({ dialogs, childRunner });

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
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
