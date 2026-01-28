import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ClipboardItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  time: string;
}

interface ClipboardState {
  history: ClipboardItem[];
  addItem: (item: ClipboardItem) => void;
  updateItem: (id: string, content: string) => void;
  deleteItem: (id: string) => void;
  clearHistory: () => void;
}

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set) => ({
      history: [],
      addItem: (item) => set((state) => {
        // 避免重复添加完全相同的内容（可选，根据之前逻辑是只判断最新的）
        if (state.history.length > 0 && state.history[0].content === item.content) {
          return state;
        }
        return { history: [item, ...state.history] };
      }),
      updateItem: (id, content) => set((state) => ({
        history: state.history.map((item) =>
          item.id === id ? { ...item, content } : item
        ),
      })),
      deleteItem: (id) => set((state) => ({
        history: state.history.filter((item) => item.id !== id),
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'clipboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
