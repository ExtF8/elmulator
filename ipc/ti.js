/**
 * IPC: Rename TI tool
 */
const { BrowserWindow } = require('electron');
const path = require('path');

function registerRenameTiIpc({ childRunner }) {
    const { runTool } = childRunner;

    /**
     * IPC handler for running the TI Rename tool.
     *
     * Renderer calls:  ipcRenderer.invoke('ti:run', payload)
     *
     * Payload fields:
     * @param {string} pdfPath    - Absolute path to the PDF with "<NAME> TI-<REF>" lines.
     * @param {string} photosDir  - Directory containing the FLIR/thermal images.
     * @param {'copy'|'inplace'} mode - Whether to copy into --out (copy) or rename originals (inplace).
     * @param {boolean} apply     - If true, actually perform renaming/copying. If false, dry-run only.
     * @param {number} [refDigits=4] - Number of leading digits from TI refs to keep when matching.
     * @param {string} [outDir]   - Custom output directory (used if mode==='copy').
     *
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     *          - ok: true if child exited with code 0, false otherwise
     *          - code: the child process exit code
     *          - error: error message if process failed
     */
    require('electron').ipcMain.handle('ti:run', async (event, payload) => {
        const senderWin = BrowserWindow.fromWebContents(event.sender);
        try {
            const args = [
                '--pdf',
                payload.pdfPath,
                '--photos',
                payload.photosDir,
                '--refDigits',
                String(payload.refDigits ?? 4),
                ...(payload.mode === 'inplace'
                    ? ['--inplace']
                    : ['--out', payload.outDir || path.join(payload.photosDir, 'renamed_output')]),
                ...(payload.apply ? ['--apply'] : ['--inspect', '--showMap']),
            ];
            const result = await runTool(senderWin, {
                scriptRelPath: 'tools/renameTI.cjs',
                args,
                chan: 'ti',
            });
            return { ok: result.code === 0, code: result.code };
        } catch (err) {
            senderWin.webContents.send('ti:log', `Error: ${err?.message || String(err)}\n`);
            return { ok: false, code: -1, error: err?.message || String(err) };
        }
    });
}

module.exports = { registerRenameTiIpc };
