import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * API Provider 类型
 * 支持国内外主流AI厂商
 */
export type ApiProvider = 
  | "openai" 
  | "anthropic" 
  | "azure" 
  | "ollama" 
  | "alibaba" 
  | "baidu" 
  | "zhipu" 
  | "xunfei" 
  | "moonshot" 
  | "baichuan" 
  | "minimax" 
  | "deepseek" 
  | "doubao" 
  | "tencent"
  | "siliconflow"
  | "custom";

/**
 * API 测试结果
 */
export interface ApiTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

/**
 * API 配置项
 */
export interface ApiConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  // Azure 专用配置
  azureDeployment?: string;
  azureApiVersion?: string;
  // 自定义配置
  customHeaders?: Record<string, string>;
  // 状态
  enabled: boolean;
  // 创建/更新时间
  createTime: string;
  updateTime: string;
}

interface ApiState {
  configs: ApiConfig[];
  activeConfigId: string | null;
  testingConfigId: string | null;
  // 测试结果缓存 {configId: {success, message, latency, time}}
  testResults: Record<string, ApiTestResult & { time: string }>;
  // 添加配置
  addConfig: (config: ApiConfig) => void;
  // 更新配置
  updateConfig: (id: string, content: Partial<ApiConfig>) => void;
  // 删除配置
  deleteConfig: (id: string) => void;
  // 获取配置
  getConfigById: (id: string) => ApiConfig | undefined;
  // 设置激活配置
  setActiveConfig: (id: string | null) => void;
  // 测试 API 配置
  testConfig: (id: string) => Promise<ApiTestResult>;
  // 设置测试中状态
  setTestingConfigId: (id: string | null) => void;
  // 清除测试结果
  clearTestResult: (id: string) => void;
}

export const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      configs: [],
      activeConfigId: null,
      testingConfigId: null,
      testResults: {},

      addConfig: (config) =>
        set((state) => ({ configs: [config, ...state.configs] })),

      updateConfig: (id, content) =>
        set((state) => ({
          configs: state.configs.map((config) =>
            config.id === id
              ? { ...config, ...content, updateTime: new Date().toLocaleString() }
              : config
          ),
        })),

      deleteConfig: (id) =>
        set((state) => ({
          configs: state.configs.filter((config) => config.id !== id),
          activeConfigId: state.activeConfigId === id ? null : state.activeConfigId,
        })),

      getConfigById: (id) => get().configs.find((c) => c.id === id),

      setActiveConfig: (id) => set({ activeConfigId: id }),

      setTestingConfigId: (id) => set({ testingConfigId: id }),

      testConfig: async (id) => {
        const config = get().configs.find((c) => c.id === id);
        if (!config) {
          return { success: false, message: "配置不存在" };
        }

        set({ testingConfigId: id });

        try {
          const startTime = Date.now();

          // 根据不同 provider 构建请求
          let url = config.baseUrl;
          let headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (config.provider === "custom" && config.customHeaders) {
            headers = { ...headers, ...config.customHeaders };
          }

          let body: Record<string, unknown> = {};

          switch (config.provider) {
            case "openai":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "anthropic":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/messages`;
              headers["x-api-key"] = config.apiKey;
              headers["anthropic-version"] = "2023-06-01";
              body = {
                model: config.model,
                max_tokens: 10,
                messages: [{ role: "user", content: "test" }],
              };
              break;

            case "azure":
              url = `${config.baseUrl.replace(/\/$/, "")}/openai/deployments/${config.azureDeployment}/chat/completions?api-version=${config.azureApiVersion || "2024-02-15-preview"}`;
              headers["api-key"] = config.apiKey;
              body = {
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "ollama":
              url = `${config.baseUrl.replace(/\/$/, "")}/api/chat`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                stream: false,
              };
              break;

            case "alibaba":
              url = `${config.baseUrl.replace(/\/$/, "")}/services/aigc/text-generation/generation`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                input: { messages: [{ role: "user", content: "test" }] },
                parameters: { max_tokens: 10 },
              };
              break;

            case "baidu":
              url = `${config.baseUrl.replace(/\/$/, "")}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}`;
              headers["Content-Type"] = "application/json";
              body = {
                messages: [{ role: "user", content: "test" }],
                max_output_tokens: 10,
              };
              break;

            case "zhipu":
              url = `${config.baseUrl.replace(/\/$/, "")}/api/paas/v4/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "xunfei":
              url = `${config.baseUrl.replace(/\/$/, "")}/v3.5/chat`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "moonshot":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "baichuan":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "minimax":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "deepseek":
              url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "doubao":
              url = `${config.baseUrl.replace(/\/$/, "")}/v3/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "tencent":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "siliconflow":
              url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;

            case "custom":
            default:
              url = `${config.baseUrl.replace(/\/$/, "")}`;
              headers["Authorization"] = `Bearer ${config.apiKey}`;
              body = {
                model: config.model,
                messages: [{ role: "user", content: "test" }],
                max_tokens: 10,
              };
              break;
          }

          // 使用主进程代理请求绕过 CORS
          const response = await window.electronAPI.fetch({
            url,
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });

          const latency = Date.now() - startTime;

          if (response.ok) {
            const result = { success: true, message: "连接成功", latency };
            set((state) => ({
              testingConfigId: null,
              testResults: { ...state.testResults, [id]: { ...result, time: new Date().toLocaleString() } },
            }));
            return result;
          } else {
            const errorData = response.data || {};
            const errorMessage =
              errorData.error?.message ||
              errorData.message ||
              `请求失败 (${response.status})`;
            const result = { success: false, message: errorMessage, latency };
            set((state) => ({
              testingConfigId: null,
              testResults: { ...state.testResults, [id]: { ...result, time: new Date().toLocaleString() } },
            }));
            return result;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "网络错误";
          const result = { success: false, message: errorMessage };
          set((state) => ({
            testingConfigId: null,
            testResults: { ...state.testResults, [id]: { ...result, time: new Date().toLocaleString() } },
          }));
          return result;
        }
      },

      clearTestResult: (id) =>
        set((state) => {
          const newResults = { ...state.testResults };
          delete newResults[id];
          return { testResults: newResults };
        }),
    }),
    {
      name: "api-storage",
      storage: createJSONStorage(() => localStorage),
      // 只持久化 configs，testingConfigId 不需要持久化
      partialize: (state) => ({
        configs: state.configs,
        activeConfigId: state.activeConfigId,
      }),
    }
  )
);