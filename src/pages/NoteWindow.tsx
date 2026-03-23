import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Input, Button, message, Layout, Space } from "antd";
import { CopyOutlined, SaveOutlined } from "@ant-design/icons";
import { useNoteStore } from "../store/noteStore";

const { TextArea } = Input;

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

const NoteWindow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notes, updateNote } = useNoteStore();
  const [note, setNote] = useState(notes.find((n) => n.id === id));
  const [content, setContent] = useState(note?.content || "");
  const [title, setTitle] = useState(note?.title || "");

  const handleCopy = () => {
    if (content) {
      window.electronAPI.writeClipboardText(content);
      message.success("已复制到剪贴板");
    }
  };

  const handleSave = () => {
    if (id) {
      updateNote(id, { title, content });
      message.success("保存成功");
    }
  };

  useEffect(() => {
    const currentNote = notes.find((n) => n.id === id);
    if (currentNote) {
      setNote(currentNote);
    }
  }, [id, notes]);

  // Auto save when content/title changes (debounced ideally, but here effect is simple)
  // Or just save on blur / unmount?
  // For simplicity, let's save on blur of inputs or just rely on user explicit save?
  // User asked for "no other operations on top right", implying removal of save button.
  // So we should auto-save.

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id && (title !== note?.title || content !== note?.content)) {
        updateNote(id, { title, content });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, id, updateNote, note]);

  if (!note) {
    return <div style={{ padding: 20 }}>便签不存在或已被删除</div>;
  }

  return (
    <Layout style={{ height: "100vh", background: "#fff" }}>
      <Layout.Content
        style={{
          padding: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{ marginBottom: "8px", display: "flex", alignItems: "center" }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            bordered={false}
            placeholder="无标题"
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              padding: 0,
              flex: 1,
            }}
          />
          <Space>
            <Button
              type="text"
              icon={<SaveOutlined />}
              onClick={handleSave}
              title="保存"
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              title="复制内容"
            />
          </Space>
        </div>

        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          bordered={false}
          style={{
            resize: "none",
            flex: 1,
            fontSize: "14px",
            padding: 0,
          }}
          placeholder="在此输入便签内容..."
        />
        {content && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              background: "#f5f5f5",
              borderRadius: "4px",
              maxHeight: "120px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {renderContentWithLinks(content)}
          </div>
        )}
        <div
          style={{
            textAlign: "right",
            color: "#999",
            fontSize: "12px",
            marginTop: "8px",
          }}
        >
          更新于: {note.updateTime}
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default NoteWindow;
