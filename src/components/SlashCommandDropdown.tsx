import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNoteStore } from "../store/noteStore";
import { Typography, Tag, Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface SlashCommandItem {
  id: string;
  type: "note";
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo<SlashCommandItem[]>(() => {
    const noteItems: SlashCommandItem[] = notes.map((note) => ({
      id: note.id,
      type: "note" as const,
      title: note.title,
      content: note.content,
      icon: <FileTextOutlined />,
    }));
    return noteItems;
  }, [notes]);

  const filteredItems = useMemo(() => {
    if (!searchText) return allItems;
    const lower = searchText.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.content.toLowerCase().includes(lower)
    );
  }, [allItems, searchText]);

  // 搜索文本变化时重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // 隐藏时重置
  useEffect(() => {
    if (!visible) {
      setSelectedIndex(0);
    }
  }, [visible]);

  // 自动滚动选中项到可见区域
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // 全局键盘监听
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      const preventAndStop = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      switch (e.key) {
        case "ArrowDown":
          preventAndStop();
          if (filteredItems.length === 0) return;
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          preventAndStop();
          if (filteredItems.length === 0) return;
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;

        case "Enter":
          preventAndStop();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;

        case "Escape":
          preventAndStop();
          onClose();
          break;
      }
    },
    [visible, filteredItems, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [handleGlobalKeyDown]);

  if (!visible) return null;

  if (filteredItems.length === 0) {
    return (
      <div className="slash-dropdown" style={{ left: position.left }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="没有找到匹配的提示词"
          style={{ padding: "16px 0" }}
        />
      </div>
    );
  }

  let globalIndex = -1;

  return (
    <div className="slash-dropdown" style={{ left: position.left }}>
      <div ref={listRef} className="slash-dropdown-list">
        {/* 分组标题 */}
        <div className="slash-dropdown-header">
          <Tag color="blue" style={{ marginRight: 8 }}>提示词</Tag>
          <span>{filteredItems.length} 个</span>
        </div>

        {/* 列表项 */}
        {filteredItems.map((item) => {
          globalIndex++;
          const isSelected = globalIndex === selectedIndex;
          return (
            <div
              key={item.id}
              ref={isSelected ? selectedRef : null}
              className={`slash-dropdown-item${isSelected ? " selected" : ""}`}
              onClick={() => onSelect(item)}
              onMouseEnter={() => {
                if (!isSelected) setSelectedIndex(globalIndex);
              }}
            >
              <div className="slash-dropdown-item-main">
                <span className="slash-dropdown-item-icon">{item.icon}</span>
                <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
              </div>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 2 }}
                ellipsis
              >
                {item.content.slice(0, 50)}
                {item.content.length > 50 ? "..." : ""}
              </Text>
            </div>
          );
        })}
      </div>

      {/* 底部键盘提示 */}
      <div className="slash-dropdown-footer">
        <div className="slash-dropdown-hint">
          <kbd>↑↓</kbd> 导航
        </div>
        <div className="slash-dropdown-hint">
          <kbd>↵</kbd> 选择
        </div>
        <div className="slash-dropdown-hint">
          <kbd>Esc</kbd> 关闭
        </div>
      </div>
    </div>
  );
};

export default SlashCommandDropdown;
