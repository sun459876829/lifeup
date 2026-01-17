export const TASK_SIZE_OPTIONS = [
  { value: "small", label: "小任务", baseExp: 10, baseCoins: 5, baseSanity: 2 },
  { value: "medium", label: "中任务", baseExp: 20, baseCoins: 20, baseSanity: 4 },
  { value: "large", label: "大任务", baseExp: 32, baseCoins: 60, baseSanity: 6 },
];

const SIZE_LOOKUP = TASK_SIZE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const GROWTH_CATEGORIES = new Set(["course", "english", "life", "future", "weight", "photo", "other"]);
const COIN_RANGES = {
  small: { min: 5, max: 20 },
  medium: { min: 20, max: 60 },
  large: { min: 60, max: 120 },
};

const NIGHTCLUB_RANGES = {
  small: { min: 150, max: 250 },
  medium: { min: 200, max: 320 },
  large: { min: 250, max: 400 },
};

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

  const expMultiplier = isNightclub ? 1.3 : 1;
  const userBonus = isUserCreated ? 2 : 0;

  const exp = Math.round((base.baseExp + difficultyBoost * 4 + userBonus) * expMultiplier);

  const rangeSet = isNightclub ? NIGHTCLUB_RANGES : COIN_RANGES;
  const range = rangeSet[size] || rangeSet.small;
  const difficultyRatio = (difficultyValue - 1) / 4;
  const growthBoost = isGrowth ? 0.15 : 0;
  const baseCoins = range.min + (range.max - range.min) * Math.min(1, difficultyRatio + growthBoost);
  const coinsReward = Math.round(baseCoins + (isUserCreated ? 3 : 0));
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
