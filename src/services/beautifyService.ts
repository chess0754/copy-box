import { ApiConfig } from "../store/apiStore";

export interface BeautifyOptions {
  type: "prompt" | "skill";
  title?: string;
  content: string;
  category?: string;
  description?: string;
}

const BEAUTIFY_PROMPT = `你是一个专业的内容优化助手。请帮我优化以下内容，使其更加专业、清晰、易读。

优化要求：
1. 保持原意不变，但表达更加专业和精炼
2. 改善语言流畅度和可读性
3. 如果是代码相关内容，保持代码格式不变
4. 添加适当的标点和段落分隔
5. 如果有变量占位符（如 {{variable}}），请保留不变

请直接返回优化后的内容，不要添加任何解释或说明。`;

export async function beautifyContent(
  config: ApiConfig,
  options: BeautifyOptions
): Promise<string> {
  let url: string;
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let body: any;

  const userMessage = options.type === "prompt"
    ? `请优化以下提示词内容：

标题：${options.title || "无标题"}
分类：${options.category || "无分类"}
内容：
${options.content}`
    : `请优化以下技能内容：

标题：${options.title || "无标题"}
类型：${options.type}
分类：${options.category || "无分类"}
描述：${options.description || "无描述"}
内容：
${options.content}`;

  const messages = [
    { role: "system", content: BEAUTIFY_PROMPT },
    { role: "user", content: userMessage }
  ];

  switch (config.provider) {
    case "openai":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "anthropic":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/messages`;
      headers["x-api-key"] = config.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      body = {
        model: config.model,
        max_tokens: 4096,
        messages: messages.filter(m => m.role !== "system").map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        })),
        system: BEAUTIFY_PROMPT,
      };
      break;

    case "azure":
      url = `${config.baseUrl.replace(/\/$/, "")}/openai/deployments/${config.azureDeployment}/chat/completions?api-version=${config.azureApiVersion || "2024-02-15-preview"}`;
      headers["api-key"] = config.apiKey;
      body = {
        messages,
        temperature: 0.3,
      };
      break;

    case "ollama":
      url = `${config.baseUrl.replace(/\/$/, "")}/api/chat`;
      body = {
        model: config.model,
        messages,
        stream: false,
      };
      break;

    case "alibaba":
      url = `${config.baseUrl.replace(/\/$/, "")}/api/v1/services/aigc/text-generation/generation`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        input: {
          messages: messages.filter(m => m.role !== "system")
        },
        parameters: {
          temperature: 0.3
        },
        system: BEAUTIFY_PROMPT
      };
      break;

    case "baidu":
      url = `${config.baseUrl.replace(/\/$/, "")}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${config.model}?access_token=${config.apiKey}`;
      body = {
        messages,
        temperature: 0.3,
      };
      break;

    case "zhipu":
      url = `${config.baseUrl.replace(/\/$/, "")}/api/paas/v4/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "xunfei":
      url = `${config.baseUrl.replace(/\/$/, "")}/v3.5/chat`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "moonshot":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "baichuan":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "minimax":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "deepseek":
      url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "doubao":
      url = `${config.baseUrl.replace(/\/$/, "")}/api/v3/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "tencent":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "siliconflow":
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;

    case "custom":
    default:
      url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages,
        temperature: 0.3,
      };
      break;
  }

  const response = await window.electronAPI.fetch({
    url,
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }

  const data = response.data;

  if (config.provider === "anthropic") {
    return data.content?.[0]?.text || "";
  } else if (config.provider === "alibaba") {
    return data.output?.text || "";
  } else if (config.provider === "baidu") {
    return data.result || "";
  } else if (config.provider === "ollama") {
    return data.message?.content || "";
  } else {
    return data.choices?.[0]?.message?.content || "";
  }
}
