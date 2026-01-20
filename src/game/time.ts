const GAME_START_DATE_KEY = "lifeup.gameStartDate.v1";
const GAME_DAY_KEY_STORAGE = "lifeup.gameDayKey.v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let gameStart: Date | null = null;

export function getNow(): Date {
  return new Date();
}

export function getTodayKey(now: Date = getNow()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getGameStartDate(): Date {
  if (typeof window === "undefined") {
    return getNow();
  }

  if (!gameStart) {
    try {
      const stored = localStorage.getItem(GAME_START_DATE_KEY);
      if (stored) {
        const parsed = new Date(stored);
        if (!Number.isNaN(parsed.getTime())) {
          gameStart = parsed;
        }
      }
    } catch (error) {
      console.error("Failed to read game start date", error);
    }

    if (!gameStart) {
      gameStart = getNow();
      try {
        localStorage.setItem(GAME_START_DATE_KEY, gameStart.toISOString());
      } catch (error) {
        console.error("Failed to store game start date", error);
      }
    }
  }

  return gameStart;
}

export function setGameStartDate(date: Date): Date {
  if (typeof window === "undefined") {
    return getNow();
  }

  const nextDate = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(nextDate.getTime()) ? getNow() : nextDate;
  gameStart = safeDate;

  try {
    localStorage.setItem(GAME_START_DATE_KEY, safeDate.toISOString());
  } catch (error) {
    console.error("Failed to store game start date", error);
  }

  return safeDate;
}

export function getDayIndex(now: Date = getNow()): number {
  const startDate = getGameStartDate();
  const todayMidnight = toLocalMidnight(now);
  const startMidnight = toLocalMidnight(startDate);
  const diff = todayMidnight.getTime() - startMidnight.getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

export function getGameDayKey(now: Date = getNow()): string {
  if (typeof window === "undefined") {
    return getTodayKey(now);
  }
  try {
    const stored = localStorage.getItem(GAME_DAY_KEY_STORAGE);
    if (stored) return stored;
  } catch (error) {
    console.error("Failed to read game day key", error);
  }
  const today = getTodayKey(now);
  try {
    localStorage.setItem(GAME_DAY_KEY_STORAGE, today);
  } catch (error) {
    console.error("Failed to store game day key", error);
  }
  return today;
}

export function setGameDayKey(nextKey: string): string {
  if (typeof window === "undefined") return nextKey;
  const key = nextKey || getTodayKey();
  try {
    localStorage.setItem(GAME_DAY_KEY_STORAGE, key);
  } catch (error) {
    console.error("Failed to store game day key", error);
  }
  return key;
}

export function canAdvanceGameDay(now: Date = getNow()): boolean {
  const todayKey = getTodayKey(now);
  const gameDayKey = getGameDayKey(now);
  return todayKey > gameDayKey;
}

export { GAME_START_DATE_KEY, GAME_DAY_KEY_STORAGE };
