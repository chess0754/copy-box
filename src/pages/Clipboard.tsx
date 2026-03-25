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
  Popconfirm,
  Empty,
} from "antd";
import {
  CopyOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  ClearOutlined,
  RobotOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import { useClipboardStore } from "../store/clipboardStore";
import { useNoteStore } from "../store/noteStore";

const { TextArea } = Input;
const { Text } = Typography;

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
    lastClipboardContent.current = content;
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
    const title =
      content.length > 20 ? content.substring(0, 20) + "..." : content;
    addNote({
      id,
      title,
      content,
      type: "prompt",
      version: 1,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      history: [],
    });
    message.success("已创建提示词");
    window.electronAPI.createNoteWindow(id);
  };

  const handleClearHistory = () => {
    clearHistory();
    message.success("剪贴板记录已清空");
  };

  return (
    <div className="content-section">
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScissorOutlined style={{ color: "var(--color-primary)" }} />
            <span>剪贴板记录</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: "normal",
              }}
            >
              ({history.length} 条)
            </span>
          </div>
        }
        extra={
          history.length > 0 && (
            <Popconfirm
              title="确定清空所有记录吗?"
              onConfirm={handleClearHistory}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<ClearOutlined />}>
                清空
              </Button>
            </Popconfirm>
          )
        }
        style={{
          marginTop: 8,
          height: "calc(100vh - 200px)",
          overflow: "hidden",
        }}
        className="card-hoverable"
      >
        <div
          style={{ height: "100%", overflowY: "auto", paddingRight: "10px" }}
        >
          {history.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  暂无剪贴板记录，请尝试复制一些文本...
                </span>
              }
              style={{ marginTop: 80 }}
            />
          ) : (
            <List
              dataSource={history}
              renderItem={(item) => {
                const isEditing = editingId === item.id;
                const isImage = item.type === "image";

                return (
                  <List.Item
                    className="list-item-hover"
                    style={{
                      padding: "var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "var(--space-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-base)",
                    }}
                    actions={[
                      isEditing ? (
                        <Space key="edit-actions">
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => handleSave(item.id)}
                            size="small"
                            title="保存"
                            className="btn-press"
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
                        <Space key="normal-actions">
                          {!isImage && (
                            <>
                              <Button
                                icon={<RobotOutlined />}
                                onClick={() => handleCreateNote(item.content)}
                                size="small"
                                title="转为提示词"
                              />
                              <Button
                                icon={<EditOutlined />}
                                onClick={() =>
                                  handleEdit(item.id, item.content)
                                }
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
                            style={{
                              background: "rgba(99, 102, 241, 0.1)",
                              borderColor: "transparent",
                              color: "#818CF8",
                            }}
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
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: isImage
                                ? "var(--color-info)"
                                : "var(--color-success)",
                              marginRight: 6,
                            }}
                          />
                          {item.time}
                        </Text>
                      }
                      description={
                        isEditing ? (
                          <TextArea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoSize={{ minRows: 2, maxRows: 6 }}
                            style={{
                              background: "var(--color-bg-base)",
                              borderColor: "var(--color-border)",
                            }}
                          />
                        ) : isImage ? (
                          <div
                            style={{
                              maxHeight: "200px",
                              overflow: "hidden",
                              borderRadius: "var(--radius-md)",
                            }}
                          >
                            <Image
                              src={item.content}
                              alt="clipboard image"
                              height={150}
                              style={{ objectFit: "contain" }}
                              preview
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
                              color: "var(--color-text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            {renderContentWithLinks(item.content)}
                          </div>
                        )
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Clipboard;