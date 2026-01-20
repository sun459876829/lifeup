export const BASE_COINS_PER_HOUR = 50;
export const DEFAULT_COINS_PER_YUAN = 10;
export const ECONOMY_SETTINGS_KEY = "lifeup.economy.settings.v1";

export function loadCoinsPerYuan() {
  if (typeof window === "undefined") return DEFAULT_COINS_PER_YUAN;
  try {
    const raw = localStorage.getItem(ECONOMY_SETTINGS_KEY);
    if (!raw) return DEFAULT_COINS_PER_YUAN;
    const parsed = JSON.parse(raw);
    const value = Number(parsed?.coinsPerYuan);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_COINS_PER_YUAN;
  } catch {
    return DEFAULT_COINS_PER_YUAN;
  }
}

export function saveCoinsPerYuan(coinsPerYuan) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ECONOMY_SETTINGS_KEY,
      JSON.stringify({ coinsPerYuan })
    );
  } catch {
    // ignore
  }
}
