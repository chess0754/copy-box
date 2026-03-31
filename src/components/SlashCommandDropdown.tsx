import React, { useState, useEffect, useMemo } from "react";
import { useNoteStore } from "../store/noteStore";
import { useSkillStore } from "../store/skillStore";
import { Typography, Tag, Empty } from "antd";
import {
  FileTextOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export interface SlashCommandItem {
  id: string;
  type: "note" | "skill";
  title: string;
  content: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SlashCommandDropdownProps {
  visible: boolean;
  position: { top: number; left: number };
  searchText: string;
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
}

const SlashCommandDropdown: React.FC<SlashCommandDropdownProps> = ({
  visible,
  position,
  searchText,
  onSelect,
  onClose,
}) => {
  const notes = useNoteStore((state) => state.notes);
  const skills = useSkillStore((state) => state.skills);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo<SlashCommandItem[]>(() => {
    const noteItems: SlashCommandItem[] = notes.map((note) => ({
      id: note.id,
      type: "note" as const,
      title: note.title,
      content: note.content,
      icon: <FileTextOutlined />,
    }));

    const skillItems: SlashCommandItem[] = skills
      .filter((skill) => skill.enabled)
      .map((skill) => ({
        id: skill.id,
        type: "skill" as const,
        title: skill.title,
        content: skill.content,
        description: skill.description,
        icon: <ThunderboltOutlined />,
      }));

    return [...noteItems, ...skillItems];
  }, [notes, skills]);

  const filteredItems = useMemo(() => {
    if (!searchText) return allItems;
    const lower = searchText.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.content.toLowerCase().includes(lower)
    );
  }, [allItems, searchText]);

  const groupedItems = useMemo(() => {
    const notes = filteredItems.filter((item) => item.type === "note");
    const skills = filteredItems.filter((item) => item.type === "skill");
    return { notes, skills };
  }, [filteredItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  useEffect(() => {
    if (!visible) {
      setSelectedIndex(0);
    }
  }, [visible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visible || filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  if (filteredItems.length === 0) {
    return (
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: position.left,
          width: 320,
          background: "var(--color-bg-card)",
          borderRadius: 8,
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          zIndex: 1000,
          padding: 16,
          marginBottom: 8,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="没有找到匹配的提示词或技能"
        />
      </div>
    );
  }

  let globalIndex = -1;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "100%",
        left: position.left,
        width: 320,
        maxHeight: 400,
        background: "var(--color-bg-card)",
        borderRadius: 8,
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--color-border)",
        zIndex: 1000,
        overflow: "hidden",
        marginBottom: 8,
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {groupedItems.notes.length > 0 && (
          <>
            <div
              style={{
                padding: "8px 12px",
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: 500,
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <Tag color="blue" style={{ marginRight: 8 }}>
                提示词
              </Tag>
              {groupedItems.notes.length} 个
            </div>
            {groupedItems.notes.map((item) => {
              globalIndex++;
              const isSelected = globalIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: isSelected
                      ? "var(--color-primary-bg)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--color-primary)"
                      : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background =
                        "var(--color-bg-base)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>
                      {item.icon}
                    </span>
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                  </div>
                  {item.description && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                      ellipsis
                    >
                      {item.description}
                    </Text>
                  )}
                  <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                    ellipsis
                  >
                    {item.content.slice(0, 50)}
                    {item.content.length > 50 ? "..." : ""}
                  </Text>
                </div>
              );
            })}
          </>
        )}

        {groupedItems.skills.length > 0 && (
          <>
            <div
              style={{
                padding: "8px 12px",
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: 500,
                borderBottom: "1px solid var(--color-border)",
                borderTop:
                  groupedItems.notes.length > 0
                    ? "1px solid var(--color-border)"
                    : "none",
              }}
            >
              <Tag color="orange" style={{ marginRight: 8 }}>
                技能
              </Tag>
              {groupedItems.skills.length} 个
            </div>
            {groupedItems.skills.map((item) => {
              globalIndex++;
              const isSelected = globalIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: isSelected
                      ? "var(--color-primary-bg)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--color-primary)"
                      : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background =
                        "var(--color-bg-base)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>
                      {item.icon}
                    </span>
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                  </div>
                  {item.description && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                      ellipsis
                    >
                      {item.description}
                    </Text>
                  )}
                  <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                    ellipsis
                  >
                    {item.content.slice(0, 50)}
                    {item.content.length > 50 ? "..." : ""}
                  </Text>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default SlashCommandDropdown;