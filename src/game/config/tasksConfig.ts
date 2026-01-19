export type TaskTemplateConfig = {
  id: string;
  title: string;
  category: string;
  difficulty: "tiny" | "small" | "medium" | "large" | "huge";
  repeatable: boolean;
  estimatedMinutes: number;
  description?: string;
};

export const TASK_TEMPLATES: Record<string, TaskTemplateConfig> = {
  "learn-core": {
    id: "learn-core",
    title: "核心知识学习",
    category: "learning",
    difficulty: "medium",
    repeatable: true,
    estimatedMinutes: 30,
    description: "阅读或整理一段核心知识卡片",
  },
  "clean-camp": {
    id: "clean-camp",
    title: "营地整理",
    category: "cleaning",
    difficulty: "small",
    repeatable: true,
    estimatedMinutes: 15,
    description: "清理房间/桌面/资料",
  },
};
