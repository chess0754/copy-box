import { contextBridge, ipcRenderer, clipboard, nativeImage } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  getBrowserBookmarks: () => ipcRenderer.invoke("get-browser-bookmarks"),
  openExternalUrl: (url: string) =>
    ipcRenderer.invoke("open-external-url", url),
  readClipboardText: () => clipboard.readText(),
  writeClipboardText: (text: string) => clipboard.writeText(text),
  readClipboard: () => {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      return { type: "image", content: image.toDataURL() };
    }
    const text = clipboard.readText();
    if (text) {
      return { type: "text", content: text };
    }
    return null;
  },
  writeClipboard: (item: { type: string; content: string }) => {
    if (item.type === "image") {
      try {
        const image = nativeImage.createFromDataURL(item.content);
        clipboard.writeImage(image);
      } catch (e) {
        console.error("Failed to write image to clipboard", e);
      }
    } else {
      clipboard.writeText(item.content);
    }
  },
  createNoteWindow: (noteId: string) => ipcRenderer.invoke('create-note-window', noteId)
});

// Type definitions for the exposed API
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  getBrowserBookmarks: () => Promise<any[]>;
  openExternalUrl: (url: string) => Promise<void>;
  readClipboardText: () => string;
  writeClipboardText: (text: string) => void;
  readClipboard: () => { type: "text" | "image"; content: string } | null;
  writeClipboard: (item: { type: string; content: string }) => void;
  createNoteWindow: (noteId: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
