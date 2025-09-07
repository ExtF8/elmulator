/**
 * Path helpers for dev vs packaged, asar vs unpackaged.
 */
const { app } = require('electron');
const path = require('path');

function isPackaged() {
    return app.isPackaged;
}

function getResourcesBase() {
    // Valid both dev and packaged
    return process.resourcesPath;
}

function getPreloadPath() {
    return path.join(__dirname, '..', 'preload.cjs');
}

/**
 * Resolve a tool path depending on whether app is packaged or running in dev.
 * - In dev: tools live under __dirname
 * - In prod: must be unpacked from asar into app.asar.unpacked
 *
 * @param {string} rel - relative path to tool
 * @returns {string} absolute path to tool
 */
function getToolPath(rel) {
    // In production, files under asar must be unpacked to run via Node
    const base = isPackaged()
        ? path.join(getResourcesBase(), 'app.asar.unpacked')
        : path.join(__dirname, '..');
    return path.join(base, rel);
}

function getAsarNodeModulesPath() {
    // Dependencies in packaged app
    return path.join(getResourcesBase(), 'app.asar', 'node_modules');
}

module.exports = {
    isPackaged,
    getResourcesBase,
    getPreloadPath,
    getToolPath,
    getAsarNodeModulesPath,
};
