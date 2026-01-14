const SIZE_BASELINE = {
  small: { exp: 6, coins: 4, sanity: 2, energy: -2 },
  medium: { exp: 12, coins: 10, sanity: 4, energy: -5 },
  large: { exp: 20, coins: 18, sanity: 6, energy: -10 },
};

function clampDifficulty(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 3;
  return Math.min(5, Math.max(1, parsed));
}

export function computeRewardsForTask({ size, difficulty }) {
  if (!size || !difficulty) return null;
  const base = SIZE_BASELINE[size] || SIZE_BASELINE.small;
  const diff = clampDifficulty(difficulty);
  const factor = 0.8 + 0.1 * (diff - 1);
  const exp = Math.round(base.exp * factor);
  const coinsReward = Math.round(base.coins * factor);
  const sanity = Math.round(base.sanity + Math.max(0, diff - 2));
  const energy = Math.round(base.energy - Math.max(0, diff - 3) * 2);

  return {
    exp,
    coinsReward,
    effect: {
      sanity,
      energy,
    },
  };
}
