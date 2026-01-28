import React, { useState, useEffect } from "react";
import { Card, Button, Input, Modal, List, Popconfirm, message } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useNoteStore, NoteItem } from "../store/noteStore";

const Notes: React.FC = () => {
  const { notes, addNote, deleteNote } = useNoteStore();

  // Storage event listener to sync state across windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "note-storage") {
        // Zustand persist middleware handles hydration, but we might need to force re-render or reload
        // Actually, zustand's persist middleware with createJSONStorage(() => localStorage)
        // should automatically listen to storage events if configured correctly or we might need to reload manually.
        // However, Zustand persist doesn't automatically sync across tabs/windows by default in v4 without extra config or listeners.
        // Let's rely on useNoteStore.persist.rehydrate() if available or just force a reload of data.
        useNoteStore.persist.rehydrate();
      }
    };

    // Also poll for changes because storage event only fires if change happened in ANOTHER window
    // But here we want to see changes from the note window.
    // Since note window is a separate renderer process (webview/window), it shares localStorage (if same domain)
    // and writing to it there SHOULD fire storage event here.

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

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
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
    };
    addNote(newNote);
    setIsModalOpen(false);
    setNewTitle("");
    setNewContent("");
    message.success("便签创建成功");
    // Optional: Auto open window?
    // window.electronAPI.createNoteWindow(id);
  };

  const handleOpenWindow = (id: string) => {
    window.electronAPI.createNoteWindow(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    deleteNote(id);
    message.success("便签已删除");
  };

  const handleCopy = (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.writeClipboardText(content);
    message.success("内容已复制");
  };

  return (
    <div className="content-section">
      <Card
        title="便签"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            新建便签
          </Button>
        }
        style={{
          marginTop: 8,
          height: "calc(100vh - 200px)",
          overflow: "auto",
        }}
      >
        <div
          style={{ height: "100%", overflowY: "auto", paddingRight: "10px" }}
        >
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
            dataSource={notes}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  title={item.title}
                  extra={
                    <Popconfirm
                      title="确定删除此便签吗?"
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
                  <div
                    style={{
                      height: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      color: "#666",
                    }}
                  >
                    {item.content || (
                      <span style={{ color: "#ccc" }}>无内容...</span>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    {item.updateTime}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      </Card>

      <Modal
        title="新建便签"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
      >
        <div style={{ marginBottom: "16px" }}>
          <Input
            placeholder="标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <div>
          <Input.TextArea
            placeholder="内容"
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
