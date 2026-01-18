const GAME_START_DATE_KEY = "lifeup.gameStartDate.v1";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getNow() {
  return new Date();
}

export function getTodayKey(now = getNow()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getGameStartDate() {
  if (typeof window === "undefined") return getNow();

  try {
    const stored = localStorage.getItem(GAME_START_DATE_KEY);
    if (stored) {
      const parsed = new Date(stored);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to read game start date", error);
  }

  const now = getNow();
  try {
    localStorage.setItem(GAME_START_DATE_KEY, now.toISOString());
  } catch (error) {
    console.error("Failed to store game start date", error);
  }
  return now;
}

export function setGameStartDate(date) {
  if (typeof window === "undefined") return getNow();
  const nextDate = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(nextDate.getTime()) ? getNow() : nextDate;
  try {
    localStorage.setItem(GAME_START_DATE_KEY, safeDate.toISOString());
  } catch (error) {
    console.error("Failed to store game start date", error);
  }
  return safeDate;
}

export function getDayIndex(now = getNow()) {
  const startDate = getGameStartDate();
  const todayMidnight = toLocalMidnight(now);
  const startMidnight = toLocalMidnight(startDate);
  const diff = todayMidnight.getTime() - startMidnight.getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

export { GAME_START_DATE_KEY };
