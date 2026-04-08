# Copy Box

多功能桌面工具箱，集成了粘贴板管理、提示词管理、AI 对话、API 管理等功能，基于 Electron、React、TypeScript 和 Ant Design 构建。

## 项目简介

Copy Box 是一款功能强大的桌面应用，旨在提高用户的工作效率。通过集成多种实用工具，用户可以更方便地管理剪贴板历史、AI 提示词、技能配置以及 API 密钥，同时提供内置的 AI 对话功能。

## 技术栈

- **Electron 28** - 跨平台桌面应用框架
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Ant Design 5** - 企业级 UI 组件库
- **Vite 5** - 快速的构建工具
- **Zustand** - 轻量级状态管理
- **React Router DOM** - 路由管理
- **LangChain** - AI 应用开发框架
- **OpenAI/Anthropic SDK** - AI 模型接口
- **react-markdown** - Markdown 渲染
- **diff** - 文本差异对比

## 项目结构

```
copy-box/
├── electron/              # Electron 主进程和预加载脚本
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本（IPC 桥接）
├── src/                  # React 前端应用
│   ├── components/       # 可复用组件
│   │   └── DiffViewer.tsx  # 差异对比组件
│   ├── pages/            # 页面组件
│   │   ├── Clipboard.tsx   # 粘贴板管理
│   │   ├── Notes.tsx       # 提示词管理
│   │   ├── Skills.tsx      # 技能管理
│   │   ├── Apis.tsx        # API 管理
│   │   ├── Chat.tsx        # AI 对话
│   │   ├── Apps.tsx        # 收藏夹
│   │   └── NoteWindow.tsx  # 笔记独立窗口
│   ├── router/           # 路由配置
│   │   └── index.tsx
│   ├── services/         # 服务层
│   │   └── beautifyService.ts  # 代码美化服务
│   ├── store/            # 状态管理
│   │   ├── clipboardStore.ts  # 粘贴板状态
│   │   ├── noteStore.ts       # 提示词状态
│   │   ├── skillStore.ts      # 技能状态
│   │   ├── apiStore.ts        # API 状态
│   │   ├── chatStore.ts       # 聊天状态
│   │   └── appStore.ts        # 应用全局状态
│   ├── App.tsx           # 主应用组件
│   ├── App.css           # 应用样式
│   ├── main.tsx          # React 入口
│   └── index.css         # 全局样式
├── scripts/              # 构建脚本
│   └── clean-native.js   # 清理原生模块脚本
├── public/               # 静态资源
├── dist-electron/        # Electron 构建输出（自动生成）
├── dist/                 # React 构建输出（自动生成）
├── release/              # 应用打包输出（自动生成）
├── package.json          # 项目配置和依赖
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 构建配置
└── index.html            # HTML 模板
```

## 安装依赖

```bash
npm install
```

## 开发模式

启动开发服务器（仅 React）：

```bash
npm run dev
```

启动完整的 Electron 应用（开发模式）：

```bash
npm run electron:dev
```

## 构建

构建 React 应用：

```bash
npm run build
```

构建 Electron 应用（Windows）：

```bash
npm run electron:build:win
```

构建 Electron 应用（macOS）：

```bash
npm run electron:build:mac
```

构建 Electron 应用（Linux）：

```bash
npm run electron:build:linux
```

## 功能特性

### 核心功能

- **粘贴板管理** - 剪贴板历史记录管理，支持快速复制和搜索
- **提示词管理** - 提示词的创建、编辑、分类和管理
- **技能管理** - 自定义技能配置和管理
- **API 管理** - API 密钥和配置管理，支持 OpenAI 和 Anthropic
- **AI 对话** - 集成 LangChain 的智能对话功能，支持多种 AI 模型
- **收藏夹** - 应用和资源的快速收藏与访问

### 技术特性

- 窗口控制（最小化、最大化、关闭）
- IPC 通信（主进程与渲染进程）
- Ant Design UI 组件集成
- 响应式布局设计
- TypeScript 类型安全
- 热模块替换（HMR）
- Markdown 渲染支持
- 代码差异对比功能
- 状态持久化存储
- 跨平台支持（Windows、macOS、Linux）

## 主要页面

- **粘贴板** - 剪贴板历史记录管理
- **提示词** - 提示词的创建和管理
- **技能** - 自定义技能配置
- **API** - API 密钥和配置管理
- **AI 对话** - 智能对话界面
- **收藏夹** - 快速访问收藏的应用和资源

## 开发说明

### 添加新的 IPC 通信

1. 在 `electron/main.ts` 中添加 IPC 处理器：

```typescript
ipcMain.handle('your-handler', async (event, arg) => {
  // 处理逻辑
  return result
})
```

1. 在 `electron/preload.ts` 中暴露 API：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  yourMethod: (arg) => ipcRenderer.invoke('your-handler', arg)
})
```

1. 在 React 组件中使用：

```typescript
const result = await window.electronAPI.yourMethod(arg)
```

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `src/router/index.tsx` 中添加路由配置
3. 在 `menuItems` 中添加菜单项
4. 如需状态管理，在 `src/store/` 中创建对应的 store

### 状态管理

项目使用 Zustand 进行状态管理，每个功能模块都有独立的 store：

- `clipboardStore.ts` - 粘贴板状态
- `noteStore.ts` - 提示词状态
- `skillStore.ts` - 技能状态
- `apiStore.ts` - API 配置状态
- `chatStore.ts` - 聊天状态

### AI 功能集成

项目集成了 LangChain 和多种 AI 模型：

- 支持 OpenAI 和 Anthropic API
- 通过 `aiChatStream` 方法实现流式对话
- 配置存储在 `apiStore` 中

## 许可证

MIT
