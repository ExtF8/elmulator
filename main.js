/**
 * Module for Electron Main Process Management
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

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
    const mainWindow = new BrowserWindow({
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
    // mainWindow.webContents.openDevTools()
};
/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
    createWindow();

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
