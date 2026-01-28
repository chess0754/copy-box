import { createHashRouter, Outlet, Navigate } from "react-router-dom";
import Clipboard from "../pages/Clipboard";
import Apps from "../pages/Apps";
import Notes from "../pages/Notes";
import NoteWindow from "../pages/NoteWindow";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  CopyOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

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
      label: "便签",
    },
    {
      key: "/apps",
      icon: <AppstoreOutlined />,
      label: "应用",
    },
  ];

  /**
   * 获取当前选中的菜单项
   */
  const selectedKey =
    location.pathname === "/" ? "/clipboard" : location.pathname;

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          height: 64,
          boxShadow: "0 2px 8px #f0f1f2",
          zIndex: 1,
        }}
      >
        <div
          className="logo"
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginRight: "40px",
            color: "#1677ff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span role="img" aria-label="logo" style={{ fontSize: "24px" }}>
            ✨
          </span>
          Magic React
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: "none",
            fontSize: "16px",
          }}
        />
      </Header>
      <Content
        style={{
          padding: "24px",
          overflow: "auto",
          height: "calc(100vh - 200px)",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: "100%",
            borderRadius: 8,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

/**
 * 应用路由配置
 * 使用 Hash 路由模式以兼容 Electron 环境
 */
export const router = createHashRouter([
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
