import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input, Modal, List, Popconfirm, message, Tag, Select, Empty } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
  SearchOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNoteStore, NoteItem } from "../store/noteStore";

// URL 检测正则
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

// 将文本中的 URL 转换为可点击的链接
const renderContentWithLinks = (content: string) => {
  const parts = content.split(URL_REGEX);
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={index}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.openExternalUrl(part);
          }}
          style={{ color: "var(--color-primary)" }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const Notes: React.FC = () => {
  const { notes, addNote, deleteNote } = useNoteStore();

  // Storage event listener to sync state across windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "note-storage") {
        useNoteStore.persist.rehydrate();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>();
    notes.forEach((note) => {
      if (note.category) {
        cats.add(note.category);
      }
    });
    return Array.from(cats);
  }, [notes]);

  // 过滤后的笔记
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // 分类过滤
      if (filterCategory && note.category !== filterCategory) {
        return false;
      }
      // 搜索过滤
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          note.title.toLowerCase().includes(search) ||
          note.content.toLowerCase().includes(search) ||
          note.category?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [notes, filterCategory, searchText]);

  const handleCreate = () => {
    if (!newTitle.trim()) {
      message.warning("请输入标题");
      return;
    }
    const id = Date.now().toString();
    const newNote: NoteItem = {
      id,
      title: newTitle,
      content: newContent,
      type: "prompt",
      category: newCategory || undefined,
      tags: [],
      variables: [],
      usageCount: 0,
      version: 1,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      history: [],
    };
    addNote(newNote);
    setIsModalOpen(false);
    setNewTitle("");
    setNewContent("");
    setNewCategory("");
    message.success("提示词创建成功");
  };

  const handleOpenWindow = (id: string) => {
    window.electronAPI.createNoteWindow(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    message.success("已删除");
  };

  const handleCopy = (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.writeClipboardText(content);
    message.success("内容已复制");
  };

  // 随机颜色标签
  const tagColors = ["blue", "green", "orange", "purple", "red", "cyan"];
  const getTagColor = (index: number) => tagColors[index % tagColors.length];

  return (
    <div className="content-section">
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RobotOutlined style={{ color: "var(--color-primary)" }} />
            <span>提示词管理</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: "normal",
              }}
            >
              ({filteredNotes.length} 个)
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="btn-press"
          >
            新建
          </Button>
        }
        style={{
          marginTop: 8,
          height: "calc(100vh - 200px)",
          overflow: "hidden",
        }}
        className="card-hoverable"
      >
        {/* 搜索和筛选区域 */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Input
            placeholder="搜索标题、内容或分类..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="筛选分类"
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: 150 }}
            allowClear
            options={categories.map((cat) => ({ value: cat, label: cat }))}
          />
        </div>

        <div
          style={{
            height: "calc(100% - 80px)",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          {filteredNotes.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  暂无提示词，点击"新建"创建第一个提示词
                </span>
              }
              style={{ marginTop: 80 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
              >
                新建提示词
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
              dataSource={filteredNotes}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    className="card-hoverable"
                    style={{
                      background: "var(--color-bg-base)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      transition: "all 0.25s ease",
                    }}
                    title={
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontWeight: 600,
                        }}
                      >
                        <RobotOutlined
                          style={{
                            color: "var(--color-primary)",
                            marginRight: 8,
                          }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "calc(100% - 30px)",
                          }}
                        >
                          {item.title}
                        </span>
                      </span>
                    }
                    extra={
                      <Popconfirm
                        title="确定删除吗?"
                        onConfirm={(e) => handleDelete(item.id, e as any)}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    }
                    onClick={() => handleOpenWindow(item.id)}
                    actions={[
                      <Button
                        type="text"
                        icon={<ExportOutlined />}
                        key="open"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWindow(item.id);
                        }}
                        size="small"
                      >
                        打开
                      </Button>,
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        key="copy"
                        onClick={(e) => handleCopy(item.content, e)}
                        size="small"
                      >
                        复制
                      </Button>,
                    ]}
                  >
                    {item.category && (
                      <Tag
                        color={getTagColor(categories.indexOf(item.category))}
                        style={{ marginBottom: 8 }}
                      >
                        {item.category}
                      </Tag>
                    )}
                    <div
                      style={{
                        height: "80px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.content ? (
                        renderContentWithLinks(item.content)
                      ) : (
                        <span style={{ color: "var(--color-text-tertiary)" }}>
                          无内容...
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: "var(--space-sm)",
                        fontSize: "12px",
                        color: "var(--color-text-tertiary)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        <Tag
                          color="var(--color-primary)"
                          style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818CF8",
                            border: "none",
                          }}
                        >
                          v{item.version}
                        </Tag>
                      </span>
                      {(item.history?.length || 0) > 0 && (
                        <Tag
                          color="orange"
                          style={{
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "none",
                          }}
                        >
                          {item.history?.length || 0} 个历史
                        </Tag>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-tertiary)",
                        marginTop: "var(--space-xs)",
                      }}
                    >
                      {item.updateTime}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "var(--color-primary)" }} />
            新建提示词
          </div>
        }
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        width={500}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>
            标题
          </div>
          <Input
            placeholder="请输入标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>
            分类 (可选)
          </div>
          <Input
            placeholder="请输入分类"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>
            内容
          </div>
          <Input.TextArea
            placeholder="请输入内容"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Notes;