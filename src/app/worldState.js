"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RANDOM_EVENTS } from "./gameConfig/randomEventsConfig";
import { ACHIEVEMENTS_CONFIG } from "./gameConfig/achievementsConfig";
import { getSanityGain, resolveTaskKind, STAT_LIMITS } from "../game/config";
import {
  computeRewards,
  loadAllTasks,
  normalizeTaskPriority,
  resolveDifficultyValue,
} from "../lib/loadTasks";
import {
  getStreakRewardMultiplier,
  normalizeTaskStreak,
  resetMissedTaskStreak,
  updateTaskStreak,
} from "../engine/habitEngine";
import {
  loadHistory,
  pushHistory as pushHistoryEntry,
  undoLastAction as undoHistoryLastAction,
  undoHistoryItem as undoHistoryItemAction,
} from "../game/history";
import { getDayIndex, getNow, getTodayKey } from "../game/time";

const STORAGE_KEY = "lifeup.arcane.v4";
const LEGACY_KEYS = ["lifeup.arcane.v3", "lifeup.world.v1", "lifeup.magicworld.v1"];

const DEFAULT_STATS = {
  life: 80,
  sanity: 70,
  hunger: 70,
};

const DEFAULT_WORLD = {
  day: 0,
  randomEvent: null,
  lastRefreshDay: null,
};

const DEFAULT_BURST = {
  lastKind: null,
  comboCount: 0,
};

const TASK_CONFIG = loadAllTasks();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function clampStat(value, maxValue) {
  return Math.max(0, Math.min(maxValue, Math.round(value)));
}

function clampStats(stats) {
  return {
    life: clampStat(stats.life, STAT_LIMITS.life),
    sanity: clampStat(stats.sanity, STAT_LIMITS.sanity),
    hunger: clampStat(stats.hunger, STAT_LIMITS.hunger),
  };
}

function normalizeBurst(burst) {
  if (!burst || typeof burst !== "object") {
    return { ...DEFAULT_BURST };
  }
  return {
    lastKind: burst.lastKind ?? null,
    comboCount: burst.comboCount ?? 0,
  };
}

function initializeAchievements(existing = []) {
  const existingMap = new Map(existing.map((item) => [item.key, item]));
  return ACHIEVEMENTS_CONFIG.map((template) => {
    const prior = existingMap.get(template.key);
    return {
      key: template.key,
      name: template.name,
      description: template.description,
      target: template.target,
      progress: prior?.progress ?? 0,
      unlocked: prior?.unlocked ?? false,
      unlockedAt: prior?.unlockedAt,
    };
  });
}

function normalizeStats(stats = {}) {
  return clampStats({
    life: stats.life ?? stats.health ?? DEFAULT_STATS.life,
    sanity: stats.sanity ?? DEFAULT_STATS.sanity,
    hunger: stats.hunger ?? DEFAULT_STATS.hunger,
  });
}

function normalizeTaskMeta(task) {
  const difficultyKey = computeRewards(task?.difficulty).difficultyKey;
  return {
    minutes: Number(task.minutes) || 10,
    difficulty: difficultyKey,
    difficultyValue: resolveDifficultyValue(difficultyKey),
    kind: resolveTaskKind(task.category, task.kind),
  };
}

function normalizeTaskStreakState(task) {
  const streak = normalizeTaskStreak(task?.streak);
  return {
    streak,
    streakActive: task?.streakActive ?? streak.count >= 3,
  };
}

function createDefaultState() {
  return {
    stats: { ...DEFAULT_STATS },
    world: { ...DEFAULT_WORLD },
    currency: { coins: 0 },
    exp: 0,
    tickets: { game: 0 },
    tasks: [],
    completedTasks: [],
    treasureMaps: [],
    claims: [],
    achievements: initializeAchievements(),
    burst: { ...DEFAULT_BURST },
    history: [],
  };
}

function normalizeTreasureMap(map) {
  return {
    id: map.id || newId(),
    name: map.name || "未知藏宝图",
    tier: map.tier || "B",
    source: map.source || "event",
    status: map.status || "new",
    targetTasks: map.targetTasks || 5,
    completedTasks: map.completedTasks || 0,
    baseReward: map.baseReward || {},
    bigReward: map.bigReward || {},
    targetCategories: Array.isArray(map.targetCategories) ? map.targetCategories : undefined,
    triggerKey: map.triggerKey,
  };
}

function buildHistoryEntry(record) {
  if (!record) return null;
  return {
    id: record.id || newId(),
    type: record.type,
    payload: record.payload || {},
    timestamp: record.timestamp || Date.now(),
  };
}

function removeCompletedEntry(list, taskId, completedAt) {
  if (!Array.isArray(list)) return [];
  const index = list.findIndex(
    (entry) => entry.taskId === taskId && (completedAt ? entry.completedAt === completedAt : true)
  );
  if (index < 0) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

function migrateLegacyState(raw) {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

  const coins = raw.currency?.coins ?? raw.coins ?? base.currency.coins;
  const exp = raw.exp ?? raw.xp ?? base.exp;
  const tickets = {
    game: raw.tickets?.game ?? base.tickets.game,
  };
  const claims = Array.isArray(raw.claims) ? raw.claims : [];

  let tasks = [];
  if (Array.isArray(raw.tasks)) {
    tasks = raw.tasks.map((task) => {
      const isRepeatable = task.type === "repeat" || task.isRepeatable;
      const status = task.status || "todo";
      const meta = normalizeTaskMeta(task);
      const streakState = normalizeTaskStreakState(task);
      return {
        id: task.id || newId(),
        title: task.title || "未命名任务",
        category: task.category || "other",
        subtype: task.subtype,
        status,
        isRepeatable,
        createdAt: task.createdAt || Date.now(),
        completedAt: task.completedAt,
        exp: task.rewardXp || task.exp || 0,
        coinsReward: task.rewardCoins || task.coinsReward || 0,
        effect: task.effect || undefined,
        lastCompletedAt: task.lastCompletedAt || undefined,
        priority: normalizeTaskPriority(task.priority),
        streak: streakState.streak,
        streakActive: streakState.streakActive,
        minutes: meta.minutes,
        difficulty: meta.difficulty,
        difficultyValue: meta.difficultyValue,
        kind: meta.kind,
      };
    });
  }

  const completedTasks = tasks
    .filter((task) => task.status === "done")
    .map((task) => ({
      id: newId(),
      taskId: task.id,
      title: task.title,
      category: task.category,
      completedAt: task.completedAt || Date.now(),
      day: base.world.day,
      exp: task.exp,
      coins: task.coinsReward || 0,
      tags: task.tags || [],
    }));

  const treasureMaps = Array.isArray(raw.treasureMaps)
    ? raw.treasureMaps.map((map) =>
        normalizeTreasureMap({
          id: map.id,
          name: map.name,
          tier: map.tier,
          source: map.source,
          status: map.status,
          targetTasks: map.targetTasks || map.condition?.tasksNeeded,
          completedTasks: map.completedTasks || 0,
          baseReward: map.baseReward || {},
          bigReward: map.bigReward || {},
          targetCategories: map.targetCategories,
        })
      )
    : [];

  return {
    ...base,
    currency: { coins },
    exp,
    tickets,
    claims,
    tasks,
    completedTasks,
    treasureMaps,
    stats: normalizeStats(raw.stats || raw),
  };
}

function loadState() {
  if (typeof window === "undefined") return createDefaultState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const world = { ...DEFAULT_WORLD, ...(parsed.world || {}) };
      return {
        ...createDefaultState(),
        ...parsed,
        stats: normalizeStats(parsed.stats || parsed),
        world,
        currency: { coins: parsed.currency?.coins ?? 0 },
        exp: parsed.exp ?? parsed.xp ?? 0,
        tickets: { game: parsed.tickets?.game ?? 0 },
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks.map((task) => ({
              ...task,
              ...normalizeTaskMeta(task),
              ...normalizeTaskStreakState(task),
            }))
          : [],
        completedTasks: Array.isArray(parsed.completedTasks) ? parsed.completedTasks : [],
        treasureMaps: Array.isArray(parsed.treasureMaps)
          ? parsed.treasureMaps.map(normalizeTreasureMap)
          : [],
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
        achievements: initializeAchievements(parsed.achievements),
        burst: normalizeBurst(parsed.burst),
        history: loadHistory(),
      };
    }

    for (const key of LEGACY_KEYS) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        const migrated = migrateLegacyState(legacyParsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (error) {
    console.error("Failed to load world state", error);
  }

  return createDefaultState();
}

function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    const { history, ...rest } = state || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (error) {
    console.error("Failed to save world state", error);
  }
}

function pickRandomEvent() {
  if (!RANDOM_EVENTS.length) return null;
  const idx = Math.floor(Math.random() * RANDOM_EVENTS.length);
  return RANDOM_EVENTS[idx];
}

function calculateRewardModifier(randomEvent, taskCategory) {
  if (!randomEvent?.taskRewardModifier) return { expMultiplier: 1, coinMultiplier: 1, expBonus: 0 };
  const { categories, expMultiplier, coinMultiplier, expBonus } = randomEvent.taskRewardModifier;
  const applies = !categories || categories.length === 0 || categories.includes(taskCategory);
  return applies
    ? {
        expMultiplier: expMultiplier ?? 1,
        coinMultiplier: coinMultiplier ?? 1,
        expBonus: expBonus ?? 0,
      }
    : { expMultiplier: 1, coinMultiplier: 1, expBonus: 0 };
}

function normalizeTaskEffect(task) {
  const effect = task.effect || {};
  return {
    hunger: Math.max(0, effect.hunger || 0),
    sanity: Math.max(0, effect.sanity || 0),
    life: Math.max(0, effect.life || effect.health || 0),
  };
}

function computeAchievementProgress(state, template) {
  const { completedTasks, world } = state;

  if (template.type === "tag_count") {
    const count = completedTasks.filter((task) => task.tags?.includes(template.tag)).length;
    return {
      progress: Math.min(count, template.target),
      unlockedNow: count >= template.target,
    };
  }

  if (template.type === "course_streak") {
    const daysWithCourse = new Set(
      completedTasks
        .filter((task) => task.category === "course")
        .map((task) => task.day)
    );
    let streak = 0;
    for (let day = world.day; day >= 0; day -= 1) {
      if (daysWithCourse.has(day)) {
        streak += 1;
      } else {
        break;
      }
    }
    return { progress: Math.min(streak, template.target), unlockedNow: streak >= template.target };
  }

  if (template.type === "course_daily") {
    const count = completedTasks.filter(
      (task) => task.category === "course" && task.day === world.day
    ).length;
    return {
      progress: Math.min(count, template.target),
      unlockedNow: count >= template.target,
    };
  }

  if (template.type === "no_tag_days") {
    const taggedTasks = completedTasks.filter((task) => task.tags?.includes(template.tag));
    const lastDay = taggedTasks.reduce((latest, task) => Math.max(latest, task.day || 0), 0);
    const daysWithout = Math.max(world.day - lastDay, 0);
    return {
      progress: Math.min(daysWithout, template.target),
      unlockedNow: daysWithout >= template.target,
    };
  }

  return { progress: 0, unlockedNow: false };
}

function applyAchievementRewards(state, template) {
  if (!template.reward) return state;
  const reward = template.reward;
  const updated = { ...state };

  if (reward.coins) {
    updated.currency = {
      ...updated.currency,
      coins: updated.currency.coins + reward.coins,
    };
  }

  if (reward.stats) {
    updated.stats = clampStats({
      ...updated.stats,
      hunger: updated.stats.hunger + (reward.stats.hunger || 0),
      sanity: updated.stats.sanity + (reward.stats.sanity || 0),
      life: updated.stats.life + (reward.stats.life || reward.stats.health || 0),
    });
  }

  if (reward.claimName) {
    updated.claims = [
      ...(updated.claims || []),
      {
        id: newId(),
        type: "achievement",
        name: reward.claimName,
        ts: Date.now(),
      },
    ];
  }

  return updated;
}

function recalculateAchievements(state) {
  let updatedState = { ...state };

  const updatedAchievements = ACHIEVEMENTS_CONFIG.map((template) => {
    const existing = state.achievements.find((item) => item.key === template.key);
    if (existing?.unlocked) {
      return { ...existing, target: template.target };
    }

    const { progress, unlockedNow } = computeAchievementProgress(state, template);
    if (unlockedNow) {
      updatedState = applyAchievementRewards(updatedState, template);
    }

    return {
      key: template.key,
      name: template.name,
      description: template.description,
      target: template.target,
      progress,
      unlocked: unlockedNow,
      unlockedAt: unlockedNow ? Date.now() : undefined,
    };
  });

  updatedState.achievements = updatedAchievements;
  return updatedState;
}

function applyTreasureMapRewards(state, map) {
  let updatedState = { ...state };
  if (map.baseReward?.coins) {
    updatedState.currency = {
      ...updatedState.currency,
      coins: updatedState.currency.coins + map.baseReward.coins,
    };
  }
  if (map.baseReward?.sanity || map.baseReward?.health || map.baseReward?.life) {
    updatedState.stats = clampStats({
      ...updatedState.stats,
      sanity: updatedState.stats.sanity + (map.baseReward.sanity || 0),
      life: updatedState.stats.life + (map.baseReward.life || map.baseReward.health || 0),
    });
  }
  if (map.baseReward?.claimName) {
    updatedState.claims = [
      ...(updatedState.claims || []),
      {
        id: newId(),
        type: "treasure",
        name: map.baseReward.claimName,
        ts: Date.now(),
      },
    ];
  }
  return updatedState;
}

function applyNewTreasureMap(state, mapInput) {
  const newMap = normalizeTreasureMap({
    ...mapInput,
    status: "new",
    completedTasks: 0,
  });

  let updatedState = {
    ...state,
    treasureMaps: [newMap, ...(state.treasureMaps || [])],
  };
  updatedState = applyTreasureMapRewards(updatedState, newMap);
  return updatedState;
}

function maybeTriggerTreasureMaps(state, taskContext) {
  const existingKeys = new Set(
    (state.treasureMaps || []).map((map) => map.triggerKey).filter(Boolean)
  );

  const completed = state.completedTasks || [];
  const bySubtype = (subtype) =>
    completed.filter((task) => task.category === "course" && task.subtype === subtype).length;

  let updatedState = state;

  if (bySubtype("曲曲") >= 5 && !existingKeys.has("course_ququ_5")) {
    updatedState = applyNewTreasureMap(updatedState, {
      triggerKey: "course_ququ_5",
      name: "曲曲远征图",
      tier: "A",
      source: "project",
      targetTasks: 6,
      targetCategories: ["course"],
      baseReward: { coins: 40, sanity: 6, claimName: "🎁 曲曲远征基础礼" },
      bigReward: { coins: 160, sanity: 10, claimName: "✨ 曲曲远征宝箱" },
    });
  }

  if (bySubtype("开智") >= 5 && !existingKeys.has("course_kaizhi_5")) {
    updatedState = applyNewTreasureMap(updatedState, {
      triggerKey: "course_kaizhi_5",
      name: "开智远征图",
      tier: "A",
      source: "project",
      targetTasks: 6,
      targetCategories: ["course"],
      baseReward: { coins: 45, sanity: 6, claimName: "🎁 开智远征基础礼" },
      bigReward: { coins: 180, sanity: 12, claimName: "✨ 开智远征宝箱" },
    });
  }

  const roomCleanupCount = completed.filter((task) => task.tags?.includes("room_cleanup")).length;
  if (roomCleanupCount >= 6 && !existingKeys.has("room_cleanup_6")) {
    updatedState = applyNewTreasureMap(updatedState, {
      triggerKey: "room_cleanup_6",
      name: "净化远征图",
      tier: "B",
      source: "event",
      targetTasks: 5,
      targetCategories: ["life"],
      baseReward: { coins: 30, sanity: 5, claimName: "🧹 净化之礼" },
      bigReward: { coins: 120, life: 8, claimName: "🗝 净化宝箱" },
    });
  }

  if (taskContext?.category === "course") {
    const streakAchievement = updatedState.achievements.find((ach) => ach.key === "course_3days");
    if (streakAchievement?.unlocked && !existingKeys.has("course_streak_3")) {
      updatedState = applyNewTreasureMap(updatedState, {
        triggerKey: "course_streak_3",
        name: "学徒远征图",
        tier: "B",
        source: "event",
        targetTasks: 4,
        targetCategories: ["course", "english"],
        baseReward: { coins: 25, sanity: 4, claimName: "📜 学徒远征启程礼" },
        bigReward: { coins: 100, sanity: 8, claimName: "📜 学徒远征宝箱" },
      });
    }
  }

  return updatedState;
}

const WorldContext = createContext(null);

export function WorldProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(null);
  const [timeState, setTimeState] = useState(() => {
    const now = getNow();
    return {
      now,
      todayKey: getTodayKey(now),
      dayIndex: getDayIndex(now),
    };
  });

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !state) return;
    saveState(state);
  }, [hydrated, state]);

  const refreshTime = useCallback(() => {
    const now = getNow();
    const todayKey = getTodayKey(now);
    const dayIndex = getDayIndex(now);
    setTimeState({ now, todayKey, dayIndex });

    setState((prev) => {
      if (!prev) return prev;

      const lastRefreshDay = prev.world?.lastRefreshDay;
      const dayChanged = prev.world?.day !== dayIndex;
      const needsRefresh = lastRefreshDay !== todayKey;

      if (!dayChanged && !needsRefresh) {
        return prev;
      }

      let nextStats = prev.stats;
      let nextRandomEvent = prev.world?.randomEvent;

      if (needsRefresh) {
        nextRandomEvent = pickRandomEvent();
        if (nextRandomEvent?.effectOnStats) {
          nextStats = clampStats({
            ...nextStats,
            hunger: nextStats.hunger + (nextRandomEvent.effectOnStats.hunger || 0),
            sanity: nextStats.sanity + (nextRandomEvent.effectOnStats.sanity || 0),
            life: nextStats.life + (nextRandomEvent.effectOnStats.life || 0),
          });
        }
      }

      const nextState = {
        ...prev,
        stats: nextStats,
        tasks: dayChanged
          ? (prev.tasks || []).map((task) => resetMissedTaskStreak(task, prev.world?.day))
          : prev.tasks,
        world: {
          ...prev.world,
          day: dayIndex,
          randomEvent: nextRandomEvent,
          lastRefreshDay: needsRefresh ? todayKey : prev.world?.lastRefreshDay,
        },
        burst: normalizeBurst(prev.burst),
      };

      return recalculateAchievements(nextState);
    });

    return { now, todayKey, dayIndex };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    refreshTime();
    const interval = setInterval(refreshTime, 45000);
    return () => clearInterval(interval);
  }, [hydrated, refreshTime]);

  const changeStats = useCallback((delta) => {
    if (!state) return;
    setState((prev) => {
      const updated = {
        ...prev.stats,
        hunger: prev.stats.hunger + (delta.hunger || 0),
        sanity: prev.stats.sanity + (delta.sanity || 0),
        life: prev.stats.life + (delta.life || delta.health || 0),
      };
      return { ...prev, stats: clampStats(updated) };
    });
  }, [state]);

  const addCoins = useCallback((amount, reason = "manual_adjust") => {
    if (!state || !amount) return;
    setState((prev) => {
      const nextHistory = pushHistoryEntry(
        buildHistoryEntry({
          type: "reward_gain",
          payload: {
            amount,
            reason,
          },
        }),
        prev.history
      );
      return {
        ...prev,
        history: nextHistory,
        currency: {
          ...prev.currency,
          coins: prev.currency.coins + amount,
        },
      };
    });
  }, [state]);

  const grantExp = useCallback((amount, reason = "batch_bonus") => {
    if (!state || !amount) return;
    const normalizedAmount = Math.max(0, Math.round(amount));
    if (!normalizedAmount) return;
    setState((prev) => {
      const nextHistory = pushHistoryEntry(
        buildHistoryEntry({
          type: "exp_gain",
          payload: {
            amount: normalizedAmount,
            reason,
          },
        }),
        prev.history
      );
      return {
        ...prev,
        history: nextHistory,
        exp: (prev.exp || 0) + normalizedAmount,
      };
    });
  }, [state]);

  const spendCoins = useCallback((amount, reason = "manual_adjust") => {
    if (!state || amount <= 0) return false;
    if (state.currency.coins < amount) return false;
    setState((prev) => {
      const nextHistory = pushHistoryEntry(
        {
          type: "coins_change",
          payload: {
            delta: -amount,
            reason,
          },
          undo: {
            type: "reverse_coins_change",
            payload: {
              delta: -amount,
            },
          },
        },
        prev.history
      );
      return {
        ...prev,
        history: nextHistory,
        currency: {
          ...prev.currency,
          coins: prev.currency.coins - amount,
        },
      };
    });
    return true;
  }, [state]);

  const exchangeCoinsForGameTicket = useCallback((cost = 50) => {
    if (!state) return { ok: false, message: "世界尚未加载" };
    let result = { ok: false, message: "魔力币不足，无法兑换游戏券" };

    setState((prev) => {
      if (prev.currency.coins < cost) {
        result = { ok: false, message: "魔力币不足，无法兑换游戏券" };
        return prev;
      }

      const beforeCoins = prev.currency.coins;
      const afterCoins = beforeCoins - cost;
      result = { ok: true, message: "✅ 已兑换 1 张游戏券" };

      return {
        ...prev,
        currency: {
          ...prev.currency,
          coins: afterCoins,
        },
        tickets: {
          ...prev.tickets,
          game: (prev.tickets?.game || 0) + 1,
        },
      };
    });

    return result;
  }, [state]);

  const useGameTicket = useCallback(() => {
    if (!state) return { ok: false, message: "世界尚未加载" };
    let result = { ok: false, message: "你今天还没通过做任务赚到游戏券，要不要先做点事再玩？" };

    setState((prev) => {
      const currentTickets = prev.tickets?.game || 0;
      if (currentTickets <= 0) {
        result = { ok: false, message: "你今天还没通过做任务赚到游戏券，要不要先做点事再玩？" };
        return prev;
      }

      const nextHistory = pushHistoryEntry(
        {
          type: "ticket_use",
          payload: {
            ticketId: "game",
            ticketName: "游戏券",
            delta: -1,
          },
          undo: {
            type: "revert_ticket_use",
            payload: {
              ticketId: "game",
              delta: -1,
              previousCount: currentTickets,
            },
          },
        },
        prev.history
      );
      result = { ok: true, message: "🎮 你使用了 1 张游戏券，可以安心玩一会儿游戏了" };

      return {
        ...prev,
        history: nextHistory,
        tickets: {
          ...prev.tickets,
          game: currentTickets - 1,
        },
      };
    });

    return result;
  }, [state]);

  const registerTask = useCallback((taskInput) => {
    if (!state || !taskInput) return null;

    const template = taskInput.templateId ? TASK_CONFIG[taskInput.templateId] : null;
    const baseDifficulty = taskInput.difficulty ?? template?.difficulty;
    const meta = normalizeTaskMeta({
      ...template,
      ...taskInput,
      difficulty: baseDifficulty,
    });
    const baseReward = computeRewards(baseDifficulty);
    const sanityBonus = getSanityGain(meta.difficultyValue);
    const instanceId = newId();
    const streakState = normalizeTaskStreakState(taskInput);

    const created = {
      id: instanceId,
      instanceId,
      templateId: template?.templateId || taskInput.templateId,
      title: template?.name || taskInput.title || "未命名任务",
      category: template?.category || taskInput.category || "other",
      notes: taskInput.notes || "",
      subtype: taskInput.subtype || template?.subtype,
      status: "todo",
      isRepeatable: Boolean(template?.repeatable ?? taskInput.isRepeatable ?? taskInput.repeatable),
      createdAt: Date.now(),
      priority: normalizeTaskPriority(template?.priority || taskInput.priority),
      exp: baseReward.exp,
      coinsReward: baseReward.coins,
      effect: template?.effect || taskInput.effect || { sanity: sanityBonus },
      rewardPreview: { coins: baseReward.coins, exp: baseReward.exp },
      lastCompletedAt: taskInput.lastCompletedAt,
      prerequisites: template?.prerequisites || taskInput.prerequisites || [],
      requirements: template?.requirements || taskInput.requirements || {},
      tags: template?.tags || taskInput.tags || [],
      isUserCreated: Boolean(taskInput.isUserCreated),
      size: taskInput.size,
      minutes: meta.minutes,
      difficulty: meta.difficulty,
      difficultyValue: meta.difficultyValue,
      kind: meta.kind,
      streak: streakState.streak,
      streakActive: streakState.streakActive,
      subtasks: template?.subtasks || taskInput.subtasks || [],
    };

    setState((prev) => {
      const nextHistory = pushHistoryEntry(
        buildHistoryEntry({
          type: "task_add",
          payload: {
            taskId: created.id,
            taskTitle: created.title,
            category: created.category,
          },
        }),
        prev.history
      );
      return {
        ...prev,
        tasks: [created, ...(prev.tasks || [])],
        history: nextHistory,
      };
    });

    return created;
  }, [state]);

  const removeTask = useCallback((taskId) => {
    if (!state) return;
    setState((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).filter((task) => task.id !== taskId),
    }));
  }, [state]);

  const completeTask = useCallback((taskId) => {
    if (!state) return { ok: false, message: "世界尚未加载" };

    const task = (state.tasks || []).find((item) => item.id === taskId);
    if (!task) return { ok: false, message: "找不到任务" };
    if (!task.isRepeatable && task.status === "done") {
      return { ok: false, message: "任务已完成" };
    }

    if (task.requirements) {
      const { hunger, sanity, life, health } = task.requirements;
      if (hunger && state.stats.hunger < hunger) {
        return { ok: false, message: "饱食度不足，先补充" };
      }
      if (sanity && state.stats.sanity < sanity) {
        return { ok: false, message: "精神不足，先休息" };
      }
      if ((life || health) && state.stats.life < (life || health)) {
        return { ok: false, message: "生命值不足，先恢复" };
      }
    }

    if (task.prerequisites?.length) {
      const unlockedKeys = new Set(state.achievements.filter((a) => a.unlocked).map((a) => a.key));
      const missing = task.prerequisites.find((key) => !unlockedKeys.has(key));
      if (missing) {
        return { ok: false, message: "前置成就尚未解锁" };
      }
    }

    const normalizedBurst = normalizeBurst(state.burst);
    const normalizedState = normalizedBurst === state.burst ? state : { ...state, burst: normalizedBurst };

    const baseState = normalizedState;

    const rewardModifier = calculateRewardModifier(baseState.world.randomEvent, task.category);
    const meta = normalizeTaskMeta(task);
    const streakUpdate = updateTaskStreak(task, baseState.world.day);
    const streakMultiplier = getStreakRewardMultiplier(streakUpdate.streakActive);
    const burstKind = meta.kind;
    const nextComboCount =
      baseState.burst.lastKind && baseState.burst.lastKind === burstKind
        ? (baseState.burst.comboCount || 0) + 1
        : 1;
    const baseReward = computeRewards(meta.difficulty);
    const burstBonus = Math.min(0.05 * Math.max(0, nextComboCount - 1), 0.5);
    const rewardExp = Math.max(
      0,
      Math.round(
        baseReward.exp * (1 + burstBonus) * rewardModifier.expMultiplier * streakMultiplier
      ) +
        rewardModifier.expBonus
    );
    const rewardCoins = Math.max(
      0,
      Math.round(
        baseReward.coins * (1 + burstBonus) * rewardModifier.coinMultiplier * streakMultiplier
      )
    );

    const completedAt = Date.now();

    const previousStatus = task.status;
    const previousCompletedAt = task.completedAt;
    const previousLastCompletedAt = task.lastCompletedAt;
    const newStatus = task.isRepeatable ? "todo" : "done";

    let updatedTasks = (baseState.tasks || []).map((item) => {
      if (item.id !== taskId) return item;
      if (task.isRepeatable) {
        return {
          ...item,
          status: "todo",
          lastCompletedAt: completedAt,
          streak: streakUpdate.streak,
          streakActive: streakUpdate.streakActive,
        };
      }
      return {
        ...item,
        status: "done",
        completedAt,
        lastCompletedAt: completedAt,
        streak: streakUpdate.streak,
        streakActive: streakUpdate.streakActive,
      };
    });

    const taskEffect = normalizeTaskEffect(task);

    const updatedBurst = {
      lastKind: burstKind,
      comboCount: nextComboCount,
    };

    const baseSanityGain = getSanityGain(meta.difficultyValue);

    const updatedStats = clampStats({
      ...baseState.stats,
      hunger: baseState.stats.hunger + (taskEffect.hunger || 0),
      sanity: baseState.stats.sanity + (taskEffect.sanity || 0) + baseSanityGain,
      life: baseState.stats.life + (taskEffect.life || 0),
    });
    const statsDelta = {
      hunger: updatedStats.hunger - baseState.stats.hunger,
      sanity: updatedStats.sanity - baseState.stats.sanity,
      life: updatedStats.life - baseState.stats.life,
    };

    const completedEntry = {
      id: newId(),
      taskId: task.id,
      templateId: task.templateId,
      title: task.title,
      category: task.category,
      subtype: task.subtype,
      completedAt,
      day: baseState.world.day,
      exp: rewardExp,
      coins: rewardCoins,
      tags: task.tags || [],
    };

    const nextHistory = pushHistoryEntry(
      buildHistoryEntry({
        type: "task_complete",
        payload: {
          taskId: task.id,
          templateId: task.templateId,
          taskTitle: task.title,
          previousStatus,
          newStatus,
          completedAt,
          previousCompletedAt,
          previousLastCompletedAt,
        },
      }),
      baseState.history
    );

    let nextState = {
      ...baseState,
      stats: updatedStats,
      tasks: updatedTasks,
      completedTasks: [completedEntry, ...(baseState.completedTasks || [])],
      currency: {
        ...baseState.currency,
        coins: baseState.currency.coins + rewardCoins,
      },
      exp: (baseState.exp || 0) + rewardExp,
      burst: updatedBurst,
      history: nextHistory,
    };

    nextState = progressTreasureMapsInternal(nextState, task);
    nextState = recalculateAchievements(nextState);
    nextState = maybeTriggerTreasureMaps(nextState, task);

    setState(nextState);

    return {
      ok: true,
      rewardExp,
      rewardCoins,
      burstBonus,
      comboCount: nextComboCount,
    };
  }, [state]);

  const progressTreasureMapsInternal = (currentState, taskContext) => {
    if (!currentState.treasureMaps?.length) return currentState;

    const updatedMaps = currentState.treasureMaps.map((map) => {
      if (map.status === "completed") return map;
      const categories = map.targetCategories;
      const matchesCategory = !categories || categories.length === 0 || categories.includes(taskContext.category);
      if (!matchesCategory) return map;
      const completed = Math.min(map.completedTasks + 1, map.targetTasks);
      return {
        ...map,
        completedTasks: completed,
        status: map.status === "new" ? "active" : map.status,
      };
    });

    return { ...currentState, treasureMaps: updatedMaps };
  };

  const progressTreasureMaps = useCallback((taskContext) => {
    if (!state) return;
    setState((prev) => progressTreasureMapsInternal(prev, taskContext));
  }, [state]);

  const addTreasureMap = useCallback((mapInput) => {
    if (!state) return null;

    const newMap = normalizeTreasureMap({
      ...mapInput,
      status: "new",
      completedTasks: 0,
    });

    let updatedState = {
      ...state,
      treasureMaps: [newMap, ...(state.treasureMaps || [])],
    };

    if (newMap.baseReward?.coins) {
      updatedState.currency = {
        ...updatedState.currency,
        coins: updatedState.currency.coins + newMap.baseReward.coins,
      };
    }

    if (newMap.baseReward?.sanity || newMap.baseReward?.health || newMap.baseReward?.life) {
      updatedState.stats = clampStats({
        ...updatedState.stats,
        sanity: updatedState.stats.sanity + (newMap.baseReward.sanity || 0),
        life: updatedState.stats.life + (newMap.baseReward.life || newMap.baseReward.health || 0),
      });
    }

    if (newMap.baseReward?.claimName) {
      updatedState.claims = [
        ...(updatedState.claims || []),
        {
          id: newId(),
          type: "treasure",
          name: newMap.baseReward.claimName,
          ts: Date.now(),
        },
      ];
    }

    setState(updatedState);
    return newMap;
  }, [state]);

  const completeTreasureMap = useCallback((mapId) => {
    if (!state) return { ok: false, message: "世界未加载" };
    const map = (state.treasureMaps || []).find((item) => item.id === mapId);
    if (!map) return { ok: false, message: "找不到藏宝图" };
    if (map.status === "completed") return { ok: false, message: "藏宝图已完成" };
    if (map.completedTasks < map.targetTasks) return { ok: false, message: "进度不足" };

    let updatedState = { ...state };

    if (map.bigReward?.coins) {
      updatedState.currency = {
        ...updatedState.currency,
        coins: updatedState.currency.coins + map.bigReward.coins,
      };
    }

    if (map.bigReward?.sanity || map.bigReward?.health || map.bigReward?.life) {
      updatedState.stats = clampStats({
        ...updatedState.stats,
        sanity: updatedState.stats.sanity + (map.bigReward.sanity || 0),
        life: updatedState.stats.life + (map.bigReward.life || map.bigReward.health || 0),
      });
    }

    if (map.bigReward?.claimName) {
      updatedState.claims = [
        ...(updatedState.claims || []),
        {
          id: newId(),
          type: "treasure",
          name: map.bigReward.claimName,
          ts: Date.now(),
        },
      ];
    }

    updatedState.treasureMaps = (updatedState.treasureMaps || []).map((item) =>
      item.id === mapId ? { ...item, status: "completed" } : item
    );

    setState(updatedState);

    return { ok: true, message: "宝箱开启成功" };
  }, [state]);

  const addClaim = useCallback((claim) => {
    if (!state) return;
    setState((prev) => ({
      ...prev,
      claims: [
        {
          id: newId(),
          type: claim.type || "shop",
          name: claim.name,
          ts: Date.now(),
        },
        ...(prev.claims || []),
      ],
    }));
  }, [state]);

  const useClaim = useCallback((claimId) => {
    if (!state) return;
    setState((prev) => {
      const claim = (prev.claims || []).find((item) => item.id === claimId);
      if (!claim || claim.used) return prev;
      return {
        ...prev,
        claims: (prev.claims || []).map((item) =>
          item.id === claimId ? { ...item, used: true } : item
        ),
      };
    });
  }, [state]);

  const pushHistory = useCallback((entry) => {
    if (!state || !(entry?.type || entry?.kind)) return;
    setState((prev) => ({
      ...prev,
      history: pushHistoryEntry(entry, prev.history),
    }));
  }, [state]);

  const addHistory = useCallback((record) => {
    if (!state) return;
    const entry = buildHistoryEntry(record);
    if (!entry?.type) return;
    setState((prev) => ({
      ...prev,
      history: pushHistoryEntry(entry, prev.history),
    }));
  }, [state]);

  const undoHistory = useCallback((recordId) => {
    if (!state) return { ok: false, error: "世界尚未加载" };
    let result = { ok: false, error: "无法撤销该记录" };

    setState((prev) => {
      if (!prev) return prev;
      const historyList = Array.isArray(prev.history) ? prev.history : [];
      const targetIndex = historyList.findIndex((item) => item.id === recordId);
      if (targetIndex < 0) {
        result = { ok: false, error: "找不到历史记录" };
        return prev;
      }
      const target = historyList[targetIndex];
      if (target?.undone) {
        result = { ok: false, error: "该记录已撤销" };
        return prev;
      }

      const entryType = target.type;
      let nextState = prev;

      if (entryType === "task_complete") {
        const taskId = target.payload?.taskId;
        if (!taskId) {
          result = { ok: false, error: "缺少任务信息" };
          return prev;
        }
        const existing = (prev.tasks || []).find((task) => task.id === taskId);
        if (!existing) {
          result = { ok: false, error: "找不到任务" };
          return prev;
        }
        const updatedTasks = (prev.tasks || []).map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: target.payload?.previousStatus ?? "todo",
                completedAt: target.payload?.previousCompletedAt,
                lastCompletedAt: target.payload?.previousLastCompletedAt,
              }
            : task
        );
        nextState = {
          ...prev,
          tasks: updatedTasks,
          completedTasks: removeCompletedEntry(
            prev.completedTasks || [],
            taskId,
            target.payload?.completedAt
          ),
        };
      } else if (entryType === "task_add") {
        const taskId = target.payload?.taskId;
        if (!taskId) {
          result = { ok: false, error: "缺少任务信息" };
          return prev;
        }
        nextState = {
          ...prev,
          tasks: (prev.tasks || []).filter((task) => task.id !== taskId),
        };
      } else if (entryType === "reward_gain") {
        const amount = Number(target.payload?.amount ?? target.payload?.coins ?? target.payload?.delta);
        if (!amount) {
          result = { ok: false, error: "缺少奖励信息" };
          return prev;
        }
        nextState = {
          ...prev,
          currency: {
            ...prev.currency,
            coins: Math.max(0, (prev.currency?.coins || 0) - amount),
          },
        };
      } else {
        result = { ok: false, error: "该记录无法撤销" };
        return prev;
      }

      const updatedHistory = historyList.map((item, index) =>
        index === targetIndex ? { ...item, undone: true, undoneAt: Date.now() } : item
      );
      const nextHistory = pushHistoryEntry(
        buildHistoryEntry({
          type: "task_revert",
          payload: {
            targetId: target.id,
            targetType: target.type,
            taskId: target.payload?.taskId,
            taskTitle: target.payload?.taskTitle,
          },
        }),
        updatedHistory
      );

      result = { ok: true };
      return {
        ...nextState,
        history: nextHistory,
      };
    });

    return result;
  }, [state]);

  const undoHistoryItem = useCallback((id) => {
    if (!state) return { ok: false, error: "世界尚未加载" };
    const result = undoHistoryItemAction({ state, history: state.history, id });
    if (!result.ok) return result;
    const nextState = recalculateAchievements(result.state);
    setState({
      ...nextState,
      history: result.history,
    });
    return { ok: true };
  }, [state]);

  const undoLastAction = useCallback(() => {
    if (!state) return { ok: false, error: "世界尚未加载" };
    const result = undoHistoryLastAction({ state, history: state.history });
    if (!result.ok) return result;
    const nextState = recalculateAchievements(result.state);
    setState({
      ...nextState,
      history: result.history,
    });
    return { ok: true };
  }, [state]);

  const unlockAchievement = useCallback((key) => {
    if (!state) return;
    const template = ACHIEVEMENTS_CONFIG.find((item) => item.key === key);
    if (!template) return;

    setState((prev) => {
      const updatedAchievements = (prev.achievements || []).map((ach) =>
        ach.key === key
          ? { ...ach, unlocked: true, unlockedAt: Date.now(), progress: ach.target || 0 }
          : ach
      );

      const updatedState = applyAchievementRewards({ ...prev, achievements: updatedAchievements }, template);
      return updatedState;
    });
  }, [state]);

  const updateAchievementProgress = useCallback((key, delta) => {
    if (!state) return;
    const template = ACHIEVEMENTS_CONFIG.find((item) => item.key === key);
    if (!template) return;

    setState((prev) => {
      let updatedState = { ...prev };
      const updatedAchievements = (prev.achievements || []).map((ach) => {
        if (ach.key !== key) return ach;
        if (ach.unlocked) return ach;
        const progress = Math.min((ach.progress || 0) + delta, ach.target || template.target || 0);
        const unlockedNow = progress >= (ach.target || template.target || 0);
        if (unlockedNow) {
          updatedState = applyAchievementRewards(updatedState, template);
        }
        return {
          ...ach,
          progress,
          unlocked: unlockedNow,
          unlockedAt: unlockedNow ? Date.now() : ach.unlockedAt,
        };
      });

      updatedState.achievements = updatedAchievements;
      return updatedState;
    });
  }, [state]);

  const value = useMemo(() => ({
    hydrated,
    stats: state?.stats || { ...DEFAULT_STATS },
    world: state?.world || { ...DEFAULT_WORLD },
    currency: state?.currency || { coins: 0 },
    exp: state?.exp ?? 0,
    tickets: state?.tickets || { game: 0 },
    tasks: state?.tasks || [],
    completedTasks: state?.completedTasks || [],
    taskConfig: TASK_CONFIG,
    treasureMaps: state?.treasureMaps || [],
    claims: state?.claims || [],
    achievements: state?.achievements || [],
    burst: state?.burst || { ...DEFAULT_BURST },
    history: state?.history || [],
    changeStats,
    now: timeState.now,
    todayKey: timeState.todayKey,
    dayIndex: timeState.dayIndex,
    refreshTime,
    addCoins,
    grantExp,
    spendCoins,
    exchangeCoinsForGameTicket,
    useGameTicket,
    registerTask,
    completeTask,
    progressTreasureMaps,
    addTreasureMap,
    completeTreasureMap,
    addClaim,
    useClaim,
    pushHistory,
    addHistory,
    undoHistory,
    undoHistoryItem,
    undoLastAction,
    unlockAchievement,
    updateAchievementProgress,
    removeTask,
  }), [
    hydrated,
    state,
    changeStats,
    timeState,
    refreshTime,
    addCoins,
    grantExp,
    spendCoins,
    exchangeCoinsForGameTicket,
    useGameTicket,
    registerTask,
    completeTask,
    progressTreasureMaps,
    addTreasureMap,
    completeTreasureMap,
    addClaim,
    useClaim,
    pushHistory,
    addHistory,
    undoHistory,
    undoHistoryItem,
    undoLastAction,
    unlockAchievement,
    updateAchievementProgress,
    removeTask,
  ]);

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld() {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error("useWorld must be used within WorldProvider");
  }
  return context;
}
