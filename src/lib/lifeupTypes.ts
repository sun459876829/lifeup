export type TaskCategory =
  | "认知"
  | "清理"
  | "体力"
  | "社交"
  | "工作"
  | "娱乐"
  | "其他";

export type TaskSize = "SMALL" | "MEDIUM" | "LARGE";

export type TaskPriority = "URGENT" | "SOON" | "LATER" | "FAST" | "LONG";

export type TaskType = "ONE_SHOT" | "REPEATABLE" | "HABIT";

export type TaskRepeatRule = {
  type: "DAILY" | "WEEKLY" | "NONE";
  targetCount?: number;
};

export type TaskBaseReward = {
  coins: number;
  exp: number;
};

export type LifeUpTask = {
  id: string;
  title: string;
  description?: string;
  category?: TaskCategory;
  categoryKey?: string;
  tags?: string[];
  size?: TaskSize;
  priority?: TaskPriority;
  estimateMinutes?: number;
  type?: TaskType;
  repeatRule?: TaskRepeatRule;
  attributeImpact?: string[];
  baseReward?: TaskBaseReward;
  createdAt: number;
  updatedAt: number;
  lastCompletedAt?: number;
  totalCompletedCount?: number;
};

export type Attribute = {
  id: string;
  name: string;
  description?: string;
  level: number;
  exp: number;
  expToNext: number;
  icon?: string;
  createdAt: number;
  updatedAt: number;
};

export type Achievement = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: "AUTO" | "MANUAL";
  condition?: { kind: string; value: number; extra?: any };
  unlockedAt?: number;
  timesUnlocked?: number;
};

export type TimerSession = {
  id: string;
  taskId?: string;
  mode: "POMODORO" | "STOPWATCH";
  workMinutes: number;
  restMinutes?: number;
  startedAt: number;
  endedAt?: number;
  effectiveMinutes?: number;
};

export type NoteEntry = {
  id: string;
  text: string;
  createdAt: number;
  relatedTaskId?: string;
  kind: "REFLECTION" | "IDEA";
};

export type HistoryEntry = {
  id: string;
  kind:
    | "TASK_COMPLETE"
    | "TASK_UNCOMPLETE"
    | "TASK_CREATE"
    | "TASK_DELETE"
    | "COINS_EARN"
    | "COINS_SPEND"
    | "TICKET_USE"
    | "ATTRIBUTE_LEVEL_UP"
    | "ACHIEVEMENT_UNLOCK"
    | string;
  payload: any;
  createdAt: number;
  canUndo: boolean;
  undoneAt?: number;
};
