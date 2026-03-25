import React, { useState, useEffect } from "react";
import { Typography, Card, Breadcrumb, Empty, message, Avatar, Space } from "antd";

interface BookmarkItem {
  name: string;
  url?: string;
  children?: BookmarkItem[];
}

interface TreeItem {
  name: string;
  children?: BookmarkItem[];
}

/**
 * 获取网站 Favicon
 */
const getFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
};

/**
 * 应用管理组件
 * 用于管理应用程序和插件，展示浏览器收藏夹
 */
const Apps: React.FC = () => {
  const [dataList, setDataList] = useState<BookmarkItem[]>([]);
  const [treeList, setTreeList] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 获取浏览器收藏夹数据
   * 支持 Microsoft Edge、Google Chrome 和 Safari (macOS)
   */
  const getBrowserBookmarks = async (): Promise<BookmarkItem[]> => {
    try {
      const bookmarks = await window.electronAPI.getBrowserBookmarks();
      return bookmarks;
    } catch (error) {
      console.error("Failed to get browser bookmarks:", error);
      return [];
    }
  };

  /**
   * 初始化数据
   */
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const bookmarks = await getBrowserBookmarks();
        const treeData: TreeItem[] = [{ name: "home", children: bookmarks }];
        setTreeList(treeData);
        setDataList(bookmarks);
      } catch (error) {
        message.error("加载收藏夹失败");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  /**
   * 处理卡片点击（有子集的情况）
   */
  const handleCardClick = (item: BookmarkItem) => {
    if (item.children && item.children.length > 0) {
      setTreeList([...treeList, { name: item.name, children: item.children }]);
      setDataList(item.children);
    }
  };

  /**
   * 处理面包屑点击
   */
  const handleBreadcrumbClick = (index: number) => {
    const newTreeList = treeList.slice(0, index + 1);
    setTreeList(newTreeList);
    setDataList(newTreeList[index].children || []);
  };

  /**
   * 打开浏览器访问网址
   */
  const handleOpenBrowser = async (item: BookmarkItem) => {
    if (item.url) {
      try {
        await window.electronAPI.openExternalUrl(item.url);
        message.success("正在打开浏览器...");
      } catch (error) {
        message.error("打开浏览器失败");
      }
    }
  };

  /**
   * 生成面包屑项
   */
  const breadcrumbItems = treeList.map((item, index) => ({
    title: (
      <span
        style={{
          color:
            index === treeList.length - 1
              ? "var(--color-primary)"
              : "var(--color-text-secondary)",
          cursor: "pointer",
          transition: "color var(--transition-fast)",
        }}
        onClick={() => handleBreadcrumbClick(index)}
      >
        {item.name}
      </span>
    ),
    key: index,
  }));

  return (
    <div className="content-section">
      <Breadcrumb
        items={breadcrumbItems}
        style={{ marginBottom: 16 }}
        separator={<span style={{ color: "var(--color-text-tertiary)" }}>/</span>}
      />

      {loading ? (
        <Card style={{ marginTop: 24 }}>
          <div className="skeleton" style={{ height: 100 }} />
        </Card>
      ) : dataList.length > 0 ? (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📁</span>
              <span>收藏夹</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-text-tertiary)",
                  fontWeight: "normal",
                }}
              >
                ({dataList.length} 项)
              </span>
            </div>
          }
          style={{
            marginTop: 8,
            height: "calc(100vh - 200px)",
            overflow: "hidden",
          }}
          className="card-hoverable"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
              paddingRight: 4,
              height: "100%",
              overflowY: "auto",
            }}
          >
            {dataList.map((item, index) => (
              <Card
                key={index}
                hoverable
                className="card-hoverable"
                style={{
                  height: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "var(--color-bg-base)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all 0.25s ease",
                }}
                onClick={() => {
                  if (item.children && item.children.length > 0) {
                    handleCardClick(item);
                  } else {
                    handleOpenBrowser(item);
                  }
                }}
                bodyStyle={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--space-sm)",
                }}
              >
                <Space
                  direction="vertical"
                  size={4}
                  align="center"
                  style={{ width: "100%" }}
                >
                  {item.children && item.children.length > 0 ? (
                    <Avatar
                      size={40}
                      style={{
                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        border: "2px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>📁</span>
                    </Avatar>
                  ) : item.url ? (
                    <Avatar
                      size={40}
                      src={getFaviconUrl(item.url)}
                      style={{
                        border: "2px solid var(--color-border)",
                        background: "var(--color-bg-elevated)",
                      }}
                      icon={
                        <span style={{ fontSize: 16, opacity: 0.5 }}>🔗</span>
                      }
                    />
                  ) : null}
                  <Typography.Paragraph
                    ellipsis={{ tooltip: item.name, rows: 2 }}
                    style={{
                      textAlign: "center",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                      padding: "0 4px",
                      margin: 0,
                      fontSize: 13,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {item.name}
                  </Typography.Paragraph>
                </Space>
              </Card>
            ))}
          </div>
        </Card>
      ) : (
        <Card style={{ marginTop: 24 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "var(--color-text-tertiary)" }}>
                暂无收藏夹数据
              </span>
            }
          />
        </Card>
      )}
    </div>
  );
};

export default Apps;