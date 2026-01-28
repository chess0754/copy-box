# Magic React - Electron + React + TypeScript + Ant Design

一个现代化的桌面应用程序模板，基于 Electron、React、TypeScript 和 Ant Design 构建。

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Ant Design 5** - 企业级 UI 组件库
- **Vite** - 快速的构建工具

## 项目结构

```
magic-react/
├── electron/              # Electron 主进程和预加载脚本
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本（IPC 桥接）
├── src/                  # React 前端应用
│   ├── App.tsx           # 主应用组件
│   ├── App.css           # 应用样式
│   ├── main.tsx          # React 入口
│   └── index.css         # 全局样式
├── public/               # 静态资源
├── dist-electron/        # Electron 构建输出（自动生成）
├── dist/                 # React 构建输出（自动生成）
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

- 窗口控制（最小化、最大化、关闭）
- IPC 通信（主进程与渲染进程）
- Ant Design UI 组件集成
- 响应式布局设计
- TypeScript 类型安全
- 热模块替换（HMR）

## 主要页面

- **首页** - 应用概览和统计信息
- **仪表盘** - 数据可视化面板
- **应用** - 应用管理
- **设置** - 应用设置
- **关于** - 应用信息

## 开发说明

### 添加新的 IPC 通信

1. 在 `electron/main.ts` 中添加 IPC 处理器：
```typescript
ipcMain.handle('your-handler', async (event, arg) => {
  // 处理逻辑
  return result
})
```

2. 在 `electron/preload.ts` 中暴露 API：
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  yourMethod: (arg) => ipcRenderer.invoke('your-handler', arg)
})
```

3. 在 React 组件中使用：
```typescript
const result = await window.electronAPI.yourMethod(arg)
```

### 添加新页面

1. 在 `src/App.tsx` 的 `menuItems` 中添加菜单项
2. 在 `renderContent` 函数中添加对应的渲染逻辑

## 许可证

MIT
