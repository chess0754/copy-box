import { create } from "zustand";

/**
 * 应用信息接口
 */
interface AppInfo {
  version: string;
  platform: string;
}

/**
 * 应用状态接口
 */
interface AppState {
  appInfo: AppInfo;
  loading: boolean;
  setAppInfo: (info: AppInfo) => void;
  setLoading: (loading: boolean) => void;
  loadAppInfo: () => Promise<void>;
}

/**
 * 应用全局状态管理 Store
 * 使用 Zustand 管理应用的全局状态
 */
export const useAppStore = create<AppState>((set) => ({
  appInfo: {
    version: "",
    platform: "",
  },
  loading: false,
  setAppInfo: (info) => set({ appInfo: info }),
  setLoading: (loading) => set({ loading }),
  loadAppInfo: async () => {
    set({ loading: true });
    try {
      const [version, platform] = await Promise.all([
        window.electronAPI.getAppVersion(),
        window.electronAPI.getPlatform(),
      ]);
      set({ appInfo: { version, platform } });
    } catch (error) {
      console.error("Failed to load app information:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
