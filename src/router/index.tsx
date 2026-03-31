import { createHashRouter, Outlet, Navigate } from "react-router-dom";
import Clipboard from "../pages/Clipboard";
import Apps from "../pages/Apps";
import Notes from "../pages/Notes";
import NoteWindow from "../pages/NoteWindow";
import Skills from "../pages/Skills";
import Apis from "../pages/Apis";
import Chat from "../pages/Chat";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  CopyOutlined,
  FormOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";

const { Content, Header } = Layout;

/**
 * 应用布局组件
 * 包含顶部菜单和内容区域
 */
const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 菜单项配置
   */
  const menuItems = [
    {
      key: "/clipboard",
      icon: <CopyOutlined />,
      label: "粘贴板",
    },
    {
      key: "/notes",
      icon: <FormOutlined />,
      label: "提示词",
    },
    {
      key: "/skills",
      icon: <ThunderboltOutlined />,
      label: "技能",
    },
    {
      key: "/apis",
      icon: <ApiOutlined />,
      label: "API",
    },
    {
      key: "/chat",
      icon: <MessageOutlined />,
      label: "AI 对话",
    },
    {
      key: "/apps",
      icon: <AppstoreOutlined />,
      label: "收藏夹",
    },
  ];

  /**
   * 获取当前选中的菜单项
   */
  const selectedKey =
    location.pathname === "/" ? "/clipboard" : location.pathname;

  return (
    <Layout style={{ height: "100vh", background: "var(--color-bg-base)" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          background: "var(--color-bg-base)",
          borderBottom: "1px solid var(--color-border)",
          height: 64,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 顶部渐变装饰条 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)",
            opacity: 0.8,
          }}
        />

        <div
          className="logo"
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginRight: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              borderRadius: "var(--radius-md)",
              fontSize: "18px",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
            }}
          >
            📋
          </div>
          <span
            style={{
              background: "linear-gradient(135deg, #F1F5F9 0%, #6366F1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Copy Box
          </span>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="app-menu"
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: "none",
            fontSize: "16px",
            background: "transparent",
          }}
        />
      </Header>
      <Content
        style={{
          padding: "var(--space-lg)",
          overflow: "auto",
          height: "calc(100vh - 64px)",
          background: "transparent",
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};

/**
 * 应用路由配置
 * 使用 Hash 路由模式以兼容 Electron 环境
 */
export const router = createHashRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/clipboard" replace />,
      },
      {
        path: "clipboard",
        element: <Clipboard />,
      },
      {
        path: "notes",
        element: <Notes />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "skills",
        element: <Skills />,
      },
      {
        path: "apis",
        element: <Apis />,
      },
      {
        path: "apps",
        element: <Apps />,
      },
    ],
  },
  {
    path: "/note-window/:id",
    element: <NoteWindow />,
  },
]);
