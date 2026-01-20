import { safeLoad, safeSave } from "../lib/storage";

const GAME_START_DATE_KEY = "lifeup.gameStartDate.v1";
const GAME_DAY_KEY_STORAGE = "lifeup.gameDayKey.v1";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getNow() {
  return new Date();
}

export function getTodayKey(now = getNow()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDayKey(key) {
  return typeof key === "string" && DAY_KEY_REGEX.test(key);
}

function toLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getGameStartDate() {
  if (typeof window === "undefined") return getNow();

  const stored = safeLoad(GAME_START_DATE_KEY, "", (raw) => raw);
  if (stored) {
    const parsed = new Date(stored);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const now = getNow();
  safeSave(GAME_START_DATE_KEY, now.toISOString());
  return now;
}

export function setGameStartDate(date) {
  if (typeof window === "undefined") return getNow();
  const nextDate = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(nextDate.getTime()) ? getNow() : nextDate;
  safeSave(GAME_START_DATE_KEY, safeDate.toISOString());
  return safeDate;
}

export function getDayIndex(now = getNow()) {
  const startDate = getGameStartDate();
  const todayMidnight = toLocalMidnight(now);
  const startMidnight = toLocalMidnight(startDate);
  const diff = todayMidnight.getTime() - startMidnight.getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

export function getGameDayKey(now = getNow()) {
  if (typeof window === "undefined") {
    return getTodayKey(now);
  }
  const stored = safeLoad(GAME_DAY_KEY_STORAGE, "", (raw) => raw);
  if (stored && isValidDayKey(stored)) return stored;
  const today = getTodayKey(now);
  safeSave(GAME_DAY_KEY_STORAGE, today);
  return today;
}

export function setGameDayKey(nextKey) {
  if (typeof window === "undefined") return nextKey;
  const key = isValidDayKey(nextKey) ? nextKey : getTodayKey();
  safeSave(GAME_DAY_KEY_STORAGE, key);
  return key;
}

export function canAdvanceGameDay(now = getNow()) {
  const todayKey = getTodayKey(now);
  const gameDayKey = getGameDayKey(now);
  if (!isValidDayKey(gameDayKey)) {
    setGameDayKey(todayKey);
    return false;
  }
  return todayKey > gameDayKey;
}

export { GAME_START_DATE_KEY, GAME_DAY_KEY_STORAGE };
