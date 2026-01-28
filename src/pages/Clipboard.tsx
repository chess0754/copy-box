import React, { useEffect, useRef, useState } from "react";
import {
  List,
  Button,
  Input,
  message,
  Card,
  Typography,
  Space,
  Image,
  // Breadcrumb,
  Popconfirm,
} from "antd";
import {
  CopyOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  FormOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useClipboardStore } from "../store/clipboardStore";
import { useNoteStore } from "../store/noteStore";

const { TextArea } = Input;
const { Text } = Typography;

const Clipboard: React.FC = () => {
  const { history, addItem, updateItem, deleteItem, clearHistory } =
    useClipboardStore();
  const { addNote } = useNoteStore();
  const lastClipboardContent = useRef<string>("");
  // Local state to manage editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    // Check clipboard every 1 second
    const intervalId = setInterval(() => {
      try {
        const item = window.electronAPI.readClipboard();

        if (item && item.content !== lastClipboardContent.current) {
          // Check if the item is already the first item (to avoid duplicate from manual copy)
          if (history.length > 0 && history[0].content === item.content) {
            lastClipboardContent.current = item.content;
            return;
          }

          addItem({
            id: Date.now().toString(),
            type: item.type as "text" | "image",
            content: item.content,
            time: new Date().toLocaleString(),
          });

          lastClipboardContent.current = item.content;
        }
      } catch (error) {
        console.error("Failed to read clipboard:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [history, addItem]);

  const handleCopy = (content: string, type: "text" | "image") => {
    window.electronAPI.writeClipboard({ type, content });
    lastClipboardContent.current = content; // Update ref to avoid auto-adding it back as "new" immediately
    message.success("已复制到剪贴板");
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    if (editingId === id) {
      setEditingId(null);
      setEditValue("");
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditValue(content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = (id: string) => {
    updateItem(id, editValue);
    setEditingId(null);
    setEditValue("");
    message.success("保存成功");
  };

  const handleCreateNote = (content: string) => {
    const id = Date.now().toString();
    // Truncate content for title
    const title =
      content.length > 20 ? content.substring(0, 20) + "..." : content;
    addNote({
      id,
      title,
      content,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
    });
    message.success("已创建便签");
    window.electronAPI.createNoteWindow(id);
  };

  const handleClearHistory = () => {
    clearHistory();
    message.success("剪贴板记录已清空");
  };

  return (
    <div className="content-section">
      <Card
        title="剪贴板记录"
        extra={
          history.length > 0 && (
            <Popconfirm
              title="确定清空所有记录吗?"
              onConfirm={handleClearHistory}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<ClearOutlined />}>
                清空
              </Button>
            </Popconfirm>
          )
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
            dataSource={history}
            renderItem={(item) => {
              const isEditing = editingId === item.id;
              const isImage = item.type === "image";

              return (
                <List.Item
                  actions={[
                    isEditing ? (
                      <Space>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={() => handleSave(item.id)}
                          size="small"
                          title="保存"
                        />
                        <Button
                          onClick={handleCancelEdit}
                          size="small"
                          title="取消"
                        >
                          取消
                        </Button>
                      </Space>
                    ) : (
                      <Space>
                        {!isImage && (
                          <>
                            <Button
                              icon={<FormOutlined />}
                              onClick={() => handleCreateNote(item.content)}
                              size="small"
                              title="转为便签"
                            />
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(item.id, item.content)}
                              size="small"
                              title="编辑"
                            />
                          </>
                        )}
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => handleCopy(item.content, item.type)}
                          size="small"
                          title="复制"
                        />
                        <Popconfirm
                          title="确定删除此记录吗?"
                          onConfirm={() => handleDelete(item.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            title="删除"
                          />
                        </Popconfirm>
                      </Space>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {item.time}
                      </Text>
                    }
                    description={
                      isEditing ? (
                        <TextArea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoSize={{ minRows: 2, maxRows: 6 }}
                        />
                      ) : isImage ? (
                        <div style={{ maxHeight: "200px", overflow: "hidden" }}>
                          <Image
                            src={item.content}
                            alt="clipboard image"
                            height={150}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            maxHeight: "100px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {item.content}
                        </div>
                      )
                    }
                  />
                </List.Item>
              );
            }}
          />
          {history.length === 0 && (
            <div
              style={{ textAlign: "center", marginTop: "50px", color: "#999" }}
            >
              暂无剪贴板记录，请尝试复制一些文本...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Clipboard;
