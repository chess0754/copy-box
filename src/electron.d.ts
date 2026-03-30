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
  aiChatStream: (options: {
    config: {
      provider: string;
      apiKey: string;
      baseUrl: string;
      model: string;
      azureDeployment?: string;
      azureApiVersion?: string;
    };
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  }) => Promise<{ success: boolean; content?: string; error?: string }>;
  onAiChatChunk: (callback: (data: { content?: string; error?: string; done: boolean }) => void) => () => void;
  aiChatStop: () => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
