const { contextBridge, ipcRenderer } = require('electron');

/**
 * Subscribe to an IPC channel and return an unsubscribe function.
 * 
 * @param {string} channel
 * @param {(data:any) => void} handler
 * @returns {() => void}
 */
function subscribe(channel, handler) {
    const listener = (_evt, data) => handler(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
}

/**
 * TI: Rename Thermal Images API (window.ti)
 *
 * Channels used:
 *  - invoke: 'ti:run'
 *  - events: 'ti:log', 'ti:progress'
 *  - dialogs: 'choose:pdf', 'choose:dir'
 */
contextBridge.exposeInMainWorld('ti', {
    /**
     * Invoke the TI rename tool (dry-run or apply).
     * @param {TiRunPayload} options
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     */
    run: options => ipcRenderer.invoke('ti:run', options),

    /**
     * Subscribe to stdout/stderr log chunks from the child process.
     * @param {(chunk:string) => void} handler
     * @returns {() => void} unsubscribe
     */
    onLog: handler => subscribe('ti:log', handler),

    /**
     * Subscribe to coarse progress updates (0–100).
     * @param {(pct:number) => void} handler
     * @returns {() => void} unsubscribe
     */
    onProgress: handler => subscribe('ti:progress', handler),

    /**
     * Open native "choose PDF" dialog.
     * @returns {Promise<string|null>} Absolute path or null if canceled.
     */
    choosePdf: () => ipcRenderer.invoke('choose:pdf'),

    /**
     * Open native "choose directory" dialog.
     * @returns {Promise<string|null>} Absolute path or null if canceled.
     */
    chooseDir: () => ipcRenderer.invoke('choose:dir'),
});

/**
 * Issues → Excel Extraction API (window.issues)
 *
 * Channels used:
 *  - invoke: 'issues:run'
 *  - events: 'issues:log', 'issues:progress'
 *  - (optional save dialog could be added as 'issues:chooseOut' if you wire it in main)
 */
contextBridge.exposeInMainWorld('issues', {
    /**
     * Run the Issues→Excel extractor (dry-run by default; pass apply:true to write).
     * @param {IssuesRunPayload} options
     * @returns {Promise<{ok:boolean, code:number, error?:string}>}
     */
    run: options => ipcRenderer.invoke('issues:run', options),

    /**
     * Subscribe to stdout/stderr log chunks from the extractor.
     * @param {(chunk:string) => void} handler
     * @returns {() => void} unsubscribe
     */
    onLog: handler => subscribe('issues:log', handler),

    /**
     * Subscribe to coarse progress updates (0–100).
     * @param {(pct:number) => void} handler
     * @returns {() => void} unsubscribe
     */
    onProgress: handler => subscribe('issues:progress', handler),

    // If you add a save dialog in main.js:
    // chooseOut: () => ipcRenderer.invoke('issues:chooseOut'),
});
