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
        background: "#fff",
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 13,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        maxHeight: 400,
        overflow: "auto",
      }}
    >
      {diffResult.map((part, index) => {
        const color = part.added
          ? "#e6ffec"
          : part.removed
          ? "#ffebe9"
          : "transparent";
        const textColor = part.added
          ? "#1a7f37"
          : part.removed
          ? "#cf222e"
          : "inherit";
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
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: 12,
            fontFamily: "monospace",
            fontSize: 13,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8, color: "#cf222e" }}>
            旧版本
          </div>
          {diffWords.map((part, index) => {
            if (part.added) return null;
            return (
              <span
                key={index}
                style={{
                  backgroundColor: part.removed ? "#ffebe9" : "transparent",
                  color: part.removed ? "#cf222e" : "inherit",
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
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: 12,
            fontFamily: "monospace",
            fontSize: 13,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8, color: "#1a7f37" }}>
            新版本
          </div>
          {diffWords.map((part, index) => {
            if (part.removed) return null;
            return (
              <span
                key={index}
                style={{
                  backgroundColor: part.added ? "#e6ffec" : "transparent",
                  color: part.added ? "#1a7f37" : "inherit",
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