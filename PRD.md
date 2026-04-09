现在我已经全面了解了 copy-box 项目的现有功能：

1. **Clipboard（剪贴板）**：自动监控剪贴板，支持文本和图片，可以将内容转为提示词
2. **Notes（提示词）**：Prompt 管理，支持分类、版本控制、搜索筛选
3. **Apps（收藏夹）**：应用/链接收藏

现在我来为你出一份详细的 PRD 文档：
我现在对项目有了全面的了解。让我为你出一份详细的 PRD（产品需求文档）：

---

# 📄 PRD 文档：AI Skills & Prompt 管理系统

**项目名称：** Copy-Box AI Hub  
**版本：** 2.0.0  
**文档日期：** 2026-03-26  
**状态：** 需求规划

---

## 一、项目概述

### 1.1 产品定位

基于现有 copy-box 项目（Electron + React 桌面应用），将其升级改造为 **本地化的 AI Skills 和 Prompts 管理系统**。

核心价值：
- 💾 **完全本地化** - Skills 和 Prompts 存储在本地，保护用户隐私
- 🔄 **多 AI 对比** - 支持配置多个 AI API，同屏对比输出结果
- 🧠 **AI Agent 优化** - 付费用户可通过 AI Agent 进行结果分析与优化

### 1.2 目标用户

| 用户类型 | 需求 |
|---------|------|
| AI 开发者 | 管理、测试、对比多个 AI 的 Skills/Prompts |
| Prompt 工程师 | 优化提示词，同步测试多个模型 |
| 企业用户 | 本地部署，保护商业提示词资产 |
| 付费用户 | AI Agent 自动分析与优化输出结果 |

---

## 二、产品架构

### 2.1 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron 桌面应用                        │
├─────────────────────────────────────────────────────────────┤
│  渲染进程 (React)                                            │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Skills仓库   │ Prompts仓库  │ 多AI对比    │ AI Agent   │  │
│  │ (技能管理)   │ (提示词管理)  │ (同屏对比)   │ (付费功能)  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      IPC 通信层                              │
├─────────────────────────────────────────────────────────────┤
│  主进程 (Node.js)                                            │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ 本地存储    │ AI API调度  │ 文件系统    │ 权限管理    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    本地数据存储                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Skills/     │ Prompts/    │ API配置     │ 用户数据    │  │
│  │ Templates   │             │             │             │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户选择 Skill/Prompt
        ↓
选择要运行的 AI APIs (可多选)
        ↓
并行调用各 AI API
        ↓
收集返回结果
        ↓
同屏展示对比
        ↓
[付费用户] 触发 AI Agent 优化
```

---

## 三、功能模块

### 3.1 模块一：Skills 仓库

**功能描述：** 管理 AI Agent Skills（智能体技能配置）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 创建 Skill | 通过表单或 JSON 创建 Skill 配置 | P0 |
| 编辑 Skill | 修改已有 Skill 配置 | P0 |
| 删除 Skill | 删除 Skill（支持批量删除） | P0 |
| 导入 Skill | 从本地文件导入（JSON/YAML） | P1 |
| 导出 Skill | 导出为本地文件 | P1 |
| Skill 市场 | 预设常用 Skills 模板 | P2 |

**Skill 数据结构：**
```typescript
interface Skill {
  id: string;
  name: string;              // Skill 名称
  description: string;       // 描述
  category: string;          // 分类
  version: number;           // 版本号
  config: {
    type: 'prompt' | 'agent' | 'chain';
    prompt: string;          // 核心提示词
    variables: Variable[];   // 变量定义
    tools?: string[];        // 可用工具
    model?: string;          // 默认模型
  };
  metadata: {
    author: string;
    tags: string[];
    createTime: string;
    updateTime: string;
  };
}
```

### 3.2 模块二：Prompts 仓库

**功能描述：** 管理提示词模板（基于现有 Notes 升级）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 创建 Prompt | 创建提示词模板（支持变量占位符） | P0 |
| 编辑 Prompt | 富文本编辑 | P0 |
| 删除 Prompt | 支持批量删除 | P0 |
| 变量注入 | 运行前填写变量值 | P0 |
| 分类管理 | 自定义分类 | P1 |
| 版本管理 | 历史版本对比 | P1 |
| 导入/导出 | JSON/Markdown 格式 | P1 |

**Prompt 数据结构：**
```typescript
interface Prompt {
  id: string;
  title: string;             // 标题
  content: string;           // 提示词内容（支持 {{variable}} 变量）
  category: string;          // 分类
  tags: string[];            // 标签
  version: number;           // 版本号
  history: PromptVersion[];  // 历史版本
  metadata: {
    author: string;
    createTime: string;
    updateTime: string;
    usageCount: number;      // 使用次数
  };
}
```

### 3.3 模块三：多 AI 对比

**功能描述：** 选择一个或多个 AI API 同时运行，对比输出结果

| 功能 | 描述 | 优先级 |
|------|------|--------|
| AI 选择 | 勾选要运行的 AI（支持多选） | P0 |
| 并行执行 | 同时调用多个 AI API | P0 |
| 同屏对比 | 左右/上下分屏展示结果 | P0 |
| 差异高亮 | 标出不同 AI 输出的差异 | P1 |
| 结果导出 | 导出对比结果（Markdown/JSON） | P1 |
| 复制单结果 | 复制单个 AI 的输出 | P0 |
| 保存记录 | 保存对比历史 | P2 |

**对比界面布局：**
```
┌─────────────────────────────────────────────────────────────┐
│  [选择 Skill/Prompt ▼]  [选择 AI: ☑ OpenAI  ☑ Claude  ☐ Gemini]  [运行]  │
├───────────────────────┬───────────────────────┬─────────────┤
│    OpenAI (GPT-4)     │    Claude 3.5         │  Gemini    │
│                       │                       │             │
│   输出内容...          │   输出内容...          │ 输出内容...  │
│                       │                       │             │
├───────────────────────┴───────────────────────┴─────────────┤
│  [复制全部] [导出] [AI Agent 分析]                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 模块四：API 配置

**功能描述：** 管理多个 AI API 的配置

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 添加 API | 配置新的 AI API 端点 | P0 |
| 编辑 API | 修改 API 配置 | P0 |
| 删除 API | 移除 API 配置 | P0 |
| API 测试 | 测试连接是否正常 | P0 |
| API 密钥管理 | 安全存储 API Key | P0 |
| 预设模板 | 常用 API 预设（OpenAI/Anthropic/本地部署等） | P1 |

**支持的 API 类型：**
```typescript
type APIProvider = 
  | 'openai'      // OpenAI API
  | 'anthropic'   // Anthropic Claude
  | 'azure'       // Azure OpenAI
  | 'ollama'      // Ollama 本地部署
  | 'custom';     // 自定义 API

interface APIConfig {
  id: string;
  name: string;           // 显示名称
  provider: APIProvider;  // API 提供商
  endpoint: string;       // API 端点
  apiKey: string;         // API Key（加密存储）
  model: string;          // 默认模型
  maxTokens: number;      // 最大 Token 数
  temperature: number;    // 温度参数
  enabled: boolean;       // 是否启用
}
```

### 3.5 模块五：AI Agent 分析（付费功能）

**功能描述：** 使用 AI Agent 分析多个输出的差异并提供优化建议

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 差异分析 | 分析各 AI 输出的差异点 | P0 |
| 质量评估 | 评估各输出的质量得分 | P1 |
| 优化建议 | 生成 Prompt 优化建议 | P0 |
| 自动优化 | 一键优化 Prompt | P2 |
| 结果总结 | 生成综合总结报告 | P1 |

---

## 四、现有功能迁移

### 4.1 保留功能

| 功能 | 迁移方式 |
|------|---------|
| 剪贴板历史 | 保留，作为辅助功能 |
| 提示词管理 | 升级为 Prompts 仓库 |
| 收藏夹 | 保留或整合到 Skills 分类 |

### 4.2 界面调整

现有菜单：
```
粘贴板 → 保留为"剪贴板"
提示词 → 升级为"Prompts 仓库"
收藏夹 → 升级为"Skills 仓库"
```

新增菜单：
```
Prompts 仓库
Skills 仓库
多 AI 对比
API 配置
[付费] AI Agent
```

---

## 五、本地化存储设计

### 5.1 存储位置

```
~/copy-box-data/
├── skills/
│   ├── skills.json        # Skills 索引
│   └── templates/         # Skill 模板文件
├── prompts/
│   ├── prompts.json       # Prompts 索引
│   └── versions/          # 版本历史
├── api-configs/
│   └── apis.json          # API 配置（加密）
├── comparison-history/    # 对比历史记录
└── user-data/
    └── preferences.json   # 用户偏好设置
```

### 5.2 数据安全

- 🔐 API Key 使用 AES-256 加密存储
- 📁 数据完全保存在本地，不上传云端
- 🗑️ 支持数据导出/导入（备份与迁移）

---

## 六、付费功能设计

### 6.1 免费功能

- ✅ 本地 Skills/Prompts 仓库
- ✅ 配置 2 个 AI API
- ✅ 多 AI 对比（最多 3 个）
- ✅ 基础对比展示

### 6.2 付费功能（订阅制）

| 功能 | 免费版 | 付费版 |
|------|--------|--------|
| AI API 数量 | 2 个 | 无限制 |
| 同时对比 AI 数 | 3 个 | 10 个 |
| 对比历史记录 | 10 条 | 无限制 |
| AI Agent 分析 | ❌ | ✅ |
| 自动 Prompt 优化 | ❌ | ✅ |
| 导出功能 | 基础 | 高级 |
| 技术支持 | ❌ | ✅ |

### 6.3 付费验证

- 🔑 使用 License Key 验证订阅
- 📅 支持月度/年度订阅
- 🔄 离线验证（不依赖服务端）

---

## 七、开发计划

### 7.1 第一阶段：基础功能

- [ ] 重构现有 Notes 为 Prompts 仓库
- [ ] 新增 Skills 仓库模块
- [ ] 本地存储重构
- [ ] API 配置模块

### 7.2 第二阶段：核心功能

- [ ] 多 AI 并行调用
- [ ] 同屏对比展示
- [ ] 差异高亮功能

### 7.3 第三阶段：增值功能

- [ ] AI Agent 分析模块
- [ ] 付费验证系统
- [ ] 高级导出功能

---

## 八、风险与挑战

| 风险 | 应对措施 |
|------|---------|
| API 调用成本 | 本地缓存+请求限制 |
| 数据安全 | 端到端加密，定期备份 |
| 兼容性问题 | 多平台测试 |
| 付费功能实现 | 简化验证流程 |

---

## 九、附录

### 9.1 技术栈

- **前端：** React 18 + TypeScript + Ant Design 5
- **桌面：** Electron 28
- **状态管理：** Zustand
- **构建：** Vite 5 + Electron Builder
- **存储：** 本地文件系统 + 加密

### 9.2 参考产品

- OpenAI Playground
- Anthropic Console
- Poe
- ChainForge

---

**文档结束**

---

以上是详细的 PRD 文档。你觉得有什么需要补充或修改的地方吗？我们可以根据这个文档开始开发。 🦞