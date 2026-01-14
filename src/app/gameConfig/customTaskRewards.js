export const CUSTOM_TASK_SIZES = [
  { key: "small", label: "小任务" },
  { key: "medium", label: "中任务" },
  { key: "large", label: "大任务" },
];

const SIZE_BASE_REWARDS = {
  small: { exp: 6, coinsReward: 4, sanity: 2 },
  medium: { exp: 12, coinsReward: 8, sanity: 4 },
  large: { exp: 18, coinsReward: 12, sanity: 6 },
};

export function computeRewardsForTask({ size, difficulty }) {
  const base = SIZE_BASE_REWARDS[size];
  if (!base) return null;

  const normalizedDifficulty = Math.min(5, Math.max(1, Number(difficulty) || 1));
  const exp = Math.round(base.exp + (normalizedDifficulty - 1) * 3);
  const coinsReward = Math.round(base.coinsReward + (normalizedDifficulty - 1) * 2);
  const sanity = Math.round(base.sanity + Math.max(0, normalizedDifficulty - 2));

  return {
    exp,
    coinsReward,
    effect: { sanity },
  };
}
