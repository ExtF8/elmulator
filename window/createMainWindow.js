/**
 * BrowserWindow factory.
 */
const { BrowserWindow } = require('electron');
const path = require('path');
const { getPreloadPath } = require('../config/paths');

// Constants
const DEFAULT_WINDOW_DIMENSIONS = {
    width: 340,
    height: 660,
};
const ICON_PATH = path.join(__dirname, '/images/icons/icon.ico');

/**
 * Crates the main application window with the application menu
 */
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        icon: ICON_PATH,
        width: DEFAULT_WINDOW_DIMENSIONS.width,
        height: DEFAULT_WINDOW_DIMENSIONS.height,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
        },
        alwaysOnTop: true,
    });

    mainWindow.loadFile('index.html');


    // Uncomment to open the DevTools by default.
    // mainWindow.webContents.openDevTools();

    return mainWindow;
};

module.exports = {createMainWindow};