"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RANDOM_EVENTS } from "./gameConfig/randomEventsConfig";
import { ACHIEVEMENTS_CONFIG } from "./gameConfig/achievementsConfig";

const STORAGE_KEY = "lifeup.arcane.v3";
const LEGACY_KEYS = ["lifeup.world.v1", "lifeup.magicworld.v1"];

const DEFAULT_STATS = {
  hunger: 70,
  sanity: 70,
  health: 80,
  energy: 80,
};

const DEFAULT_WORLD = {
  day: 1,
  phase: "day",
  randomEvent: null,
};

const HISTORY_LIMIT = 200;

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampStats(stats) {
  return {
    hunger: clampStat(stats.hunger),
    sanity: clampStat(stats.sanity),
    health: clampStat(stats.health),
    energy: clampStat(stats.energy),
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

function createDefaultState() {
  return {
    stats: { ...DEFAULT_STATS },
    world: { ...DEFAULT_WORLD },
    currency: { coins: 0 },
    tasks: [],
    completedTasks: [],
    treasureMaps: [],
    claims: [],
    achievements: initializeAchievements(),
    history: [],
  };
}

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createSnapshotFromState(state) {
  const { history, ...rest } = state || {};
  return deepClone(rest);
}

function pushHistoryEntry(state, label, meta) {
  const snapshot = createSnapshotFromState(state);
  const entry = {
    id: newId(),
    at: Date.now(),
    label,
    meta,
    snapshot,
  };
  const nextHistory = [entry, ...(state.history || [])].slice(0, HISTORY_LIMIT);
  return {
    ...state,
    history: nextHistory,
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

function migrateLegacyState(raw) {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

  const coins = raw.currency?.coins ?? raw.coins ?? base.currency.coins;
  const claims = Array.isArray(raw.claims) ? raw.claims : [];

  let tasks = [];
  if (Array.isArray(raw.tasks)) {
    tasks = raw.tasks.map((task) => {
      const isRepeatable = task.type === "repeat" || task.isRepeatable;
      const status = task.status || "todo";
      return {
        id: task.id || newId(),
        title: task.title || "未命名任务",
        category: task.category || "other",
        subtype: task.subtype,
        status,
        isRepeatable,
        createdAt: task.createdAt || Date.now(),
        completedAt: task.completedAt,
        exp: task.rewardXp || task.exp || 5,
        coinsReward: task.rewardCoins || task.coinsReward || 0,
        effect: task.effect || undefined,
        cooldownMinutes: task.cooldownMinutes || undefined,
        lastCompletedAt: task.lastCompletedAt || undefined,
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
    claims,
    tasks,
    completedTasks,
    treasureMaps,
  };
}

function loadState() {
  if (typeof window === "undefined") return createDefaultState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...createDefaultState(),
        ...parsed,
        stats: { ...DEFAULT_STATS, ...(parsed.stats || {}) },
        world: { ...DEFAULT_WORLD, ...(parsed.world || {}) },
        currency: { coins: parsed.currency?.coins ?? 0 },
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        completedTasks: Array.isArray(parsed.completedTasks) ? parsed.completedTasks : [],
        treasureMaps: Array.isArray(parsed.treasureMaps)
          ? parsed.treasureMaps.map(normalizeTreasureMap)
          : [],
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
        achievements: initializeAchievements(parsed.achievements),
        history: Array.isArray(parsed.history) ? parsed.history : [],
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    for (let day = world.day; day >= 1; day -= 1) {
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
      health: updated.stats.health + (reward.stats.health || 0),
      energy: updated.stats.energy + (reward.stats.energy || 0),
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
  if (map.baseReward?.sanity || map.baseReward?.health) {
    updatedState.stats = clampStats({
      ...updatedState.stats,
      sanity: updatedState.stats.sanity + (map.baseReward.sanity || 0),
      health: updatedState.stats.health + (map.baseReward.health || 0),
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
      bigReward: { coins: 120, health: 8, claimName: "🗝 净化宝箱" },
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

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !state) return;
    saveState(state);
  }, [hydrated, state]);

  const changeStats = useCallback((delta) => {
    if (!state) return;
    setState((prev) => {
      const updated = {
        ...prev.stats,
        hunger: prev.stats.hunger + (delta.hunger || 0),
        sanity: prev.stats.sanity + (delta.sanity || 0),
        health: prev.stats.health + (delta.health || 0),
        energy: prev.stats.energy + (delta.energy || 0),
      };
      return { ...prev, stats: clampStats(updated) };
    });
  }, [state]);

  const advancePhase = useCallback(() => {
    if (!state) return;

    setState((prev) => {
      const currentPhase = prev.world.phase;
      let nextPhase = currentPhase;
      let nextDay = prev.world.day;
      let nextEvent = prev.world.randomEvent;
      let updatedStats = { ...prev.stats };

      if (currentPhase === "day") {
        nextPhase = "dusk";
        updatedStats.hunger -= 5;
      } else if (currentPhase === "dusk") {
        nextPhase = "night";
        updatedStats.sanity -= 5;
      } else {
        nextPhase = "day";
        nextDay += 1;

        if (updatedStats.hunger < 30 || updatedStats.sanity < 30) {
          updatedStats.health -= 5;
          updatedStats.energy -= 5;
        }

        nextEvent = pickRandomEvent();
        if (nextEvent?.effectOnStats) {
          updatedStats = {
            ...updatedStats,
            hunger: updatedStats.hunger + (nextEvent.effectOnStats.hunger || 0),
            sanity: updatedStats.sanity + (nextEvent.effectOnStats.sanity || 0),
            health: updatedStats.health + (nextEvent.effectOnStats.health || 0),
            energy: updatedStats.energy + (nextEvent.effectOnStats.energy || 0),
          };
        }
      }

      const nextState = {
        ...prev,
        stats: clampStats(updatedStats),
        world: {
          ...prev.world,
          day: nextDay,
          phase: nextPhase,
          randomEvent: nextEvent,
        },
      };

      return recalculateAchievements(nextState);
    });
  }, [state]);

  const addCoins = useCallback((amount) => {
    if (!state || !amount) return;
    setState((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        coins: prev.currency.coins + amount,
      },
    }));
  }, [state]);

  const spendCoins = useCallback((amount) => {
    if (!state || amount <= 0) return false;
    if (state.currency.coins < amount) return false;
    setState((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        coins: prev.currency.coins - amount,
      },
    }));
    return true;
  }, [state]);

  const registerTask = useCallback((taskInput) => {
    if (!state || !taskInput) return null;

    const created = {
      id: newId(),
      title: taskInput.title,
      category: taskInput.category || "other",
      subtype: taskInput.subtype,
      status: "todo",
      isRepeatable: Boolean(taskInput.isRepeatable),
      createdAt: Date.now(),
      exp: taskInput.exp || 0,
      coinsReward: taskInput.coinsReward || 0,
      effect: taskInput.effect,
      cooldownMinutes: taskInput.cooldownMinutes,
      lastCompletedAt: taskInput.lastCompletedAt,
      prerequisites: taskInput.prerequisites || [],
      requirements: taskInput.requirements || {},
      tags: taskInput.tags || [],
      isUserCreated: Boolean(taskInput.isUserCreated),
      size: taskInput.size,
      difficulty: taskInput.difficulty,
    };

    setState((prev) => ({
      ...prev,
      tasks: [created, ...(prev.tasks || [])],
    }));

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

    if (task.cooldownMinutes && task.lastCompletedAt) {
      const nextAvailable = task.lastCompletedAt + task.cooldownMinutes * 60 * 1000;
      if (Date.now() < nextAvailable) {
        return { ok: false, message: "任务冷却中，稍后再试" };
      }
    }

    if (task.requirements) {
      const { energy, hunger, sanity, health } = task.requirements;
      if (energy && state.stats.energy < energy) {
        return { ok: false, message: "能量不足，暂时无法执行" };
      }
      if (hunger && state.stats.hunger < hunger) {
        return { ok: false, message: "饱食度不足，先补充" };
      }
      if (sanity && state.stats.sanity < sanity) {
        return { ok: false, message: "精神不足，先休息" };
      }
      if (health && state.stats.health < health) {
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

    const baseState = pushHistoryEntry(state, `完成任务：${task.title}`, {
      type: "task_complete",
      taskId,
    });

    const rewardModifier = calculateRewardModifier(baseState.world.randomEvent, task.category);
    const rewardExp = Math.max(0, Math.round((task.exp || 0) * rewardModifier.expMultiplier) + rewardModifier.expBonus);
    const rewardCoins = Math.max(0, Math.round((task.coinsReward || 0) * rewardModifier.coinMultiplier));

    const completedAt = Date.now();

    let updatedTasks = (baseState.tasks || []).map((item) => {
      if (item.id !== taskId) return item;
      if (task.isRepeatable) {
        return {
          ...item,
          status: "todo",
          lastCompletedAt: completedAt,
        };
      }
      return {
        ...item,
        status: "done",
        completedAt,
        lastCompletedAt: completedAt,
      };
    });

    const updatedStats = clampStats({
      ...baseState.stats,
      hunger: baseState.stats.hunger + (task.effect?.hunger || 0),
      sanity: baseState.stats.sanity + (task.effect?.sanity || 0),
      health: baseState.stats.health + (task.effect?.health || 0),
      energy: baseState.stats.energy + (task.effect?.energy || 0),
    });

    const completedEntry = {
      id: newId(),
      taskId: task.id,
      title: task.title,
      category: task.category,
      subtype: task.subtype,
      completedAt,
      day: baseState.world.day,
      exp: rewardExp,
      coins: rewardCoins,
      tags: task.tags || [],
    };

    let nextState = {
      ...baseState,
      stats: updatedStats,
      tasks: updatedTasks,
      completedTasks: [completedEntry, ...(baseState.completedTasks || [])],
      currency: {
        ...baseState.currency,
        coins: baseState.currency.coins + rewardCoins,
      },
    };

    nextState = progressTreasureMapsInternal(nextState, task);
    nextState = recalculateAchievements(nextState);
    nextState = maybeTriggerTreasureMaps(nextState, task);

    setState(nextState);

    return {
      ok: true,
      rewardExp,
      rewardCoins,
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

    if (newMap.baseReward?.sanity || newMap.baseReward?.health) {
      updatedState.stats = clampStats({
        ...updatedState.stats,
        sanity: updatedState.stats.sanity + (newMap.baseReward.sanity || 0),
        health: updatedState.stats.health + (newMap.baseReward.health || 0),
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

    let updatedState = pushHistoryEntry(state, `开启藏宝图奖励：${map.name}`, {
      type: "treasure_open",
      mapId,
    });

    if (map.bigReward?.coins) {
      updatedState.currency = {
        ...updatedState.currency,
        coins: updatedState.currency.coins + map.bigReward.coins,
      };
    }

    if (map.bigReward?.sanity || map.bigReward?.health) {
      updatedState.stats = clampStats({
        ...updatedState.stats,
        sanity: updatedState.stats.sanity + (map.bigReward.sanity || 0),
        health: updatedState.stats.health + (map.bigReward.health || 0),
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
      const nextState = pushHistoryEntry(prev, `使用奖励券：${claim.name}`, {
        type: "claim_use",
        claimId,
      });
      return {
        ...nextState,
        claims: (nextState.claims || []).map((item) =>
          item.id === claimId ? { ...item, used: true } : item
        ),
      };
    });
  }, [state]);

  const pushHistory = useCallback((label, meta) => {
    if (!state || !label) return;
    setState((prev) => pushHistoryEntry(prev, label, meta));
  }, [state]);

  const undoLastHistory = useCallback(() => {
    if (!state?.history?.length) return false;
    setState((prev) => {
      const [latest, ...rest] = prev.history || [];
      if (!latest?.snapshot) return prev;
      return {
        ...deepClone(latest.snapshot),
        history: rest,
      };
    });
    return true;
  }, [state]);

  const restoreHistoryEntry = useCallback((entryId) => {
    if (!state?.history?.length) return false;
    const entry = state.history.find((item) => item.id === entryId);
    if (!entry?.snapshot) return false;
    setState((prev) => ({
      ...deepClone(entry.snapshot),
      history: prev.history || [],
    }));
    return true;
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
    tasks: state?.tasks || [],
    completedTasks: state?.completedTasks || [],
    treasureMaps: state?.treasureMaps || [],
    claims: state?.claims || [],
    achievements: state?.achievements || [],
    history: state?.history || [],
    changeStats,
    advancePhase,
    addCoins,
    spendCoins,
    registerTask,
    completeTask,
    progressTreasureMaps,
    addTreasureMap,
    completeTreasureMap,
    addClaim,
    useClaim,
    pushHistory,
    undoLastHistory,
    restoreHistoryEntry,
    unlockAchievement,
    updateAchievementProgress,
    removeTask,
  }), [
    hydrated,
    state,
    changeStats,
    advancePhase,
    addCoins,
    spendCoins,
    registerTask,
    completeTask,
    progressTreasureMaps,
    addTreasureMap,
    completeTreasureMap,
    addClaim,
    useClaim,
    pushHistory,
    undoLastHistory,
    restoreHistoryEntry,
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
