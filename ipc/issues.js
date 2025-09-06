/**
 * IPC: Issues to Excel tool.
 */
const { BrowserWindow } = require('electron');

function registerIssuesIpc({ childRunner }) {
    const { runTool } = childRunner;

    /**
     * IPC handler for running the Issues to Excel extraction tool.
     *
     * Renderer calls:  ipcRenderer.invoke('issues:run', payload)
     *
     * Payload fields:
     * @param {string} pdfPath    - Absolute path to the PDF with "Issue X" entries.
     * @param {string} outXlsx    - Absolute path for the Excel file to write.
     * @param {boolean} apply     - If true, actually write the Excel file. If false, dry-run only.
     * @param {boolean} [inspect] - If true, print debug info about parsed issues.
     *
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     *          - ok: true if child exited with code 0, false otherwise
     *          - code: the child process exit code
     *          - error: error message if process failed
     */
    require('electron').ipcMain.handle('issues:run', async (event, payload) => {
        const senderWin = BrowserWindow.fromWebContents(event.sender);
        try {
            const args = [
                '--pdf',
                payload.pdfPath,
                '--out',
                payload.outXlsx,
                ...(payload.apply ? ['--apply'] : []),
                ...(payload.inspect ? ['--inspect'] : []),
            ];
            const result = await runTool(senderWin, {
                scriptRelPath: 'tools/extractIssuesToExcel.cjs',
                args,
                chan: 'issues',
            });
            return { ok: result.code === 0, code: result.code };
        } catch (err) {
            senderWin.webContents.send('issues:log', `Error: ${err?.message || String(err)}\n`);
            return { ok: false, code: -1, error: err?.message || String(err) };
        }
    });
}

module.exports = { registerIssuesIpc };
