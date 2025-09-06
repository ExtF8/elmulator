/**
 * Common IPC: file/folder pickers.
 */
const { ipcMain } = require('electron');

/**
 *
 * @param {{dialogs: {choosePdf: Function, chooseDir: Function}}} deps
 */
function registerCommonIpc({ dialogs }) {
    ipcMain.handle('choose:pdf', async event => {
        return dialogs.chooseDir(event.sender);
    });

    ipcMain.handle('choose:dir', async event => {
        return dialogs.chooseDir(event.sender);
    });
}

module.exports = { registerCommonIpc };
