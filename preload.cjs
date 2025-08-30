const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ti', {
    run: options => ipcRenderer.invoke('ti:run', options),
    onLog: h => {
        const f = (_e, chunk) => h(chunk);
        ipcRenderer.on('ti:log', f);
        return () => ipcRenderer.removeListener('ti:log', f);
    },
    onProgress: h => {
        const f = (_e, x) => h(x);
        ipcRenderer.on('ti:progress', f);
        return () => ipcRenderer.removeListener('ti:progress', f);
    },
    choosePdf: () => ipcRenderer.invoke('choose:pdf'),
    chooseDir: () => ipcRenderer.invoke('choose:dir'),
});



