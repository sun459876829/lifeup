export const TASK_SIZE_OPTIONS = [
  { value: "small", label: "小任务", baseExp: 6, baseCoins: 4, baseSanity: 2 },
  { value: "medium", label: "中任务", baseExp: 12, baseCoins: 8, baseSanity: 4 },
  { value: "large", label: "大任务", baseExp: 20, baseCoins: 14, baseSanity: 6 },
];

const SIZE_LOOKUP = TASK_SIZE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

export function computeRewardsForTask({ size, difficulty }) {
  if (!size || !difficulty) {
    return {
      exp: 0,
      coinsReward: 0,
      effect: { sanity: 0 },
    };
  }

  const base = SIZE_LOOKUP[size] || SIZE_LOOKUP.small;
  const difficultyValue = Math.min(5, Math.max(1, Number(difficulty)));
  const difficultyBoost = difficultyValue - 1;

  return {
    exp: Math.round(base.baseExp + difficultyBoost * 3),
    coinsReward: Math.round(base.baseCoins + difficultyBoost * 2),
    effect: { sanity: base.baseSanity + difficultyBoost },
  };
}
