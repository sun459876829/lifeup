import { RESOURCE_IDS } from "./resources";

export type RewardDifficulty = "tiny" | "small" | "medium" | "large" | "huge";
export type RewardCategory =
  | "learning"
  | "cleaning"
  | "work"
  | "health"
  | "context"
  | "english"
  | "explore"
  | "other";

export type RewardInput = {
  minutes: number;
  difficulty: RewardDifficulty;
  category: RewardCategory;
};

export type RewardOutput = {
  coins: number;
  exp: number;
  resourceDrops: Array<{ id: string; amount: number }>;
};

export type RewardRange = {
  minCoins: number;
  maxCoins: number;
  minExp: number;
  maxExp: number;
};

const DIFFICULTY_RANGES: Record<RewardDifficulty, { min: number; max: number }> = {
  tiny: { min: 10, max: 20 },
  small: { min: 10, max: 20 },
  medium: { min: 30, max: 60 },
  large: { min: 60, max: 120 },
  huge: { min: 100, max: 300 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundCoins(value: number) {
  return Math.max(1, Math.round(value));
}

function normalizeMinutes(minutes: number) {
  return Math.max(5, Number.isFinite(minutes) ? minutes : 5);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildResourceDrop(id: string, amount: number) {
  if (!RESOURCE_IDS.includes(id)) return null;
  if (amount <= 0) return null;
  return { id, amount };
}

function normalizeDrops(drops: Array<{ id: string; amount: number } | null>) {
  return drops.filter(Boolean) as Array<{ id: string; amount: number }>;
}

function computeResourceDrops(category: RewardCategory, minutes: number) {
  const intensity = Math.max(1, Math.round(minutes / 20));

  switch (category) {
    case "learning":
      return normalizeDrops([
        buildResourceDrop("insightShard", Math.min(3, intensity)),
        buildResourceDrop("soulShard", intensity >= 2 ? 1 : 0),
      ]);
    case "cleaning":
      return normalizeDrops([
        buildResourceDrop("wood", Math.min(4, intensity + 1)),
        buildResourceDrop("fiber", Math.min(3, intensity)),
        buildResourceDrop("stone", Math.min(2, Math.floor(intensity / 2) + 1)),
      ]);
    case "health":
      return normalizeDrops([buildResourceDrop("energyCrystal", Math.min(3, intensity))]);
    case "english":
      return normalizeDrops([buildResourceDrop("languageRune", Math.min(3, intensity))]);
    case "work":
      return normalizeDrops([
        buildResourceDrop("scrap", intensity >= 2 ? 1 : 0),
        buildResourceDrop("wood", intensity >= 3 ? 1 : 0),
      ]);
    default:
      return normalizeDrops([buildResourceDrop("scrap", intensity >= 3 ? 1 : 0)]);
  }
}

export function estimateRewardRange(input: RewardInput): RewardRange {
  const minutes = normalizeMinutes(input.minutes);
  const range = DIFFICULTY_RANGES[input.difficulty] || DIFFICULTY_RANGES.small;
  const baseValue = (minutes / 60) * 50;
  const minFactor = input.difficulty === "huge" ? 0.8 : 1;
  const maxFactor = input.difficulty === "huge" ? 1.2 : 1;

  const minBase = clamp(baseValue * minFactor, range.min, range.max);
  const maxBase = clamp(baseValue * maxFactor, range.min, range.max);
  const multiplier = input.category === "work" ? 1.15 : 1;
  const minCoins = roundCoins(minBase * multiplier);
  const maxCoins = roundCoins(maxBase * multiplier);
  const minExp = roundCoins(minCoins * 0.8);
  const maxExp = roundCoins(maxCoins * 0.8);

  return { minCoins, maxCoins, minExp, maxExp };
}

export function computeReward(input: RewardInput): RewardOutput {
  const minutes = normalizeMinutes(input.minutes);
  const range = DIFFICULTY_RANGES[input.difficulty] || DIFFICULTY_RANGES.small;

  const baseValue = (minutes / 60) * 50;
  let coins = clamp(baseValue, range.min, range.max);

  if (input.difficulty === "huge") {
    const randomFactor = randomBetween(0.8, 1.2);
    coins = clamp(coins * randomFactor, range.min, range.max);
  }

  if (input.category === "work") {
    coins = coins * 1.15;
  }

  const finalCoins = roundCoins(coins);
  const expMultiplier = input.category === "context" ? 1.15 : 1;
  const exp = roundCoins(finalCoins * 0.8 * expMultiplier);

  return {
    coins: finalCoins,
    exp,
    resourceDrops: computeResourceDrops(input.category, minutes),
  };
}
