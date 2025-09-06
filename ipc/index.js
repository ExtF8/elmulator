/**
 * IPC entry point: registers all tool and common handlers.
 */
const { registerCommonIpc } = require('./common');
const { registerRenameTiIpc } = require('./ti');
const { registerIssuesIpc } = require('./issues');

function registerIcpHandlers({ dialogs, childRunner }) {
    registerCommonIpc({ dialogs });
    registerRenameTiIpc({ childRunner });
    registerIssuesIpc({ childRunner });
}

module.exports = { registerIcpHandlers };
