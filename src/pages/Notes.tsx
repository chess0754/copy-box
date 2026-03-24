import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input, Modal, List, Popconfirm, message, Tag, Select } from "antd";
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
          style={{ color: "#1677ff" }}
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

  return (
    <div className="content-section">
      <Card
        title="提示词管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            新建
          </Button>
        }
        style={{
          marginTop: 8,
          height: "calc(100vh - 200px)",
          overflow: "hidden",
        }}
      >
        {/* 搜索和筛选区域 */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
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

        <div style={{ height: "calc(100% - 80px)", overflowY: "auto", paddingRight: "10px" }}>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
            dataSource={filteredNotes}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  title={
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <RobotOutlined style={{ color: "#1890ff", marginRight: 4 }} />
                      {item.title}
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
                    >
                      打开
                    </Button>,
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      key="copy"
                      onClick={(e) => handleCopy(item.content, e)}
                    >
                      复制
                    </Button>,
                  ]}
                >
                  {item.category && (
                    <Tag color="blue" style={{ marginBottom: 8 }}>
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
                      color: "#666",
                    }}
                  >
                    {item.content ? (
                      renderContentWithLinks(item.content)
                    ) : (
                      <span style={{ color: "#ccc" }}>无内容...</span>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#999",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      v{item.version} · {item.updateTime}
                    </span>
                    {(item.history?.length || 0) > 0 && (
                      <Tag color="orange">{item.history?.length || 0} 个历史</Tag>
                    )}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      </Card>

      <Modal
        title="新建提示词"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        width={500}
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8 }}>标题</div>
          <Input
            placeholder="请输入标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8 }}>分类 (可选)</div>
          <Input
            placeholder="请输入分类"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>内容</div>
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