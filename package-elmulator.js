const electronPackager = require('electron-packager');
const setLanguages = require('./node_modules/electron-packager-languages');

const PROJECT_PATH="../../../../repos/freelance/Projects/elmulator"
const BUILD_PATH="../../Builds/builds_elmulator/"
const ICON_PATH="./images/icons"
const version = require(`${PROJECT_PATH}/package.json`).version;

electronPackager({
    dir: PROJECT_PATH,
    name: `elmulator-v${version}`,
    platform: 'win32',
    arch: 'x64',
    icon: `${ICON_PATH}/icon.ico`,
    portable: true,
    asar: true,
    ignore: [".gitignore", ".vscode", "out"],
    overwrite: true,
    prune: true,
    out: `${BUILD_PATH}`,
    afterCopy: [setLanguages(['en', 'en_GB'])]  // Only supports the specified languages
}).then(() => {
    console.log('Packaging was successful');
}).catch(error => {
    console.error('Packaging was NOT successful', error);
});