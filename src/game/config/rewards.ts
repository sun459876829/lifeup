import { BASE_COINS_PER_HOUR } from "./economy";

type DifficultyKey = "tiny" | "small" | "medium" | "large" | "huge";

type RewardDrop = {
  id: string;
  amount: number;
};

type RewardResult = {
  coins: number;
  exp: number;
  resourceDrops: RewardDrop[];
};

const DIFFICULTY_MULTIPLIER: Record<DifficultyKey, number> = {
  tiny: 0.6,
  small: 0.8,
  medium: 1,
  large: 1.4,
  huge: 1.9,
};

function normalizeDifficulty(value?: string): DifficultyKey {
  if (value === "tiny" || value === "small" || value === "medium" || value === "large" || value === "huge") {
    return value;
  }
  return "medium";
}

function computeBaseCoins(minutes: number, difficulty: DifficultyKey) {
  const safeMinutes = Math.max(1, Number(minutes) || 10);
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1;
  return Math.round((safeMinutes / 60) * BASE_COINS_PER_HOUR * multiplier);
}

function buildResourceDrops(difficulty: DifficultyKey) {
  if (difficulty === "tiny" || difficulty === "small") return [];
  const resourcePool = ["wood", "stone", "fiber", "insightShard"];
  const count = difficulty === "medium" ? 1 : 2;
  const drops: RewardDrop[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = resourcePool[Math.floor(Math.random() * resourcePool.length)];
    const amount = difficulty === "medium" ? 1 : Math.floor(Math.random() * 2) + 1;
    drops.push({ id, amount });
  }
  return drops;
}

export function computeReward(task: any): RewardResult {
  const difficulty = normalizeDifficulty(task?.difficulty);
  const minutes = Number(task?.estimatedMinutes ?? task?.minutes) || 10;
  const coins = computeBaseCoins(minutes, difficulty);
  const exp = Math.max(1, Math.round(coins * 0.6));
  const resourceDrops = buildResourceDrops(difficulty);

  return {
    coins,
    exp,
    resourceDrops,
  };
}

export function estimateRewardRange(task: any): {
  minCoins: number;
  maxCoins: number;
  minExp: number;
  maxExp: number;
} {
  const difficulty = normalizeDifficulty(task?.difficulty);
  const minutes = Number(task?.estimatedMinutes ?? task?.minutes) || 10;
  const base = computeBaseCoins(minutes, difficulty);
  const spread = Math.max(2, Math.round(base * 0.2));
  const minCoins = Math.max(1, base - spread);
  const maxCoins = base + spread;
  const minExp = Math.max(1, Math.round(minCoins * 0.6));
  const maxExp = Math.max(1, Math.round(maxCoins * 0.6));
  return {
    minCoins,
    maxCoins,
    minExp,
    maxExp,
  };
}
