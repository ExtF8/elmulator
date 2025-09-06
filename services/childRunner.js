/**
 * Shared fork runner.
 * Resolves tool path, sets NODE_PATH, streams logs/progress.
 */
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
    isPackaged,
    getToolPath,
    getAsarNodeModulesPath,
    getResourcesBase,
} = require('../config/paths');

/**
 * Shared helper to fork a Node.js child process running a CLI tool
 *
 * @param {BrowserWindow} senderWin - the window to stream logs back to
 * @param {{
 *      scriptRelPath: string,
 *      args: string[],
 *      chan: string
 * }} config - relative path to CLI script, CLI args to pass, IPC chanel prefix, e.g., "ti" or "issues"
 * @returns {Promise<{code:number}>}
 */
function runTool(senderWin, { scriptRelPath, args, chan }) {
    const scriptPath = getToolPath(scriptRelPath);

    // Guard: ensure the unpacked tool exists in production
    if (!fs.existsSync(scriptPath)) {
        const msg =
            `Tool not found at: ${scriptPath}\n` +
            `Tip: ensure "asarUnpack": ["tools/**"] in build config.`;
        senderWin.webContents.send(`${chan}:log`, msg + '\n');
        return Promise.resolve({ code: -1 });
    }

    // Diagnostics: what exactly are we executing?
    senderWin.webContents.send(
        `${chan}:log`,
        `[run ${chan}] script: ${scriptPath}\n[args]: ${args.join(' ')}\n`
    );
    // Optional: also mirror to main-process console
    console.log(`[run ${chan}] script: ${scriptPath}`);
    console.log(`[run ${chan}] args: ${args.join(' ')}`);

    const child = fork(scriptPath, args, {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        silent: true,
        cwd: isPackaged() ? getResourcesBase() : path.join(__dirname, '..'), // sensible base
        env: {
            ...process.env,
            // Let Node resolve modules from the asar's node_modules in production
            NODE_PATH: isPackaged()
                ? getAsarNodeModulesPath()
                : path.join(__dirname, '..', 'node_modules'),
            NODE_OPTIONS: '--trace-uncaught', // optional: better stacks while debugging
            ELECTRON_RUN_AS_NODE: '1', // safe; ensures pure node behavior
        },
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    // Forward stdout/stderr to renderer
    child.stdout.on('data', chunk => {
        senderWin.webContents.send(`${chan}:log`, chunk);

        // Heuristic progress signals
        if (/Planned outputs:/.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 20);
        if (/Dry run\./.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 60);
        if (/^Done\./m.test(chunk)) senderWin.webContents.send(`${chan}:progress`, 100);
    });

    child.stderr.on('data', chunk => {
        senderWin.webContents.send(`${chan}:log`, `[ERR] ${chunk}`);
        console.error(`[${chan} child err]`, chunk);
    });

    child.on('error', err => {
        senderWin.webContents.send(`${chan}:log`, `Error spawning child: ${err.message}\n`);
        console.error(`[${chan}] spawn error:`, err);
    });

    return new Promise(resolve => {
        child.on('close', (code, signal) => {
            if (code === null && signal) {
                senderWin.webContents.send(
                    `${chan}:log`,
                    `Child terminated by signal: ${signal}\n`
                );
                console.warn(`[${chan}] child terminated by signal: ${signal}`);
            }
            resolve({ code: code ?? -1 });
        });
    });
}

module.exports = {
    runTool,
};
