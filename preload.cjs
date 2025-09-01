const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe IPC APIs to the renderer.
 *
 * Provides:
 * - run(options): invoke the TI rename script
 * - onLog(handler): subscribe to streamed log chunks
 * - onProgress(handler): subscribe to progress updates
 * - choosePdf(): open a native "open PDF" dialog
 * - chooseDir(): open a native "open directory" dialog
 *
 * All functions are accessible via window.ti in the renderer.
 */
contextBridge.exposeInMainWorld('ti', {
    /**
     * Invoke the rename run (dry-run or apply).
     * @param {object} options - Payload for the run.
     * @returns {Promise<any>} IPC result object {ok:boolean, code:number, error?:string}
     */
    run: options => ipcRenderer.invoke('ti:run', options),

    /**
     * Subscribe to log messages from the child process.
     * @param {(chunk:string) => void} handler - Called with each log chunk.
     * @returns {() => void} unsubscribe function.
     */
    onLog: handler => {
        const listener = (_e, chunk) => handler(chunk);
        ipcRenderer.on('ti:log', listener);
        return () => ipcRenderer.removeListener('ti:log', listener);
    },

    /**
     * Subscribe to progress updates.
     * @param {(pct:number) => void} handler - Called with each progress value.
     * @returns {() => void} unsubscribe function.
     */
    onProgress: handler => {
        const listener = (_e, pct) => handler(pct);
        ipcRenderer.on('ti:progress', listener);
        return () => ipcRenderer.removeListener('ti:progress', listener);
    },

    /**
     * Open a native "choose PDF" dialog.
     * @returns {Promise<string|null>} absolute path or null if canceled
     */
    choosePdf: () => ipcRenderer.invoke('choose:pdf'),

    /**
     * Open a native "choose directory" dialog.
     * @returns {Promise<string|null>} absolute path or null if canceled
     */
    chooseDir: () => ipcRenderer.invoke('choose:dir'),
});
