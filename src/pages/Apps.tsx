import React, { useState, useEffect } from "react";
import { Typography, Card, Breadcrumb, Empty, message, Avatar } from "antd";

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
    title: item.name,
    onClick: () => handleBreadcrumbClick(index),
  }));

  return (
    <div className="content-section">
      <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />

      {loading ? (
        <Card style={{ marginTop: 24 }}>
          <Typography.Text type="secondary">加载中...</Typography.Text>
        </Card>
      ) : dataList.length > 0 ? (
        <Card
          title=""
          style={{
            marginTop: 8,
            height: "calc(100vh - 200px)",
            overflow: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
              paddingRight: 4,
            }}
          >
            {dataList.map((item, index) => (
              <Card
                key={index}
                hoverable
                style={{
                  height: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() => {
                  console.log(item, "item");
                  if (item.children && item.children.length > 0) {
                    handleCardClick(item);
                  } else {
                    handleOpenBrowser(item);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {item.children && item.children.length > 0 ? (
                    <Avatar
                      size={32}
                      icon={<span style={{ fontSize: 20 }}>📁</span>}
                      style={{ marginBottom: 8 }}
                    />
                  ) : item.url ? (
                    <Avatar
                      size={32}
                      src={getFaviconUrl(item.url)}
                      style={{ marginBottom: 8 }}
                    />
                  ) : null}
                  <Typography.Paragraph
                    ellipsis={{ tooltip: item.name, rows: 2 }}
                    style={{
                      textAlign: "center",
                      lineHeight: "1.5",
                      wordBreak: "break-word",
                      padding: "0 8px",
                      margin: 0,
                    }}
                  >
                    {item.name}
                  </Typography.Paragraph>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ) : (
        <Card style={{ marginTop: 24 }}>
          <Empty description="暂无数据" />
        </Card>
      )}
    </div>
  );
};

export default Apps;
