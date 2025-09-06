/**
 * electron-updater wiring.
 */
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

/**
 * @param {Electron.BrowserWindow} mainWindow
 */
function startAutoUpdate(mainWindow) {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';

    autoUpdater.on('checking-for-update', () => log.info('Checking for updates...'));
    autoUpdater.on('update-available', () => log.info('Update available. Downloading...'));
    autoUpdater.on('update-not-available', () => log.info('No update available...'));
    autoUpdater.on('error', err => log.info('Update error:', err));
    autoUpdater.on('download-progress', p =>
        log.info(`Download speed: ${p.bytesPerSecond} B/s - ${Math.round(p.percent)}%`)
    );
    autoUpdater.on('update-downloaded', (event, releaseNotes, name) => {
        const { dialog } = require('electron');
        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['Restart now', 'Later'],
            title: `Update available: ${name}`,
            message: 'New version downloaded. Install now?',
            detail: releaseNotes || 'No release notes provided.',
        });
        if (response === 0) autoUpdater.quitAndInstall(false, true);
    });

    autoUpdater.checkForUpdates();
}

module.exports = { startAutoUpdate };
