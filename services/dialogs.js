/**
 * Dialog wrappers
 */
const { dialog, BrowserWindow } = require('electron');

/**
 *
 * @param {Electron.WebContents} sender
 * @returns {Electron.BrowserWindow}
 */
function getParent(sender) {
    return BrowserWindow.fromWebContents(sender);
}

/**
 * Open a native file picker for a single PDF.
 *
 * @param {Electron.WebContents} sender
 * @returns {Promise<string|null>} Absolute path to the selected PDF, or null if canceled.
 */
async function choosePdf(sender) {
    const parent = getParent(sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
        properties: ['openFile'],
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        title: 'Select PDF',
    });
    return canceled ? null : filePaths[0];
}

/**
 * Open a native directory picker for the photos folder.
 *
 * Uses the sender's BrowserWindow as the parent so the dialog stays on top
 * and is modal relative to your app window.
 *
 * @returns {Promise<string|null>} Absolute path to the selected directory, or null if canceled.
 */
async function chooseDir(sender) {
    const parent = getParent(sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
        properties: ['openDirectory'],
        title: 'Select Photos Folder',
    });
    return canceled ? null : filePaths[0];
}

module.exports = {
    choosePdf,
    chooseDir,
};
