/**
 * Module for Electron Packaging with Language Limitations
 */

const path = require('path');
const electronPackager = require('electron-packager');
const setLanguages = require('./node_modules/electron-packager-languages');

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '../elmulator');
const BUILD_PATH = path.resolve(__dirname, '../../Builds/builds_elmulator');
const ICON_PATH = path.join(__dirname, './images/icons');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

const { version } = require(PACKAGE_JSON_PATH);

/**
 * Main function to handle the electron packaging
 */
const packageElectronApp = () => {
    electronPackager(getPackagerOptions())
        .then(() => {
            console.log('Packaging was successful');
        })
        .catch((error) => {
            console.error('Packaging was NOT successful', error);
        });
};

/**
 * Returns the electron packager options
 * @returns {Object} - The electron packager options
 */
const getPackagerOptions = () => {
    return {
        dir: PROJECT_ROOT,
        name: `elmulator-v${version}`,
        platform: 'win32',
        arch: 'x64',
        icon: path.join(ICON_PATH, 'icon.ico'),
        prune: true,
        asar: true,
        ignore: ['.gitignore', '.vscode'],
        portable: true,
        overwrite: true,
        afterCopy: [setLanguages(['en', 'en_GB'])], // Only supports the specified languages
        out: BUILD_PATH,
        quiet: false,
    };
};

// Start the packaging process
packageElectronApp();