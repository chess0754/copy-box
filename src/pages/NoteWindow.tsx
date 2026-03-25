import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Input, Button, message, Layout, Space, Drawer, List, Tag, Radio, Empty, Checkbox, Modal, Typography } from "antd";
import {
  CopyOutlined,
  HistoryOutlined,
  SwapOutlined,
  RollbackOutlined,
  RobotOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNoteStore, NoteItem, NoteHistory } from "../store/noteStore";
import DiffViewer from "../components/DiffViewer";

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

const NoteWindow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notes, updateNote, getNoteById, revertToVersion } = useNoteStore();
  const [note, setNote] = useState<NoteItem | undefined>(() =>
    id ? getNoteById(id) : undefined
  );
  const [content, setContent] = useState(note?.content || "");
  const [title, setTitle] = useState(note?.title || "");
  const [category, setCategory] = useState(note?.category || "");
  const [historyVisible, setHistoryVisible] = useState(false);
  const [diffMode, setDiffMode] = useState<"inline" | "split">("split");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  // 保存确认相关
  const [hasChanges, setHasChanges] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [pendingContent, setPendingContent] = useState<{ title: string; content: string; category: string } | null>(null);

  // 回退确认相关
  const [revertModalVisible, setRevertModalVisible] = useState(false);
  const [revertHistoryId, setRevertHistoryId] = useState<string | null>(null);

  // 保存按钮点击
  const handleSaveClick = () => {
    if (!id) return;
    setPendingContent({ title, content, category });
    setSaveModalVisible(true);
  };

  const confirmSave = () => {
    if (pendingContent && id) {
      updateNote(id, {
        title: pendingContent.title,
        content: pendingContent.content,
        category: pendingContent.category || undefined,
      });
      setHasChanges(false);
      setSaveModalVisible(false);
      setPendingContent(null);
      message.success("保存成功");
    }
  };

  // 回退功能
  const handleRevertClick = (historyId: string) => {
    setRevertHistoryId(historyId);
    setRevertModalVisible(true);
  };

  const confirmRevert = () => {
    if (revertHistoryId && id) {
      revertToVersion(id, revertHistoryId);
      message.success("已回退到指定版本");
      setRevertModalVisible(false);
      setRevertHistoryId(null);
      setHistoryVisible(false);
    }
  };

  // 同步 note 数据
  useEffect(() => {
    const currentNote = id ? getNoteById(id) : undefined;
    if (currentNote) {
      setNote(currentNote);
      if (!compareMode) {
        setContent(currentNote.content);
        setTitle(currentNote.title);
        setCategory(currentNote.category || "");
        setHasChanges(false);
      }
    }
  }, [id, notes, getNoteById, compareMode]);

  // 检测变更
  useEffect(() => {
    if (!note) return;
    const changed = title !== note.title || content !== note.content || category !== (note.category || "");
    setHasChanges(changed);
  }, [title, content, category, note]);

  const handleCopy = () => {
    if (content) {
      window.electronAPI.writeClipboardText(content);
      message.success("已复制到剪贴板");
    }
  };

  // 获取历史记录（当前和所有历史版本）
  const allVersions = useMemo(() => {
    if (!note) return [];
    const currentVersion: NoteHistory = {
      id: "current",
      content: note.content,
      title: note.title,
      updateTime: note.updateTime,
    };
    return [currentVersion, ...(note.history || [])];
  }, [note]);

  // 处理版本选择
  const handleVersionSelect = (versionId: string, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionId]);
      } else {
        setSelectedVersions([selectedVersions[1], versionId]);
      }
    } else {
      setSelectedVersions(selectedVersions.filter((v) => v !== versionId));
    }
  };

  // 开始对比
  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setCompareMode(true);
      setHistoryVisible(false);
    } else {
      message.warning("请选择两个版本进行对比");
    }
  };

  const getVersionContent = (versionId: string): NoteHistory | undefined => {
    if (!note) return undefined;
    if (versionId === "current") {
      return {
        id: "current",
        content: note.content,
        title: note.title,
        updateTime: note.updateTime,
      };
    }
    return (note.history || []).find((h) => h.id === versionId);
  };

  if (!note) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--color-text-tertiary)",
        }}
      >
        <Empty description="内容不存在或已被删除" />
      </div>
    );
  }

  // 对比模式视图
  if (compareMode && selectedVersions.length === 2) {
    const fromVersion = getVersionContent(selectedVersions[0]);
    const toVersion = getVersionContent(selectedVersions[1]);

    if (!fromVersion || !toVersion) {
      return (
        <div style={{ padding: 20, color: "var(--color-text-tertiary)" }}>
          版本不存在
        </div>
      );
    }

    // 排序：早的版本作为旧版本
    const sorted = [fromVersion, toVersion].sort(
      (a, b) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime()
    );
    const oldVersion = sorted[0];
    const newVersion = sorted[1];

    return (
      <Layout style={{ height: "100vh", background: "var(--color-bg-base)" }}>
        <Layout.Header
          style={{
            background: "var(--color-bg-elevated)",
            padding: "0 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setCompareMode(false)}
              style={{ color: "var(--color-text-secondary)" }}
            >
              返回
            </Button>
            <span style={{ fontSize: 16, fontWeight: "bold", color: "var(--color-text-primary)" }}>
              差异对比
            </span>
          </Space>
          <Space>
            <Radio.Group
              value={diffMode}
              onChange={(e) => setDiffMode(e.target.value)}
              optionType="button"
              size="small"
            >
              <Radio.Button value="inline">文字差异</Radio.Button>
              <Radio.Button value="split">并排对比</Radio.Button>
            </Radio.Group>
          </Space>
        </Layout.Header>
        <Layout.Content style={{ padding: 16, overflow: "auto" }}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                marginBottom: 8,
                color: "var(--color-text-secondary)",
                fontSize: 13,
              }}
            >
              对比: {oldVersion.updateTime} → {newVersion.updateTime}
            </div>
          </div>
          <DiffViewer
            oldText={oldVersion.content}
            newText={newVersion.content}
            mode={diffMode}
          />
        </Layout.Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: "100vh", background: "var(--color-bg-base)" }}>
      <Layout.Content
        style={{
          padding: "var(--space-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 顶部标题栏 */}
        <div style={{ marginBottom: 12 }}>
          <Space size="middle" style={{ width: "100%", flexWrap: "wrap" }}>
            {/* 类型显示 */}
            <Tag
              icon={<RobotOutlined />}
              style={{
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818CF8",
                border: "none",
                borderRadius: "var(--radius-sm)",
              }}
            >
              提示词 v{note.version}
            </Tag>

            {/* 分类输入 */}
            <Input
              placeholder="分类 (可选)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: 120 }}
              size="small"
            />

            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryVisible(true)}
              style={{ color: "var(--color-text-secondary)" }}
            >
              历史 ({note.history?.length || 0})
            </Button>

            {hasChanges && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveClick}
                className="btn-press"
              >
                保存
              </Button>
            )}

            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{ color: "var(--color-text-secondary)" }}
            >
              复制
            </Button>
          </Space>
        </div>

        {/* 标题输入 */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          bordered={false}
          placeholder="无标题"
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            padding: 0,
            marginBottom: 8,
            color: "var(--color-text-primary)",
            background: "transparent",
          }}
        />

        {/* 内容编辑 */}
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          bordered={false}
          style={{
            resize: "none",
            flex: 1,
            fontSize: "14px",
            padding: 0,
            color: "var(--color-text-primary)",
            background: "transparent",
            lineHeight: 1.8,
          }}
          placeholder="在此输入内容..."
        />

        {/* 内容预览 */}
        {content && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              maxHeight: "120px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              border: "1px solid var(--color-border)",
            }}
          >
            <Text style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
              {renderContentWithLinks(content)}
            </Text>
          </div>
        )}

        {/* 底部信息 */}
        <div
          style={{
            textAlign: "right",
            color: "var(--color-text-tertiary)",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          更新于: {note.updateTime}
          {hasChanges && (
            <span style={{ color: "var(--color-warning)", marginLeft: 8 }}>
              · 未保存
            </span>
          )}
        </div>
      </Layout.Content>

      {/* 历史记录抽屉 */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HistoryOutlined style={{ color: "var(--color-primary)" }} />
            历史记录
          </div>
        }
        placement="right"
        width={400}
        open={historyVisible}
        onClose={() => {
          setHistoryVisible(false);
          setSelectedVersions([]);
        }}
        extra={
          selectedVersions.length === 2 ? (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={handleCompare}
            >
              对比
            </Button>
          ) : null
        }
      >
        {allVersions.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <>
            <div
              style={{
                marginBottom: 16,
                color: "var(--color-text-secondary)",
                fontSize: 12,
              }}
            >
              选择两个版本进行对比 (已选 {selectedVersions.length}/2)
            </div>
            <List
              size="small"
              dataSource={allVersions}
              renderItem={(item, index) => (
                <List.Item
                  className="list-item-hover"
                  style={{
                    cursor: "pointer",
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "var(--space-xs)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)",
                  }}
                  onClick={() =>
                    handleVersionSelect(
                      item.id,
                      !selectedVersions.includes(item.id)
                    )
                  }
                  actions={
                    index > 0
                      ? [
                          <Button
                            key="revert"
                            type="link"
                            size="small"
                            icon={<RollbackOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevertClick(item.id);
                            }}
                            style={{ color: "var(--color-warning)" }}
                          >
                            回退
                          </Button>,
                        ]
                      : undefined
                  }
                >
                  <div style={{ width: "100%" }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Checkbox
                        checked={selectedVersions.includes(item.id)}
                        onChange={(e) =>
                          handleVersionSelect(item.id, e.target.checked)
                        }
                      >
                        {index === 0 ? (
                          <Tag
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34D399",
                              border: "none",
                            }}
                          >
                            当前
                          </Tag>
                        ) : (
                          <Tag>历史 {allVersions.length - index}</Tag>
                        )}
                      </Checkbox>
                      <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
                        {item.updateTime}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title || "无标题"}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>

      {/* 保存确认弹窗 */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveOutlined style={{ color: "var(--color-primary)" }} />
            确认保存
          </div>
        }
        open={saveModalVisible}
        onOk={confirmSave}
        onCancel={() => {
          setSaveModalVisible(false);
          setPendingContent(null);
        }}
        okText="保存"
        cancelText="取消"
      >
        <p style={{ color: "var(--color-text-secondary)" }}>确定要保存以下修改吗？</p>
        {pendingContent && (
          <div
            style={{
              background: "var(--color-bg-base)",
              padding: 12,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>标题：</strong>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {pendingContent.title || "(无)"}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "var(--color-text-primary)" }}>内容：</strong>
              <div
                style={{
                  maxHeight: 100,
                  overflow: "auto",
                  marginTop: 4,
                  color: "var(--color-text-secondary)",
                }}
              >
                {pendingContent.content || "(无)"}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 回退确认弹窗 */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RollbackOutlined style={{ color: "var(--color-warning)" }} />
            确认回退
          </div>
        }
        open={revertModalVisible}
        onOk={confirmRevert}
        onCancel={() => {
          setRevertModalVisible(false);
          setRevertHistoryId(null);
        }}
        okText="确认回退"
        cancelText="取消"
      >
        <p style={{ color: "var(--color-text-secondary)" }}>确定要回退到此版本吗？</p>
        <p style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
          回退后当前内容将被保存到历史记录中
        </p>
      </Modal>
    </Layout>
  );
};

export default NoteWindow;