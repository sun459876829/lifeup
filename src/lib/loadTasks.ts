import templates from "../tasks/templates.json";
import coreTasks from "../tasks/core.json";
import customTasks from "../tasks/custom.json";

export type TaskDifficultyKey = keyof typeof templates;

export const DIFFICULTY_ORDER: TaskDifficultyKey[] = [
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
];

const DIFFICULTY_VALUE: Record<TaskDifficultyKey, number> = {
  tiny: 1,
  small: 2,
  medium: 3,
  large: 4,
  huge: 5,
};

const DEFAULT_DIFFICULTY: TaskDifficultyKey = "medium";

export type TaskTemplateInput = {
  name?: string;
  title?: string;
  category?: string;
  difficulty?: string | number;
  repeatable?: boolean;
  isRepeatable?: boolean;
  subtasks?: string[];
  tags?: string[];
  requirements?: Record<string, number>;
  prerequisites?: string[];
  effect?: Record<string, number>;
};

export type TaskTemplate = {
  templateId: string;
  name: string;
  category: string;
  difficulty: TaskDifficultyKey;
  repeatable: boolean;
  subtasks: string[];
  tags: string[];
  requirements?: Record<string, number>;
  prerequisites: string[];
  effect?: Record<string, number>;
  reward: {
    exp: number;
    coins: number;
  };
};

function normalizeDifficultyKey(value?: string | number): TaskDifficultyKey {
  if (typeof value === "number" && Number.isFinite(value)) {
    const index = Math.max(1, Math.min(5, Math.round(value))) - 1;
    return DIFFICULTY_ORDER[index] ?? DEFAULT_DIFFICULTY;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if ((templates as Record<string, unknown>)[lowered]) {
      return lowered as TaskDifficultyKey;
    }
    const numeric = Number(lowered);
    if (!Number.isNaN(numeric)) {
      const index = Math.max(1, Math.min(5, Math.round(numeric))) - 1;
      return DIFFICULTY_ORDER[index] ?? DEFAULT_DIFFICULTY;
    }
  }

  return DEFAULT_DIFFICULTY;
}

export function resolveDifficultyValue(value?: string | number): number {
  const key = normalizeDifficultyKey(value);
  return DIFFICULTY_VALUE[key] ?? DIFFICULTY_VALUE[DEFAULT_DIFFICULTY];
}

export function computeRewards(difficulty?: string | number) {
  const key = normalizeDifficultyKey(difficulty);
  const reward = templates[key] ?? templates[DEFAULT_DIFFICULTY];
  return {
    exp: reward.exp,
    coins: reward.coins,
    difficultyKey: key,
    difficultyValue: DIFFICULTY_VALUE[key] ?? DIFFICULTY_VALUE[DEFAULT_DIFFICULTY],
  };
}

export function normalizeTask(templateId: string, task: TaskTemplateInput): TaskTemplate {
  const { exp, coins, difficultyKey } = computeRewards(task?.difficulty);
  return {
    templateId,
    name: task?.name || task?.title || templateId,
    category: task?.category || "other",
    difficulty: difficultyKey,
    repeatable: Boolean(task?.repeatable ?? task?.isRepeatable ?? true),
    subtasks: Array.isArray(task?.subtasks) ? task.subtasks : [],
    tags: Array.isArray(task?.tags) ? task.tags : [],
    requirements: task?.requirements,
    prerequisites: Array.isArray(task?.prerequisites) ? task.prerequisites : [],
    effect: task?.effect,
    reward: { exp, coins },
  };
}

export function loadAllTasks() {
  const normalized: Record<string, TaskTemplate> = {};
  const merged = {
    ...(coreTasks || {}),
    ...(customTasks || {}),
  } as Record<string, TaskTemplateInput>;

  Object.entries(merged).forEach(([templateId, task]) => {
    if (!templateId) return;
    normalized[templateId] = normalizeTask(templateId, task || {});
  });

  return normalized;
}
