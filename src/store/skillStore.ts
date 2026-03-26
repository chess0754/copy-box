import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SkillType = 'prompt' | 'command' | 'template';

export interface SkillItem {
  id: string;
  title: string;
  content: string;
  type: SkillType;
  // 分类
  category?: string;
  // 标签
  tags: string[];
  // 使用次数
  usageCount: number;
  // 版本号
  version: number;
  // 创建时间
  createTime: string;
  // 更新时间
  updateTime: string;
  // 启用状态
  enabled: boolean;
  // 快捷键
  shortcut?: string;
  // 描述
  description?: string;
}

interface SkillState {
  skills: SkillItem[];
  addSkill: (skill: SkillItem) => void;
  updateSkill: (id: string, content: Partial<SkillItem>) => void;
  deleteSkill: (id: string) => void;
  getSkillById: (id: string) => SkillItem | undefined;
  incrementUsageCount: (id: string) => void;
  toggleSkillEnabled: (id: string) => void;
  getEnabledSkills: () => SkillItem[];
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: [],
      addSkill: (skill) => set((state) => ({ skills: [skill, ...state.skills] })),
      updateSkill: (id, content) => set((state) => {
        const skill = state.skills.find((s) => s.id === id);
        if (!skill) return state;

        return {
          skills: state.skills.map((skill) =>
            skill.id === id
              ? {
                  ...skill,
                  ...content,
                  version: (skill.version || 1) + 1,
                  updateTime: new Date().toLocaleString(),
                }
              : skill
          ),
        };
      }),
      deleteSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
        })),
      getSkillById: (id) => get().skills.find((s) => s.id === id),
      incrementUsageCount: (id) =>
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id
              ? { ...skill, usageCount: (skill.usageCount || 0) + 1 }
              : skill
          ),
        })),
      toggleSkillEnabled: (id) =>
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id
              ? { ...skill, enabled: !skill.enabled }
              : skill
          ),
        })),
      getEnabledSkills: () => get().skills.filter((skill) => skill.enabled),
    }),
    {
      name: 'skill-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);