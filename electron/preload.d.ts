export interface ElectronAPI {
    getAppVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
    fetch: (options: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
