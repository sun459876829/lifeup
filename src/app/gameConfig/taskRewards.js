export const TASK_SIZE_OPTIONS = [
  { value: "small", label: "小任务", baseExp: 6, baseCoins: 4, baseSanity: 2 },
  { value: "medium", label: "中任务", baseExp: 12, baseCoins: 8, baseSanity: 4 },
  { value: "large", label: "大任务", baseExp: 20, baseCoins: 14, baseSanity: 6 },
];

const SIZE_LOOKUP = TASK_SIZE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const GROWTH_CATEGORIES = new Set(["course", "english", "life", "future", "weight", "photo", "other"]);

export function computeRewardsForTask({ size, difficulty, category, isUserCreated }) {
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

  const normalizedCategory = category || "other";
  const isNightclub = normalizedCategory === "nightclub";
  const isGrowth = GROWTH_CATEGORIES.has(normalizedCategory);

  const expMultiplier = isNightclub ? 1.6 : 1;
  const coinsMultiplier = isNightclub ? 1.8 : 1;
  const userBonus = isUserCreated ? 1 : 0;

  const exp = Math.round((base.baseExp + difficultyBoost * 3 + userBonus) * expMultiplier);
  const coinsReward = Math.round((base.baseCoins + difficultyBoost * 2 + userBonus) * coinsMultiplier);
  const sanity = base.baseSanity + difficultyBoost + (isGrowth ? 1 : 0);

  const energyPenalty = isNightclub ? -(8 + difficultyBoost * 2) : Math.min(-1, -(difficultyValue >= 4 ? 2 : 1));
  const hungerPenalty = isNightclub ? -(4 + difficultyBoost) : 0;

  return {
    exp,
    coinsReward,
    effect: {
      sanity,
      energy: energyPenalty,
      hunger: hungerPenalty,
      health: 0,
    },
  };
}
