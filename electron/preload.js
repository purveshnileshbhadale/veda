const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('veda', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});
