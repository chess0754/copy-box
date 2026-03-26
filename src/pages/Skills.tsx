import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input, Modal, List, Popconfirm, message, Tag, Select, Empty, Switch } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useSkillStore, SkillItem, SkillType } from "../store/skillStore";

const Skills: React.FC = () => {
  const { skills, addSkill, updateSkill, deleteSkill } = useSkillStore();

  // Storage event listener to sync state across windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "skill-storage") {
        useSkillStore.persist.rehydrate();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<SkillType>("prompt");
  const [newShortcut, setNewShortcut] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<SkillType | null>(null);

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set<string>();
    skills.forEach((skill) => {
      if (skill.category) {
        cats.add(skill.category);
      }
    });
    return Array.from(cats);
  }, [skills]);

  // 技能类型选项
  const typeOptions = [
    { value: "prompt", label: "提示词" },
    { value: "command", label: "命令" },
    { value: "template", label: "模板" },
  ];

  // 过滤后的技能
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      // 分类过滤
      if (filterCategory && skill.category !== filterCategory) {
        return false;
      }
      // 类型过滤
      if (filterType && skill.type !== filterType) {
        return false;
      }
      // 搜索过滤
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          skill.title.toLowerCase().includes(search) ||
          skill.content.toLowerCase().includes(search) ||
          skill.category?.toLowerCase().includes(search) ||
          skill.description?.toLowerCase().includes(search) ||
          skill.tags?.some((tag) => tag.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }, [skills, filterCategory, filterType, searchText]);

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewCategory("");
    setNewType("prompt");
    setNewShortcut("");
    setNewDescription("");
    setNewTags("");
    setEditId(null);
    setIsEditMode(false);
  };

  const handleOpenModal = (isEdit = false) => {
    resetForm();
    setIsEditMode(isEdit);
    setIsModalOpen(true);
  };

  const handleEdit = (skill: SkillItem) => {
    setEditId(skill.id);
    setNewTitle(skill.title);
    setNewContent(skill.content);
    setNewCategory(skill.category || "");
    setNewType(skill.type);
    setNewShortcut(skill.shortcut || "");
    setNewDescription(skill.description || "");
    setNewTags(skill.tags?.join(", ") || "");
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      message.warning("请输入标题");
      return;
    }
    const id = Date.now().toString();
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    const newSkill: SkillItem = {
      id,
      title: newTitle,
      content: newContent,
      type: newType,
      category: newCategory || undefined,
      tags,
      usageCount: 0,
      version: 1,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      enabled: true,
      shortcut: newShortcut || undefined,
      description: newDescription || undefined,
    };
    addSkill(newSkill);
    setIsModalOpen(false);
    resetForm();
    message.success("技能创建成功");
  };

  const handleUpdate = () => {
    if (!newTitle.trim() || !editId) {
      message.warning("请输入标题");
      return;
    }
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    updateSkill(editId, {
      title: newTitle,
      content: newContent,
      type: newType,
      category: newCategory || undefined,
      tags,
      shortcut: newShortcut || undefined,
      description: newDescription || undefined,
    });
    setIsModalOpen(false);
    resetForm();
    message.success("技能更新成功");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSkill(id);
    message.success("已删除");
  };

  const handleCopy = (content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.writeClipboardText(content);
    message.success("内容已复制");
  };

  const handleToggleEnabled = (id: string, enabled: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSkill(id, { enabled });
  };

  // 随机颜色标签
  const tagColors = ["blue", "green", "orange", "purple", "red", "cyan"];
  const getTagColor = (index: number) => tagColors[index % tagColors.length];

  // 获取类型标签颜色
  const getTypeColor = (type: SkillType) => {
    switch (type) {
      case "prompt":
        return "blue";
      case "command":
        return "green";
      case "template":
        return "purple";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: SkillType) => {
    switch (type) {
      case "prompt":
        return "提示词";
      case "command":
        return "命令";
      case "template":
        return "模板";
      default:
        return type;
    }
  };

  return (
    <div className="content-section">
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThunderboltOutlined style={{ color: "var(--color-primary)" }} />
            <span>技能管理</span>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: "normal",
              }}
            >
              ({filteredSkills.length} 个)
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(false)}
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
          <Select
            placeholder="筛选类型"
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            allowClear
            options={typeOptions}
          />
        </div>

        <div
          style={{
            height: "calc(100% - 80px)",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          {filteredSkills.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  暂无技能，点击"新建"创建第一个技能
                </span>
              }
              style={{ marginTop: 80 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal(false)}
              >
                新建技能
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
              dataSource={filteredSkills}
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
                      opacity: item.enabled ? 1 : 0.6,
                    }}
                    title={
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontWeight: 600,
                        }}
                      >
                        <ThunderboltOutlined
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
                            maxWidth: "calc(100% - 60px)",
                          }}
                        >
                          {item.title}
                        </span>
                      </span>
                    }
                    extra={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Switch
                          size="small"
                          checked={item.enabled}
                          onChange={(checked, e) => handleToggleEnabled(item.id, checked, e as React.MouseEvent)}
                        />
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
                      </div>
                    }
                    actions={[
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        key="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        size="small"
                      >
                        编辑
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
                    <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Tag color={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Tag>
                      {item.category && (
                        <Tag color={getTagColor(categories.indexOf(item.category))}>
                          {item.category}
                        </Tag>
                      )}
                      {!item.enabled && (
                        <Tag color="default">已禁用</Tag>
                      )}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          color: "var(--color-text-secondary)",
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    <div
                      style={{
                        height: "60px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.content ? (
                        item.content
                      ) : (
                        <span style={{ color: "var(--color-text-tertiary)" }}>
                          无内容...
                        </span>
                      )}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <Tag key={idx} color="default" style={{ fontSize: 11 }}>
                            {tag}
                          </Tag>
                        ))}
                        {item.tags.length > 3 && (
                          <Tag color="default" style={{ fontSize: 11 }}>
                            +{item.tags.length - 3}
                          </Tag>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: "var(--space-sm)",
                        fontSize: 12,
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
                      <span>
                        <CheckCircleOutlined style={{ marginRight: 4 }} />
                        {item.usageCount || 0} 次
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                        marginTop: "var(--space-xs)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.updateTime}</span>
                      {item.shortcut && <span>{item.shortcut}</span>}
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
            {isEditMode ? "编辑技能" : "新建技能"}
          </div>
        }
        open={isModalOpen}
        onOk={isEditMode ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        width={500}
        okText={isEditMode ? "保存" : "创建"}
        cancelText="取消"
      >
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>标题 *</div>
          <Input
            placeholder="请输入标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "16px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>类型</div>
            <Select
              placeholder="选择类型"
              value={newType}
              onChange={setNewType}
              style={{ width: "100%" }}
              options={typeOptions}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>分类 (可选)</div>
            <Input
              placeholder="请输入分类"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>描述 (可选)</div>
          <Input
            placeholder="请输入描述"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>标签 (可选，多个用逗号分隔)</div>
          <Input
            placeholder="例如: 前端, React, 组件"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>快捷键 (可选)</div>
          <Input
            placeholder="例如: Ctrl+Shift+S"
            value={newShortcut}
            onChange={(e) => setNewShortcut(e.target.value)}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>内容</div>
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

export default Skills;