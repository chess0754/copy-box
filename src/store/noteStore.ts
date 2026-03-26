import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NoteType = 'prompt';

// 变量定义
export interface PromptVariable {
  name: string;
  defaultValue?: string;
  description?: string;
  required: boolean;
}

// 历史记录
export interface NoteHistory {
  id: string;
  content: string;
  title: string;
  updateTime: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  // 分类
  category?: string;
  // 标签
  tags: string[];
  // 变量列表
  variables: PromptVariable[];
  // 使用次数
  usageCount: number;
  // 版本号
  version: number;
  // 创建时间
  createTime: string;
  // 更新时间
  updateTime: string;
  // 历史记录
  history: NoteHistory[];
}

interface NoteState {
  notes: NoteItem[];
  addNote: (note: NoteItem) => void;
  updateNote: (id: string, content: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => NoteItem | undefined;
  revertToVersion: (id: string, historyId: string) => void;
  incrementUsageCount: (id: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, content) => set((state) => {
        const note = state.notes.find((n) => n.id === id);
        if (!note) return state;

        // 如果内容发生变化，保存历史记录
        let history = note.history || [];
        if (content.content !== undefined || content.title !== undefined) {
          const newContent = content.content !== undefined ? content.content : note.content;
          const newTitle = content.title !== undefined ? content.title : note.title;

          // 只有当内容真正改变时才添加历史记录
          if (newContent !== note.content || newTitle !== note.title) {
            const historyItem: NoteHistory = {
              id: Date.now().toString(),
              content: note.content,
              title: note.title,
              updateTime: note.updateTime,
            };
            history = [historyItem, ...history].slice(0, 50); // 最多保存50条历史
          }
        }

        // 计算新版本号
        const hasContentChange = content.content !== undefined || content.title !== undefined;
        const newVersion = hasContentChange ? (note.version || 1) + 1 : note.version;

        return {
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...content,
                  version: newVersion,
                  history,
                  updateTime: new Date().toLocaleString(),
                }
              : note
          ),
        };
      }),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      getNoteById: (id) => get().notes.find((n) => n.id === id),
      incrementUsageCount: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, usageCount: (note.usageCount || 0) + 1 }
              : note
          ),
        })),
      revertToVersion: (id, historyId) => set((state) => {
        const note = state.notes.find((n) => n.id === id);
        if (!note) return state;

        const historyItem = note.history.find((h) => h.id === historyId);
        if (!historyItem) return state;

        // 保存当前版本到历史
        const newHistoryItem: NoteHistory = {
          id: Date.now().toString(),
          content: note.content,
          title: note.title,
          updateTime: note.updateTime,
        };

        return {
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  content: historyItem.content,
                  title: historyItem.title,
                  version: (note.version || 1) + 1,
                  history: [newHistoryItem, ...note.history].slice(0, 50),
                  updateTime: new Date().toLocaleString(),
                }
              : note
          ),
        };
      }),
    }),
    {
      name: 'note-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);