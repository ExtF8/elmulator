/**
 * Common IPC: file/folder pickers.
 */
const { ipcMain } = require('electron');

/**
 * Register common pickers (PDF/Directory).
 * @param {{ dialogs: { choosePdf: (sender:any)=>Promise<string|null>, chooseDir: (sender:any)=>Promise<string|null> } }} deps
 */
function registerCommonIpc({ dialogs }) {
    // Validate early so we fail loudly during startup, not at click time.
    if (
        !dialogs ||
        typeof dialogs.choosePdf !== 'function' ||
        typeof dialogs.chooseDir !== 'function'
    ) {
        console.error(
            '[ipc/common] Invalid dialogs module: expected choosePdf() and chooseDir() functions.'
        );
        return;
    }

    ipcMain.handle('choose:pdf', async event => {
        try {
            return await dialogs.choosePdf(event.sender); // <-- call choosePdf here
        } catch (err) {
            console.error("Error occurred in handler for 'choose:pdf':", err);
            return null;
        }
    });

    ipcMain.handle('choose:dir', async event => {
        try {
            return await dialogs.chooseDir(event.sender); // <-- call chooseDir here
        } catch (err) {
            console.error("Error occurred in handler for 'choose:dir':", err);
            return null;
        }
    });
}

module.exports = { registerCommonIpc };
