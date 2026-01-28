import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: function () { return ipcRenderer.invoke('get-app-version'); },
    getPlatform: function () { return ipcRenderer.invoke('get-platform'); },
    minimizeWindow: function () { return ipcRenderer.invoke('minimize-window'); },
    maximizeWindow: function () { return ipcRenderer.invoke('maximize-window'); },
    closeWindow: function () { return ipcRenderer.invoke('close-window'); }
});
