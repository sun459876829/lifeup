const STORAGE_KEY = "lifeup.magicworld.v1";

export const PROJECTS = [
  { id: "ququ", name: "曲曲情感课" },
  { id: "xsz", name: "谢胜子课程" },
  { id: "kaizhi", name: "开智学习" },
  { id: "tiktok", name: "抖音 / TikTok" },
  { id: "english", name: "英语 & 背单词" },
  { id: "eddy", name: "Eddie 指导" },
  { id: "aibook", name: "AI 创业小册子" },
  { id: "life", name: "现实生活杂项" },
];

export const GEM_COLORS = ["red", "blue", "green", "purple"];

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function getProjectName(id) {
  const p = PROJECTS.find((x) => x.id === id);
  return p ? p.name : "未知项目";
}

export function randomGemColor() {
  const idx = Math.floor(Math.random() * GEM_COLORS.length);
  return GEM_COLORS[idx];
}

export function createDefaultState() {
  const projectProgress = {};
  PROJECTS.forEach((p) => {
    projectProgress[p.id] = { steps: 0 };
  });

  return {
    coins: 0, // 魔晶币
    xp: 0, // 经验
    level: 1,
    xpForNext: 50,
    tasks: [],
    gems: { red: 0, blue: 0, green: 0, purple: 0 },
    relics: [], // 收集到的事件记录（小成就）
    projectProgress,
    claims: [], // 我的奖励列表
  };
}

export function safeLoadState() {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);

    const base = createDefaultState();

    return {
      ...base,
      ...parsed,
      gems: { ...base.gems, ...(parsed.gems || {}) },
      projectProgress: { ...base.projectProgress, ...(parsed.projectProgress || {}) },
      relics: Array.isArray(parsed.relics) ? parsed.relics : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    };
  } catch {
    return createDefaultState();
  }
}

export function safeSaveState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
