import React, { useRef, useCallback, useEffect } from "react";

export interface PromptTag {
  id: string;
  title: string;
  content: string;
}

interface PromptInputProps {
  value: string;
  /** 当前已插入的提示词气泡列表 */
  promptTags: PromptTag[];
  onChange: (textValue: string) => void;
  onPromptTagsChange: (tags: PromptTag[]) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onSlashTrigger?: (slashText: string, rect: DOMRect) => void;
  /** 聚焦输入框 */
  inputRef?: React.RefObject<{ focus: () => void }>;
  /** 编辑器 DOM 元素引用 */
  editorRef?: React.MutableRefObject<HTMLDivElement | null>;
}

/** 从 contentEditable div 中提取纯文本和提示词标记 */
function extractContent(container: HTMLDivElement): {
  text: string;
  prompts: PromptTag[];
} {
  const prompts: PromptTag[] = [];
  let text = "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 过滤掉零宽空格（用于光标定位，不应出现在内容中）
      text += (node.textContent || "").replace(/\u200B/g, "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.getAttribute("data-prompt-id")) {
        const id = el.getAttribute("data-prompt-id")!;
        const title = el.getAttribute("data-prompt-title") || "";
        const content = el.getAttribute("data-prompt-content") || "";
        prompts.push({ id, title, content });
        text += `{{提示词: ${title}}}`;
      } else if (el.tagName === "BR") {
        text += "\n";
      } else {
        el.childNodes.forEach(walk);
        if (el.tagName === "DIV" || el.tagName === "P") {
          text += "\n";
        }
      }
    }
  };

  container.childNodes.forEach(walk);

  // 去掉末尾多余的换行符
  text = text.replace(/\n+$/, "");

  return { text, prompts };
}

/** 将纯文本渲染到 contentEditable div */
function renderContent(
  container: HTMLDivElement,
  text: string,
  promptTags: PromptTag[]
) {
  container.innerHTML = "";

  // 按 {{提示词: xxx}} 分割文本
  const parts: Array<{ type: "text" | "prompt"; value: string }> = [];
  const regex = /\{\{提示词:\s*(.*?)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "prompt", value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  // 如果没有匹配到任何 prompt 标记，但有 promptTags，则直接渲染文本
  if (parts.length === 1 && parts[0].type === "text" && promptTags.length > 0) {
    // 文本不包含 prompt 标记，直接设置文本
    container.textContent = text;
    return;
  }

  // 渲染分段内容
  for (const part of parts) {
    if (part.type === "text") {
      // 将换行符转换为 <br> 或 <div>
      const lines = part.value.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          container.appendChild(document.createTextNode(lines[i]));
        }
        if (i < lines.length - 1) {
          container.appendChild(document.createElement("br"));
        }
      }
    } else {
      // 查找对应的 promptTag
      const tag = promptTags.find((t) => t.title === part.value);
      if (tag) {
        const span = document.createElement("span");
        span.setAttribute("data-prompt-id", tag.id);
        span.setAttribute("data-prompt-title", tag.title);
        span.setAttribute("data-prompt-content", tag.content);
        span.setAttribute("contenteditable", "false");
        span.className = "prompt-bubble";
        span.textContent = tag.title;
        container.appendChild(span);

        // 添加一个零宽空格，方便光标定位
        const zwsp = document.createTextNode("\u200B");
        container.appendChild(zwsp);
      }
    }
  }

  // 确保容器至少有一个内容节点
  if (container.childNodes.length === 0) {
    container.appendChild(document.createTextNode(""));
  }
}

const PromptInput: React.FC<PromptInputProps> = ({
  value,
  promptTags,
  onChange,
  onPromptTagsChange,
  onKeyDown,
  placeholder,
  disabled,
  style,
  onSlashTrigger,
  inputRef,
  editorRef,
}) => {
  const internalEditorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // 同步外部 editorRef
  useEffect(() => {
    if (editorRef) {
      editorRef.current = internalEditorRef.current;
    }
  }, [editorRef]);

  // 暴露 focus 方法
  useEffect(() => {
    if (inputRef) {
      (inputRef as any).current = {
        focus: () => internalEditorRef.current?.focus(),
      };
    }
  }, [inputRef]);

  // 当外部 value 改变时同步渲染内容（仅在非聚焦状态）
  useEffect(() => {
    const editor = internalEditorRef.current;
    if (!editor) return;
    // 如果编辑器正在聚焦，不覆盖内容（让用户自由输入）
    if (document.activeElement === editor) return;
    renderContent(editor, value, promptTags);
  }, [value, promptTags]);

  const handleInput = useCallback(() => {
    const editor = internalEditorRef.current;
    if (!editor) return;

    const { text, prompts } = extractContent(editor);
    onChange(text);
    // 只有当 prompts 变化时才更新
    const currentIds = promptTags.map((t) => t.id).sort().join(",");
    const newIds = prompts.map((t) => t.id).sort().join(",");
    if (currentIds !== newIds) {
      onPromptTagsChange(prompts);
    }

    // 检测 / 触发斜杠命令
    if (onSlashTrigger) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const node = range.startContainer;

        // 获取光标前的文本
        let textBeforeCursor = "";
        if (node.nodeType === Node.TEXT_NODE) {
          textBeforeCursor = node.textContent?.slice(0, range.startOffset) || "";
        }

        const slashIndex = textBeforeCursor.lastIndexOf("/");
        if (slashIndex !== -1) {
          // 检查 / 前面是否是行首或换行
          const beforeSlash = textBeforeCursor.slice(0, slashIndex);
          const lastNewline = beforeSlash.lastIndexOf("\n");
          const textAfterNewline = beforeSlash.slice(lastNewline + 1);

          if (textAfterNewline.trim() === "") {
            const searchText = textBeforeCursor.slice(slashIndex + 1);
            const rect = editor.getBoundingClientRect();

            // 保存 slash 位置，供 insertPromptBubble 使用
            (editor as any).__slashNode = node;
            (editor as any).__slashOffset = slashIndex;
            (editor as any).__slashEndOffset = range.startOffset;

            onSlashTrigger(searchText, rect);
          }
        }
      }
    }
  }, [onChange, onPromptTagsChange, promptTags, onSlashTrigger]);

  const handleKeyDownInternal = useCallback(
    (e: React.KeyboardEvent) => {
      // 处理光标在 prompt bubble 前面按 backspace 删除
      if (e.key === "Backspace") {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;

          // 检查光标前面是否有 prompt bubble
          if (
            node.nodeType === Node.TEXT_NODE &&
            range.startOffset === 0 &&
            node.previousSibling
          ) {
            const prev = node.previousSibling;
            if (
              prev.nodeType === Node.ELEMENT_NODE &&
              (prev as HTMLElement).hasAttribute("data-prompt-id")
            ) {
              e.preventDefault();
              prev.remove();
              // 也移除前面的零宽空格
              if (prev.previousSibling?.nodeType === Node.TEXT_NODE) {
                const textBefore = prev.previousSibling.textContent || "";
                if (textBefore === "\u200B") {
                  prev.previousSibling.remove();
                }
              }
              handleInput();
              return;
            }
          }

          // 如果光标在文本节点中，检查光标前一个字符是否是零宽空格后的 bubble
          if (node.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
            const prevChar = node.textContent?.charAt(range.startOffset - 1);
            if (prevChar === "\u200B" && node.previousSibling) {
              const beforeZwsp = node.previousSibling;
              if (
                beforeZwsp.nodeType === Node.ELEMENT_NODE &&
                (beforeZwsp as HTMLElement).hasAttribute("data-prompt-id")
              ) {
                e.preventDefault();
                // 删除零宽空格和 bubble
                const newOffset = range.startOffset - 1;
                node.textContent =
                  (node.textContent?.slice(0, newOffset) || "") +
                  (node.textContent?.slice(range.startOffset) || "");
                beforeZwsp.remove();
                // 移动光标
                const newRange = document.createRange();
                newRange.setStart(node, newOffset);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                handleInput();
                return;
              }
            }
          }
        }
      }

      // 禁止在 prompt bubble 内部输入
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const anchorNode = sel.anchorNode;
          if (
            anchorNode?.parentElement?.hasAttribute("data-prompt-id") ||
            anchorNode?.parentElement?.getAttribute("contenteditable") === "false"
          ) {
            e.preventDefault();
            return;
          }
        }
      }

      onKeyDown(e);
    },
    [onKeyDown, handleInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      // 插入纯文本
      document.execCommand("insertText", false, text);
    },
    []
  );

  return (
    <div
      ref={internalEditorRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDownInternal}
      onPaste={handlePaste}
      onCompositionStart={() => {
        isComposing.current = true;
      }}
      onCompositionEnd={() => {
        isComposing.current = false;
        handleInput();
      }}
      data-placeholder={placeholder}
      style={{
        minHeight: 32,
        maxHeight: 120,
        overflowY: "auto",
        padding: "8px 12px",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        outline: "none",
        fontSize: 14,
        lineHeight: "22px",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        background: disabled ? "var(--color-bg-disabled, #f5f5f5)" : "#fff",
        color: "var(--color-text)",
        transition: "border-color 0.2s",
        cursor: disabled ? "not-allowed" : "text",
        ...style,
      }}
      className={`prompt-input-editor${disabled ? " disabled" : ""}`}
    />
  );
};

// 插入提示词气泡到编辑器
export function insertPromptBubble(
  editor: HTMLDivElement,
  tag: PromptTag
) {
  editor.focus();

  // 使用保存的 slash 位置来替换斜杠和搜索文本
  const slashNode: Node | undefined = (editor as any).__slashNode;
  const slashOffset: number | undefined = (editor as any).__slashOffset;
  const slashEndOffset: number | undefined = (editor as any).__slashEndOffset;

  // 清除保存的位置
  delete (editor as any).__slashNode;
  delete (editor as any).__slashOffset;
  delete (editor as any).__slashEndOffset;

  if (slashNode && slashOffset !== undefined && slashEndOffset !== undefined) {
    // 删除从 / 开始的搜索文本
    if (slashNode.nodeType === Node.TEXT_NODE) {
      const text = slashNode.textContent || "";
      slashNode.textContent = text.slice(0, slashOffset) + text.slice(slashEndOffset);
    }

    // 创建 bubble
    const span = document.createElement("span");
    span.setAttribute("data-prompt-id", tag.id);
    span.setAttribute("data-prompt-title", tag.title);
    span.setAttribute("data-prompt-content", tag.content);
    span.setAttribute("contenteditable", "false");
    span.className = "prompt-bubble";
    span.textContent = tag.title;

    const zwsp = document.createTextNode("\u200B");

    // 插入 bubble + 零宽空格到 slash 位置
    const range = document.createRange();
    range.setStart(slashNode, slashOffset);
    range.collapse(true);
    range.insertNode(zwsp);
    range.insertNode(span);

    // 光标移到零宽空格后
    range.setStartAfter(zwsp);
    range.collapse(true);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    editor.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // 回退：使用当前光标位置
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  let textNode = range.startContainer;
  let offset = range.startOffset;

  if (textNode === editor) {
    const child = editor.childNodes[offset];
    if (child) {
      textNode = child;
      offset = 0;
    } else {
      textNode = document.createTextNode("");
      editor.appendChild(textNode);
      offset = 0;
    }
  }

  // 尝试删除光标前的 `/` 和搜索文本
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent || "";
    const slashIndex = text.lastIndexOf("/", offset);
    if (slashIndex !== -1) {
      const beforeSlash = text.slice(0, slashIndex);
      const lastNewline = beforeSlash.lastIndexOf("\n");
      const afterNewline = beforeSlash.slice(lastNewline + 1);
      if (afterNewline.trim() === "") {
        textNode.textContent = text.slice(0, slashIndex) + text.slice(offset);
        offset = slashIndex;
      }
    }
  }

  const span = document.createElement("span");
  span.setAttribute("data-prompt-id", tag.id);
  span.setAttribute("data-prompt-title", tag.title);
  span.setAttribute("data-prompt-content", tag.content);
  span.setAttribute("contenteditable", "false");
  span.className = "prompt-bubble";
  span.textContent = tag.title;

  const zwsp = document.createTextNode("\u200B");

  const newRange = document.createRange();
  newRange.setStart(textNode, offset);
  newRange.collapse(true);
  newRange.insertNode(zwsp);
  newRange.insertNode(span);

  newRange.setStartAfter(zwsp);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);

  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

export default PromptInput;
