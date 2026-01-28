import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createTime: string;
  updateTime: string;
}

interface NoteState {
  notes: NoteItem[];
  addNote: (note: NoteItem) => void;
  updateNote: (id: string, content: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, content) => set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...content, updateTime: new Date().toLocaleString() } : note
        ),
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      })),
    }),
    {
      name: 'note-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
