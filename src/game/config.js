export const COIN_UNIT = "coin";
export const COIN_TO_RMB = 0.1;

export const STAT_LIMITS = {
  life: 100,
  sanity: 120,
  hunger: 100,
};

const STUDY_KINDS = new Set(["study", "course", "english", "learning", "reading"]);
const WORK_KINDS = new Set(["work", "nightclub", "job", "livestream", "live"]);
const CATEGORY_ALIASES = new Map([
  ["认知", "study"],
  ["清理", "life"],
  ["体力", "life"],
  ["社交", "life"],
  ["工作", "work"],
  ["娱乐", "life"],
  ["其他", "other"],
]);

export function resolveTaskKind(category, kind) {
  const base = kind || CATEGORY_ALIASES.get(category) || category || "other";
  if (STUDY_KINDS.has(base)) return "study";
  if (WORK_KINDS.has(base)) return "work";
  if (["life", "weight", "photo", "future", "other"].includes(base)) return "life";
  return base;
}

function getKindMultiplier(kind) {
  if (kind === "study") return 1.2;
  return 1;
}

export function getSanityGain(difficulty) {
  const value = Number(difficulty) || 1;
  if (value >= 4) return 3;
  if (value >= 2) return 2;
  return 1;
}

/**
 * 统一任务奖励计算公式。
 * - baseCoins = minutes / 10 * difficulty * 10
 * - exp = floor(coins * 0.5)
 * - burstBonus 上限 50%
 */
export function calculateReward({ difficulty = 1, minutes = 10, kind = "other", comboCount = 1 }) {
  const safeDifficulty = Math.min(5, Math.max(1, Number(difficulty) || 1));
  const safeMinutes = Math.max(1, Number(minutes) || 10);
  const resolvedKind = resolveTaskKind(null, kind);
  const kindMultiplier = getKindMultiplier(resolvedKind);
  const baseCoins = (safeMinutes / 10) * safeDifficulty * 10;
  const burstBonus = Math.min(0.05 * Math.max(0, comboCount - 1), 0.5);
  const coins = Math.round(baseCoins * kindMultiplier * (1 + burstBonus));
  const exp = Math.floor(coins * 0.5);

  return { coins, exp, burstBonus };
}
