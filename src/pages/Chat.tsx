import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Button,
  Input,
  List,
  message,
  Empty,
  Space,
  Typography,
  Popconfirm,
  Select,
  Drawer,
  Tag,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  ClearOutlined,
  MessageOutlined,
  SettingOutlined,
  CopyOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useChatStore, ChatMessage } from "../store/chatStore";
import { useApiStore } from "../store/apiStore";
import ReactMarkdown from "react-markdown";

const { TextArea } = Input;
const { Text } = Typography;

const Chat: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    isGenerating,
    createSession,
    deleteSession,
    setActiveSession,
    addMessage,
    updateMessage,
    setGenerating,
    updateSessionTitle,
    clearSessionMessages,
    getSessionById,
  } = useChatStore();

  const { configs, activeConfigId, getConfigById } = useApiStore();
  
  const [inputValue, setInputValue] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("你是一个有帮助的AI助手。");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const activeSession = activeSessionId ? getSessionById(activeSessionId) : null;
  const activeApiConfig = selectedApiId 
    ? getConfigById(selectedApiId) 
    : activeConfigId 
      ? getConfigById(activeConfigId) 
      : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, [activeSessionId]);

  const handleCreateSession = () => {
    const id = createSession(selectedApiId || activeConfigId || undefined);
    setActiveSession(id);
    message.success("新对话已创建");
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    message.success("对话已删除");
  };

  const handleClearMessages = () => {
    if (activeSessionId) {
      clearSessionMessages(activeSessionId);
      message.success("消息已清空");
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success("已复制到剪贴板");
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;
    
    if (!activeApiConfig) {
      message.warning("请先选择或配置 API");
      return;
    }

    if (!activeSessionId) {
      handleCreateSession();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleString(),
    };

    addMessage(activeSessionId, userMessage);
    setInputValue("");
    setGenerating(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleString(),
      isStreaming: true,
    };

    addMessage(activeSessionId, assistantMessage);

    const messages = [...(activeSession?.messages || []), userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullContent = "";

    cleanupRef.current = window.electronAPI.onAiChatChunk((data) => {
      if (data.error) {
        updateMessage(activeSessionId, assistantMessageId, `错误: ${data.error}`);
        return;
      }

      if (data.content) {
        fullContent += data.content;
        updateMessage(activeSessionId, assistantMessageId, fullContent);
      }
    });

    try {
      const result = await window.electronAPI.aiChatStream({
        config: {
          provider: activeApiConfig.provider,
          apiKey: activeApiConfig.apiKey,
          baseUrl: activeApiConfig.baseUrl,
          model: activeApiConfig.model,
          azureDeployment: activeApiConfig.azureDeployment,
          azureApiVersion: activeApiConfig.azureApiVersion,
        },
        messages,
        systemPrompt,
      });
      
      // 确保流式响应结束后设置 generating 为 false
      setGenerating(false);
      
      // 清理监听器
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // 如果没有收到任何内容，显示错误
      if (!result.success) {
        updateMessage(activeSessionId, assistantMessageId, `错误: ${result.error || "请求失败"}`);
      }
      
      // 更新会话标题
      if (result.success && fullContent) {
        if (activeSession?.messages.length === 0) {
          const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : "");
          updateSessionTitle(activeSessionId, title);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "发送失败";
      updateMessage(activeSessionId, assistantMessageId, `错误: ${errorMessage}`);
      setGenerating(false);
      
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  };

  const handleStopGeneration = async () => {
    await window.electronAPI.aiChatStop();
    setGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const apiOptions = useMemo(() => {
    return configs
      .filter((c) => c.enabled)
      .map((c) => ({
        value: c.id,
        label: `${c.name} (${c.model})`,
      }));
  }, [configs]);

  return (
    <div className="content-section" style={{ display: "flex", height: "calc(100vh - 200px)", gap: 16 }}>
      <Card
        style={{ width: 260, overflow: "hidden" }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageOutlined style={{ color: "var(--color-primary)" }} />
            <span>对话列表</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={handleCreateSession}
            className="btn-press"
          />
        }
        styles={{ body: { padding: 0, height: "calc(100% - 57px)", overflowY: "auto" } }}
      >
        {sessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无对话"
            style={{ marginTop: 60 }}
          />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(item) => (
              <List.Item
                onClick={() => setActiveSession(item.id)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: activeSessionId === item.id ? "var(--color-primary-bg)" : "transparent",
                  borderLeft: activeSessionId === item.id ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
                    {item.messages.length} 条消息
                  </div>
                </div>
                <Popconfirm
                  title="确定删除此对话?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteSession(item.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageOutlined style={{ color: "var(--color-primary)" }} />
              <span>{activeSession?.title || "AI 对话"}</span>
              {activeApiConfig && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {activeApiConfig.name}
                </Tag>
              )}
            </div>
            <Space>
              <Select
                placeholder="选择 API"
                value={selectedApiId || activeConfigId}
                onChange={setSelectedApiId}
                options={apiOptions}
                style={{ width: 180 }}
                allowClear
              />
              <Tooltip title="设置">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettings(true)}
                />
              </Tooltip>
              <Popconfirm
                title="确定清空所有消息?"
                onConfirm={handleClearMessages}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" icon={<ClearOutlined />} disabled={!activeSessionId} />
              </Popconfirm>
            </Space>
          </div>
        }
        styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" } }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {!activeSession || activeSession.messages.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="开始新对话"
              style={{ marginTop: 100 }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background:
                        msg.role === "user"
                          ? "var(--color-primary)"
                          : "var(--color-bg-base)",
                      color: msg.role === "user" ? "#fff" : "var(--color-text)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content || (msg.isStreaming ? "思考中..." : "")}</ReactMarkdown>
                      </div>
                    ) : (
                      <Text style={{ color: "inherit", whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && !msg.isStreaming && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyMessage(msg.content)}
                        style={{ padding: "0 4px", height: "auto" }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-bg-card)",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
              disabled={isGenerating}
            />
            {isGenerating ? (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={handleStopGeneration}
                className="btn-press"
              >
                停止
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !activeApiConfig}
                className="btn-press"
              >
                发送
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Drawer
        title="对话设置"
        placement="right"
        open={showSettings}
        onClose={() => setShowSettings(false)}
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>系统提示词</div>
          <TextArea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="设置 AI 的角色和行为..."
            rows={6}
          />
        </div>
        <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
          提示: 系统提示词用于设定 AI 的角色和行为方式。例如: "你是一个专业的编程助手" 或 "你是一个友好的客服代表"。
        </div>
      </Drawer>
    </div>
  );
};

export default Chat;
