/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow } = require('electron');
const { createMainWindow } = require('./window/createMainWindow');
const { setupMainMenu } = require('./menu/menu');
const { registerIcpHandlers } = require('./ipc');
const dialogs = require('./services/dialogs');
const childRunner = require('./services/childRunner');
const { startAutoUpdate } = require('./services/updater');

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
    // Start auto updater
    if (process.platform === 'win32' || 'darwin') {
        startAutoUpdate(mainWindow);
    }
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
