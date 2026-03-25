import React, { useMemo } from "react";
import { Segmented } from "antd";
import * as Diff from "diff";

interface DiffViewerProps {
  oldText: string;
  newText: string;
  mode?: "inline" | "split";
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  mode = "inline",
}) => {
  const diffResult = useMemo(() => {
    return Diff.diffLines(oldText, newText);
  }, [oldText, newText]);

  const inlineView = (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 12,
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        maxHeight: 400,
        overflow: "auto",
      }}
    >
      {diffResult.map((part, index) => {
        const color = part.added
          ? "rgba(16, 185, 129, 0.15)"
          : part.removed
          ? "rgba(239, 68, 68, 0.15)"
          : "transparent";
        const textColor = part.added
          ? "#34D399"
          : part.removed
          ? "#F87171"
          : "var(--color-text-primary)";
        return (
          <span
            key={index}
            style={{
              backgroundColor: color,
              color: textColor,
              display: "inline",
            }}
          >
            {part.value}
          </span>
        );
      })}
    </div>
  );

  const splitView = useMemo(() => {
    const diffWords = Diff.diffWords(oldText, newText);

    return (
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            flex: 1,
            background: "var(--color-bg-base)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 8,
              color: "var(--color-error)",
              fontSize: 12,
            }}
          >
            旧版本
          </div>
          {diffWords.map((part, index) => {
            if (part.added) return null;
            return (
              <span
                key={index}
                style={{
                  backgroundColor: part.removed
                    ? "rgba(239, 68, 68, 0.15)"
                    : "transparent",
                  color: part.removed
                    ? "#F87171"
                    : "var(--color-text-primary)",
                }}
              >
                {part.value}
              </span>
            );
          })}
        </div>
        <div
          style={{
            flex: 1,
            background: "var(--color-bg-base)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 8,
              color: "var(--color-success)",
              fontSize: 12,
            }}
          >
            新版本
          </div>
          {diffWords.map((part, index) => {
            if (part.removed) return null;
            return (
              <span
                key={index}
                style={{
                  backgroundColor: part.added
                    ? "rgba(16, 185, 129, 0.15)"
                    : "transparent",
                  color: part.added
                    ? "#34D399"
                    : "var(--color-text-primary)",
                }}
              >
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    );
  }, [oldText, newText]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Segmented
          options={[
            { label: "文字差异", value: "inline" },
            { label: "并排对比", value: "split" },
          ]}
          value={mode}
        />
      </div>
      {mode === "inline" ? inlineView : splitView}
    </div>
  );
};

export default DiffViewer;