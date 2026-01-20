import { safeLoad, safeSave } from "@/lib/storage";

export const BASE_COINS_PER_HOUR = 50;
export const DEFAULT_COINS_PER_YUAN = 10;
export const ECONOMY_SETTINGS_KEY = "lifeup.economy.settings.v1";

export function loadCoinsPerYuan() {
  return safeLoad(ECONOMY_SETTINGS_KEY, DEFAULT_COINS_PER_YUAN, (raw) => {
    const parsed = JSON.parse(raw);
    const value = Number(parsed?.coinsPerYuan);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_COINS_PER_YUAN;
  });
}

export function saveCoinsPerYuan(coinsPerYuan) {
  safeSave(ECONOMY_SETTINGS_KEY, { coinsPerYuan });
}
