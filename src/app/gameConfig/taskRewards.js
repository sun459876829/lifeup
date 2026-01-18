import { calculateReward, getSanityGain, resolveTaskKind } from "../../game/config";

export const TASK_SIZE_OPTIONS = [
  { value: "small", label: "小任务", minutes: 10 },
  { value: "medium", label: "中任务", minutes: 30 },
  { value: "large", label: "大任务", minutes: 60 },
];

const SIZE_LOOKUP = TASK_SIZE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

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
  const minutes = base.minutes || 10;
  const kind = resolveTaskKind(category || "other");
  const reward = calculateReward({ difficulty: difficultyValue, minutes, kind, comboCount: 1 });
  const sanity = getSanityGain(difficultyValue) + (isUserCreated ? 1 : 0);

  return {
    exp: reward.exp,
    coinsReward: reward.coins,
    effect: {
      sanity,
    },
  };
}
