// Global type definitions for Electron API
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
  fetch: (options: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
