"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RANDOM_EVENTS } from "./gameConfig/randomEventsConfig";
import { ACHIEVEMENTS_CONFIG } from "./gameConfig/achievementsConfig";
import { getSanityGain, resolveTaskKind, STAT_LIMITS } from "../game/config";
import {
  BASE_COINS_PER_HOUR,
  DEFAULT_COINS_PER_YUAN,
  loadCoinsPerYuan,
  saveCoinsPerYuan,
} from "../game/config/economy";
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
import { safeLoad, safeSave } from "../lib/storage";

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

const DEFAULT_SETTINGS = {
  coinsPerYuan: DEFAULT_COINS_PER_YUAN,
};

const ATTRIBUTE_LEVEL_BASE = 100;
const ATTRIBUTE_LEVEL_GROWTH = 1.3;

const DEFAULT_ATTRIBUTES = [
  {
    id: "mind",
    name: "认知",
    description: "学习、看课、思考与输出。",
    icon: "🧠",
  },
  {
    id: "body",
    name: "体力",
    description: "健康、清理、走路与运动。",
    icon: "💪",
  },
  {
    id: "charm",
    name: "魅力",
    description: "形象、社交、舞台表现。",
    icon: "✨",
  },
  {
    id: "wealth",
    name: "财富",
    description: "工作、赚钱与项目推进。",
    icon: "💰",
  },
  {
    id: "order",
    name: "秩序",
    description: "收纳、计划与财务整理。",
    icon: "📚",
  },
];

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

function resolveAchievementId(template) {
  return template?.id || template?.key;
}

function buildDefaultAttributes() {
  const now = Date.now();
  return DEFAULT_ATTRIBUTES.map((attr) => ({
    ...attr,
    level: 1,
    exp: 0,
    expToNext: ATTRIBUTE_LEVEL_BASE,
    createdAt: now,
    updatedAt: now,
  }));
}

function initializeAchievements(existing = []) {
  const existingMap = new Map(existing.map((item) => [item.id || item.key, item]));
  return ACHIEVEMENTS_CONFIG.map((template) => {
    const templateId = resolveAchievementId(template);
    const prior = existingMap.get(templateId);
    return {
      id: templateId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      type: template.type,
      condition: template.condition,
      target: template.target,
      progress: prior?.progress ?? 0,
      unlocked: prior?.unlocked ?? false,
      unlockedAt: prior?.unlockedAt,
      timesUnlocked: prior?.timesUnlocked ?? 0,
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
  const categoryKey = task?.categoryKey || task?.category;
  return {
    minutes: Number(task.minutes) || 10,
    difficulty: difficultyKey,
    difficultyValue: resolveDifficultyValue(difficultyKey),
    kind: resolveTaskKind(categoryKey, task.kind),
  };
}

function normalizeTaskStreakState(task) {
  const streak = normalizeTaskStreak(task?.streak);
  return {
    streak,
    streakActive: task?.streakActive ?? streak.count >= 3,
  };
}

const TASK_CATEGORY_KEYWORDS = [
  { category: "认知", keywords: ["课", "学习", "阅读", "笔记", "复盘", "课程", "思考"] },
  { category: "清理", keywords: ["收拾", "整理", "垃圾", "清理", "打扫", "洗衣"] },
  { category: "体力", keywords: ["运动", "走路", "散步", "拉伸", "跑步", "健身"] },
  { category: "社交", keywords: ["社交", "聊天", "约", "沟通", "会面"] },
  { category: "工作", keywords: ["工作", "夜场", "上班", "直播", "项目", "赚钱"] },
  { category: "娱乐", keywords: ["游戏", "娱乐", "放松", "追剧", "电影"] },
];

const TASK_CATEGORY_MAP = {
  learning: "认知",
  cleaning: "清理",
  health: "体力",
  work: "工作",
  english: "认知",
  explore: "娱乐",
  context: "其他",
  other: "其他",
};

const CATEGORY_KEY_MAP = {
  认知: "learning",
  清理: "cleaning",
  体力: "health",
  社交: "other",
  工作: "work",
  娱乐: "other",
  其他: "other",
};

const ATTRIBUTE_MAP = {
  认知: ["mind"],
  清理: ["order", "body"],
  体力: ["body"],
  社交: ["charm"],
  工作: ["wealth"],
  娱乐: ["charm"],
  其他: ["order"],
};

const BASE_REWARD_BY_SIZE = {
  SMALL: { coins: 8, exp: 6 },
  MEDIUM: { coins: 20, exp: 14 },
  LARGE: { coins: 40, exp: 30 },
};

const PRIORITY_MAP = {
  urgent: "URGENT",
  soon: "SOON",
  later: "LATER",
  quick: "FAST",
  long: "LONG",
  URGENT: "URGENT",
  SOON: "SOON",
  LATER: "LATER",
  FAST: "FAST",
  LONG: "LONG",
};

const TYPE_MAP = {
  repeat: "REPEATABLE",
  repeatable: "REPEATABLE",
  habit: "HABIT",
  one_shot: "ONE_SHOT",
  ONE_SHOT: "ONE_SHOT",
  REPEATABLE: "REPEATABLE",
  HABIT: "HABIT",
};

const ATTRIBUTE_EXP_BY_SIZE = {
  SMALL: 10,
  MEDIUM: 25,
  LARGE: 50,
};

const SIZE_REWARD_MULTIPLIER = {
  SMALL: 0.8,
  MEDIUM: 1,
  LARGE: 1.6,
};

function inferTaskCategory(title, fallbackCategory) {
  const safeTitle = title || "";
  const match = TASK_CATEGORY_KEYWORDS.find((item) =>
    item.keywords.some((keyword) => safeTitle.includes(keyword))
  );
  if (match) return match.category;
  if (fallbackCategory && TASK_CATEGORY_MAP[fallbackCategory]) {
    return TASK_CATEGORY_MAP[fallbackCategory];
  }
  return fallbackCategory || "其他";
}

function resolveAttributeImpact(category) {
  return ATTRIBUTE_MAP[category] || ["order"];
}

function resolveTaskDefaults(taskInput) {
  const category = inferTaskCategory(taskInput.title, taskInput.category);
  const categoryKey =
    taskInput.categoryKey ||
    CATEGORY_KEY_MAP[category] ||
    (typeof taskInput.category === "string" ? taskInput.category : "other");
  const size = taskInput.size || "SMALL";
  const priority = PRIORITY_MAP[taskInput.priority] || "FAST";
  const type =
    TYPE_MAP[taskInput.type] ||
    (taskInput.isRepeatable || taskInput.repeatable ? "REPEATABLE" : "ONE_SHOT");
  const baseReward = taskInput.baseReward || BASE_REWARD_BY_SIZE[size] || BASE_REWARD_BY_SIZE.SMALL;
  return {
    category,
    categoryKey,
    size,
    priority,
    type,
    baseReward,
    attributeImpact: taskInput.attributeImpact || resolveAttributeImpact(category),
  };
}

function resolveCategoryKeyValue(category) {
  if (!category) return "other";
  return CATEGORY_KEY_MAP[category] || category;
}

function calculateAttributeExp(task) {
  const size = task.size || "SMALL";
  const base = ATTRIBUTE_EXP_BY_SIZE[size] || ATTRIBUTE_EXP_BY_SIZE.SMALL;
  const priorityBonus = task.priority === "URGENT" ? 8 : task.priority === "SOON" ? 4 : 0;
  const typeBonus = task.type === "HABIT" ? 4 : task.type === "REPEATABLE" ? 2 : 0;
  return base + priorityBonus + typeBonus;
}

function computeTaskBaseReward(taskInput) {
  const minutes = Number(taskInput.estimateMinutes ?? taskInput.minutes) || 15;
  const size = taskInput.size || "SMALL";
  const multiplier = SIZE_REWARD_MULTIPLIER[size] || 1;
  const coins = Math.max(1, Math.round((minutes / 60) * BASE_COINS_PER_HOUR * multiplier));
  const exp = Math.max(1, Math.round(coins * 0.6));
  return { coins, exp };
}

function applyAttributeExp(attributes, attributeIds, expAmount) {
  if (!attributeIds?.length || !expAmount) return { attributes, leveled: [] };
  const now = Date.now();
  const leveled = [];
  const updated = attributes.map((attr) => {
    if (!attributeIds.includes(attr.id)) return attr;
    let nextExp = attr.exp + expAmount;
    let nextLevel = attr.level;
    let nextExpToNext = attr.expToNext;
    while (nextExp >= nextExpToNext) {
      nextExp -= nextExpToNext;
      nextLevel += 1;
      nextExpToNext = Math.round(nextExpToNext * ATTRIBUTE_LEVEL_GROWTH);
    }
    if (nextLevel > attr.level) {
      leveled.push({ id: attr.id, level: nextLevel });
    }
    return {
      ...attr,
      level: nextLevel,
      exp: nextExp,
      expToNext: nextExpToNext,
      updatedAt: now,
    };
  });
  return { attributes: updated, leveled };
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
    attributes: buildDefaultAttributes(),
    attributeHistory: [],
    notes: [],
    timerSessions: [],
    settings: { ...DEFAULT_SETTINGS },
    dailyBatchPlan: null,
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
    kind: record.kind || record.type,
    payload: record.payload || {},
    timestamp: record.timestamp || record.createdAt || Date.now(),
    createdAt: record.createdAt || record.timestamp || Date.now(),
    canUndo: Boolean(record.canUndo ?? record.undoable ?? record.undo),
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
      const defaults = resolveTaskDefaults({
        title: task.title,
        category: task.category,
        size: task.size,
        priority: task.priority,
        type: task.type,
        baseReward: task.baseReward,
        attributeImpact: task.attributeImpact,
      });
      return {
        id: task.id || newId(),
        title: task.title || "未命名任务",
        category: defaults.category,
        categoryKey: defaults.categoryKey,
        description: task.description,
        tags: Array.isArray(task.tags) ? task.tags : [],
        size: defaults.size,
        priority: defaults.priority,
        type: defaults.type,
        repeatRule: task.repeatRule,
        attributeImpact: defaults.attributeImpact,
        baseReward: defaults.baseReward,
        subtype: task.subtype,
        status,
        isRepeatable,
        createdAt: task.createdAt || Date.now(),
        updatedAt: task.updatedAt || task.createdAt || Date.now(),
        completedAt: task.completedAt,
        exp: task.rewardXp || task.exp || 0,
        coinsReward: task.rewardCoins || task.coinsReward || 0,
        effect: task.effect || undefined,
        lastCompletedAt: task.lastCompletedAt || undefined,
        totalCompletedCount: task.totalCompletedCount || 0,
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
      categoryKey: task.categoryKey,
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
    attributes: buildDefaultAttributes(),
    attributeHistory: [],
    notes: [],
    timerSessions: [],
    settings: { ...DEFAULT_SETTINGS },
    dailyBatchPlan: null,
  };
}

function loadState() {
  const parsed = safeLoad(STORAGE_KEY, null);
  if (parsed) {
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
          ? parsed.tasks.map((task) => {
              const defaults = resolveTaskDefaults({
                title: task.title,
                category: task.category,
                categoryKey: task.categoryKey,
                size: task.size,
                priority: task.priority,
                type: task.type,
                baseReward: task.baseReward,
                attributeImpact: task.attributeImpact,
              });
              return {
                ...task,
                category: defaults.category,
                categoryKey: defaults.categoryKey,
                size: defaults.size,
                priority: defaults.priority,
                type: defaults.type,
                attributeImpact: defaults.attributeImpact,
                baseReward: defaults.baseReward,
                updatedAt: task.updatedAt || task.createdAt || Date.now(),
                ...normalizeTaskMeta({ ...task, categoryKey: defaults.categoryKey }),
                ...normalizeTaskStreakState(task),
              };
            })
          : [],
        completedTasks: Array.isArray(parsed.completedTasks) ? parsed.completedTasks : [],
        treasureMaps: Array.isArray(parsed.treasureMaps)
          ? parsed.treasureMaps.map(normalizeTreasureMap)
          : [],
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
        achievements: initializeAchievements(parsed.achievements),
        attributes: Array.isArray(parsed.attributes) ? parsed.attributes : buildDefaultAttributes(),
        attributeHistory: Array.isArray(parsed.attributeHistory) ? parsed.attributeHistory : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        timerSessions: Array.isArray(parsed.timerSessions) ? parsed.timerSessions : [],
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
          coinsPerYuan: parsed.settings?.coinsPerYuan ?? loadCoinsPerYuan(),
        },
        dailyBatchPlan: parsed.dailyBatchPlan || null,
        burst: normalizeBurst(parsed.burst),
        history: loadHistory(),
      };
  }

  for (const key of LEGACY_KEYS) {
    const legacyParsed = safeLoad(key, null);
    if (legacyParsed) {
      const migrated = migrateLegacyState(legacyParsed);
      safeSave(STORAGE_KEY, migrated);
      return migrated;
    }
  }

  return createDefaultState();
}

function saveState(state) {
  const { history, ...rest } = state || {};
  safeSave(STORAGE_KEY, rest);
}

function pickRandomEvent() {
  if (!RANDOM_EVENTS.length) return null;
  const idx = Math.floor(Math.random() * RANDOM_EVENTS.length);
  return RANDOM_EVENTS[idx];
}

function calculateRewardModifier(randomEvent, taskCategory) {
  if (!randomEvent?.taskRewardModifier) return { expMultiplier: 1, coinMultiplier: 1, expBonus: 0 };
  const { categories, expMultiplier, coinMultiplier, expBonus } = randomEvent.taskRewardModifier;
  const categoryKey = resolveCategoryKeyValue(taskCategory);
  const applies = !categories || categories.length === 0 || categories.includes(categoryKey);
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
  const condition = template.condition || {
    kind: template.type,
    value: template.target,
    extra: template.tag ? { tag: template.tag } : undefined,
  };
  const targetValue = Number(condition?.value) || 0;

  if (condition?.kind === "task_total") {
    const count = completedTasks.length;
    return { progress: Math.min(count, targetValue), unlockedNow: count >= targetValue };
  }

  if (condition?.kind === "tag_count") {
    const tag = condition.extra?.tag;
    const count = completedTasks.filter((task) => tag && task.tags?.includes(tag)).length;
    return { progress: Math.min(count, targetValue), unlockedNow: count >= targetValue };
  }

  if (condition?.kind === "tag_or_category_count") {
    const tag = condition.extra?.tag;
    const categories = condition.extra?.categories || [];
    const count = completedTasks.filter((task) => {
      const matchesTag = tag ? task.tags?.includes(tag) : false;
      const matchesCategory =
        categories.includes(task.category) || categories.includes(task.categoryKey);
      return matchesTag || matchesCategory;
    }).length;
    return { progress: Math.min(count, targetValue), unlockedNow: count >= targetValue };
  }

  if (condition?.kind === "course_streak" || condition?.kind === "category_streak") {
    const categories = condition.extra?.categories || ["course", "learning", "认知"];
    const daysWithCourse = new Set(
      completedTasks
        .filter(
          (task) => categories.includes(task.category) || categories.includes(task.categoryKey)
        )
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
    return { progress: Math.min(streak, targetValue), unlockedNow: streak >= targetValue };
  }

  if (condition?.kind === "course_daily") {
    const categories = condition.extra?.categories || ["course", "learning", "认知"];
    const count = completedTasks.filter(
      (task) =>
        task.day === world.day &&
        (categories.includes(task.category) || categories.includes(task.categoryKey))
    ).length;
    return { progress: Math.min(count, targetValue), unlockedNow: count >= targetValue };
  }

  if (condition?.kind === "no_tag_days") {
    const tag = condition.extra?.tag;
    const taggedTasks = completedTasks.filter((task) => tag && task.tags?.includes(tag));
    const lastDay = taggedTasks.reduce((latest, task) => Math.max(latest, task.day || 0), 0);
    const daysWithout = Math.max(world.day - lastDay, 0);
    return { progress: Math.min(daysWithout, targetValue), unlockedNow: daysWithout >= targetValue };
  }

  if (condition?.kind === "attribute_level") {
    const targetAttr = state.attributes?.find(
      (attr) => attr.id === condition.extra?.attributeId
    );
    const level = targetAttr?.level || 0;
    return { progress: Math.min(level, targetValue), unlockedNow: level >= targetValue };
  }

  if (condition?.kind === "daily_coins") {
    const coins = completedTasks
      .filter((task) => task.day === world.day)
      .reduce((sum, task) => sum + (Number(task.coins) || 0), 0);
    return { progress: Math.min(coins, targetValue), unlockedNow: coins >= targetValue };
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
    const templateId = resolveAchievementId(template);
    const existing = state.achievements.find((item) => item.id === templateId);
    if (existing?.unlocked) {
      return { ...existing, target: template.target };
    }

    const { progress, unlockedNow } = computeAchievementProgress(state, template);
    if (unlockedNow) {
      updatedState = applyAchievementRewards(updatedState, template);
    }

    return {
      id: templateId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      type: template.type,
      condition: template.condition,
      target: template.target,
      progress,
      unlocked: unlockedNow,
      unlockedAt: unlockedNow ? Date.now() : undefined,
      timesUnlocked: unlockedNow ? 1 : 0,
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
    completed.filter(
      (task) =>
        resolveCategoryKeyValue(task.categoryKey || task.category) === "course" &&
        task.subtype === subtype
    ).length;

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

  if (resolveCategoryKeyValue(taskContext?.categoryKey || taskContext?.category) === "course") {
    const streakAchievement = updatedState.achievements.find((ach) => ach.id === "course_3days");
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

const DEFAULT_CONTEXT_VALUE = (() => {
  const base = createDefaultState();
  const now = getNow();
  return {
    hydrated: false,
    stats: base.stats,
    world: base.world,
    currency: base.currency,
    exp: base.exp,
    tickets: base.tickets,
    tasks: base.tasks,
    completedTasks: base.completedTasks,
    taskConfig: TASK_CONFIG,
    treasureMaps: base.treasureMaps,
    claims: base.claims,
    achievements: base.achievements,
    attributes: base.attributes,
    attributeHistory: base.attributeHistory,
    notes: base.notes,
    timerSessions: base.timerSessions,
    settings: base.settings,
    dailyBatchPlan: base.dailyBatchPlan,
    burst: base.burst,
    history: base.history,
    changeStats: () => undefined,
    now,
    todayKey: getTodayKey(now),
    dayIndex: getDayIndex(now),
    refreshTime: () => ({ now, todayKey: getTodayKey(now), dayIndex: getDayIndex(now) }),
    addCoins: () => undefined,
    grantExp: () => undefined,
    spendCoins: () => undefined,
    exchangeCoinsForGameTicket: () => undefined,
    useGameTicket: () => undefined,
    registerTask: () => undefined,
    completeTask: () => ({ ok: false }),
    addNote: () => undefined,
    deleteNote: () => undefined,
    markNoteConverted: () => undefined,
    recordTimerSession: () => undefined,
    updateCoinsPerYuan: () => undefined,
    addBatchPlan: () => undefined,
    progressTreasureMaps: () => undefined,
    addTreasureMap: () => undefined,
    completeTreasureMap: () => ({ ok: false }),
    addClaim: () => undefined,
    useClaim: () => undefined,
    pushHistory: () => undefined,
    addHistory: () => undefined,
    undoHistory: () => undefined,
    undoHistoryItem: () => undefined,
    undoLastAction: () => undefined,
    unlockAchievement: () => undefined,
    updateAchievementProgress: () => undefined,
    removeTask: () => undefined,
  };
})();

const WorldContext = createContext(DEFAULT_CONTEXT_VALUE);

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
        dailyBatchPlan:
          prev.dailyBatchPlan?.dayKey === todayKey ? prev.dailyBatchPlan : null,
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
    const defaults = resolveTaskDefaults({
      title: taskInput.title || template?.name,
      category: template?.category || taskInput.category,
      categoryKey: taskInput.categoryKey,
      size: taskInput.size,
      priority: taskInput.priority,
      type: taskInput.type,
      baseReward: taskInput.baseReward,
      attributeImpact: taskInput.attributeImpact,
    });
    const meta = normalizeTaskMeta({
      ...template,
      ...taskInput,
      categoryKey: defaults.categoryKey,
      difficulty: baseDifficulty,
    });
    const baseReward =
      taskInput.baseReward ||
      (template ? computeRewards(baseDifficulty) : computeTaskBaseReward({ ...taskInput, ...defaults }));
    const baseRewardValue = baseReward?.coins
      ? { coins: baseReward.coins, exp: baseReward.exp }
      : defaults.baseReward;
    const sanityBonus = getSanityGain(meta.difficultyValue);
    const instanceId = newId();
    const streakState = normalizeTaskStreakState(taskInput);
    const estimateMinutes =
      Number(taskInput.estimateMinutes ?? taskInput.minutes ?? template?.estimatedMinutes) || 20;
    const now = Date.now();

    const created = {
      id: instanceId,
      instanceId,
      templateId: template?.templateId || taskInput.templateId,
      title: template?.name || taskInput.title || "未命名任务",
      category: defaults.category,
      categoryKey: defaults.categoryKey,
      description: taskInput.description || template?.description,
      notes: taskInput.notes || "",
      subtype: taskInput.subtype || template?.subtype,
      status: "todo",
      isRepeatable: Boolean(template?.repeatable ?? taskInput.isRepeatable ?? taskInput.repeatable),
      createdAt: now,
      updatedAt: now,
      priority: defaults.priority,
      type: defaults.type,
      repeatRule: taskInput.repeatRule,
      attributeImpact: defaults.attributeImpact,
      baseReward: baseRewardValue,
      exp: baseRewardValue.exp,
      coinsReward: baseRewardValue.coins,
      effect: template?.effect || taskInput.effect || { sanity: sanityBonus },
      rewardPreview: { coins: baseRewardValue.coins, exp: baseRewardValue.exp },
      lastCompletedAt: taskInput.lastCompletedAt,
      totalCompletedCount: taskInput.totalCompletedCount || 0,
      prerequisites: template?.prerequisites || taskInput.prerequisites || [],
      requirements: template?.requirements || taskInput.requirements || {},
      tags: template?.tags || taskInput.tags || [],
      isUserCreated: Boolean(taskInput.isUserCreated),
      size: defaults.size,
      estimateMinutes,
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
      const unlockedKeys = new Set(state.achievements.filter((a) => a.unlocked).map((a) => a.id));
      const missing = task.prerequisites.find((key) => !unlockedKeys.has(key));
      if (missing) {
        return { ok: false, message: "前置成就尚未解锁" };
      }
    }

    const normalizedBurst = normalizeBurst(state.burst);
    const normalizedState = normalizedBurst === state.burst ? state : { ...state, burst: normalizedBurst };

    const baseState = normalizedState;

    const rewardModifier = calculateRewardModifier(
      baseState.world.randomEvent,
      task.categoryKey || task.category
    );
    const meta = normalizeTaskMeta(task);
    const streakUpdate = updateTaskStreak(task, baseState.world.day);
    const streakMultiplier = getStreakRewardMultiplier(streakUpdate.streakActive);
    const burstKind = meta.kind;
    const nextComboCount =
      baseState.burst.lastKind && baseState.burst.lastKind === burstKind
        ? (baseState.burst.comboCount || 0) + 1
        : 1;
    const baseReward = task.baseReward?.coins ? task.baseReward : computeRewards(meta.difficulty);
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
          totalCompletedCount: (item.totalCompletedCount || 0) + 1,
          updatedAt: completedAt,
          streak: streakUpdate.streak,
          streakActive: streakUpdate.streakActive,
        };
      }
      return {
        ...item,
        status: "done",
        completedAt,
        lastCompletedAt: completedAt,
        totalCompletedCount: (item.totalCompletedCount || 0) + 1,
        updatedAt: completedAt,
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
      categoryKey: task.categoryKey,
      subtype: task.subtype,
      completedAt,
      day: baseState.world.day,
      exp: rewardExp,
      coins: rewardCoins,
      tags: task.tags || [],
    };

    let nextHistory = pushHistoryEntry(
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

    const attributeExp = calculateAttributeExp(task);
    const attributeResult = applyAttributeExp(
      baseState.attributes || buildDefaultAttributes(),
      task.attributeImpact,
      attributeExp
    );
    const attributeHistoryEntries = (task.attributeImpact || []).map((attributeId) => ({
      id: newId(),
      attributeId,
      exp: attributeExp,
      taskId: task.id,
      createdAt: completedAt,
    }));

    if (attributeResult.leveled.length > 0) {
      attributeResult.leveled.forEach((entry) => {
        nextHistory = pushHistoryEntry(
          buildHistoryEntry({
            type: "attribute_level_up",
            payload: {
              attributeId: entry.id,
              level: entry.level,
              taskId: task.id,
            },
          }),
          nextHistory
        );
      });
    }

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
      attributes: attributeResult.attributes,
      attributeHistory: [
        ...(attributeHistoryEntries || []),
        ...(baseState.attributeHistory || []),
      ],
      burst: updatedBurst,
      history: nextHistory,
    };

    nextState = progressTreasureMapsInternal(nextState, task);
    nextState = recalculateAchievements(nextState);
    nextState = maybeTriggerTreasureMaps(nextState, task);

    const newlyUnlocked = nextState.achievements.filter(
      (ach) =>
        ach.unlocked &&
        !baseState.achievements?.some((prev) => prev.id === ach.id && prev.unlocked)
    );
    if (newlyUnlocked.length > 0) {
      let historyWithUnlocks = nextState.history;
      newlyUnlocked.forEach((ach) => {
        historyWithUnlocks = pushHistoryEntry(
          buildHistoryEntry({
            type: "achievement_unlock",
            payload: {
              achievementId: ach.id,
              name: ach.name,
            },
          }),
          historyWithUnlocks
        );
      });
      nextState = { ...nextState, history: historyWithUnlocks };
    }

    setState(nextState);

    return {
      ok: true,
      rewardExp,
      rewardCoins,
      burstBonus,
      comboCount: nextComboCount,
    };
  }, [state]);

  const addNote = useCallback((text, options = {}) => {
    if (!state) return null;
    const trimmed = text?.trim();
    if (!trimmed) return null;
    const now = Date.now();
    const note = {
      id: newId(),
      text: trimmed,
      createdAt: now,
      relatedTaskId: options.relatedTaskId,
      kind: options.kind || "IDEA",
      convertedAt: options.convertedAt,
    };
    setState((prev) => ({
      ...prev,
      notes: [note, ...(prev.notes || [])],
    }));
    return note;
  }, [state]);

  const deleteNote = useCallback((noteId) => {
    if (!state) return;
    setState((prev) => ({
      ...prev,
      notes: (prev.notes || []).filter((note) => note.id !== noteId),
    }));
  }, [state]);

  const markNoteConverted = useCallback((noteId, taskId) => {
    if (!state) return;
    setState((prev) => ({
      ...prev,
      notes: (prev.notes || []).map((note) =>
        note.id === noteId
          ? { ...note, convertedAt: Date.now(), relatedTaskId: taskId || note.relatedTaskId }
          : note
      ),
    }));
  }, [state]);

  const recordTimerSession = useCallback((sessionInput) => {
    if (!state || !sessionInput) return null;
    const now = Date.now();
    const session = {
      id: newId(),
      mode: sessionInput.mode || "POMODORO",
      taskId: sessionInput.taskId,
      taskTitle: sessionInput.taskTitle,
      workMinutes: sessionInput.workMinutes || 25,
      restMinutes: sessionInput.restMinutes,
      startedAt: sessionInput.startedAt || now,
      endedAt: sessionInput.endedAt || now,
      effectiveMinutes: sessionInput.effectiveMinutes || sessionInput.workMinutes || 0,
    };

    setState((prev) => {
      let nextState = { ...prev, timerSessions: [session, ...(prev.timerSessions || [])] };
      if (session.taskId && session.effectiveMinutes) {
        const bonusCoins = Math.max(1, Math.round(session.effectiveMinutes * 0.6));
        const bonusExp = Math.max(1, Math.round(bonusCoins * 0.5));
        nextState = {
          ...nextState,
          currency: {
            ...nextState.currency,
            coins: nextState.currency.coins + bonusCoins,
          },
          exp: (nextState.exp || 0) + bonusExp,
          history: pushHistoryEntry(
            buildHistoryEntry({
              type: "timer_reward",
              payload: {
                taskId: session.taskId,
                coins: bonusCoins,
                exp: bonusExp,
                minutes: session.effectiveMinutes,
              },
            }),
            nextState.history
          ),
        };
      }
      return nextState;
    });

    return session;
  }, [state]);

  const updateCoinsPerYuan = useCallback((value) => {
    if (!state) return;
    const normalized = Math.max(1, Math.round(Number(value) || DEFAULT_COINS_PER_YUAN));
    saveCoinsPerYuan(normalized);
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        coinsPerYuan: normalized,
      },
    }));
  }, [state]);

  const addBatchPlan = useCallback((payload) => {
    if (!state || !payload) return;
    setState((prev) => ({
      ...prev,
      dailyBatchPlan: {
        id: newId(),
        dayKey: getTodayKey(),
        createdAt: Date.now(),
        ...payload,
      },
    }));
  }, [state]);

  const progressTreasureMapsInternal = (currentState, taskContext) => {
    if (!currentState.treasureMaps?.length) return currentState;

  const updatedMaps = currentState.treasureMaps.map((map) => {
    if (map.status === "completed") return map;
    const categories = map.targetCategories;
    const taskCategory = resolveCategoryKeyValue(taskContext.categoryKey || taskContext.category);
    const matchesCategory =
      !categories || categories.length === 0 || categories.includes(taskCategory);
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

  const unlockAchievement = useCallback((id) => {
    if (!state) return;
    const template = ACHIEVEMENTS_CONFIG.find((item) => resolveAchievementId(item) === id);
    if (!template) return;

    setState((prev) => {
      const updatedAchievements = (prev.achievements || []).map((ach) =>
        ach.id === id
          ? { ...ach, unlocked: true, unlockedAt: Date.now(), progress: ach.target || 0 }
          : ach
      );

      const updatedState = applyAchievementRewards({ ...prev, achievements: updatedAchievements }, template);
      return updatedState;
    });
  }, [state]);

  const updateAchievementProgress = useCallback((id, delta) => {
    if (!state) return;
    const template = ACHIEVEMENTS_CONFIG.find((item) => resolveAchievementId(item) === id);
    if (!template) return;

    setState((prev) => {
      let updatedState = { ...prev };
      const updatedAchievements = (prev.achievements || []).map((ach) => {
        if (ach.id !== id) return ach;
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
    attributes: state?.attributes || buildDefaultAttributes(),
    attributeHistory: state?.attributeHistory || [],
    notes: state?.notes || [],
    timerSessions: state?.timerSessions || [],
    settings: state?.settings || { ...DEFAULT_SETTINGS },
    dailyBatchPlan: state?.dailyBatchPlan || null,
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
    addNote,
    deleteNote,
    markNoteConverted,
    recordTimerSession,
    updateCoinsPerYuan,
    addBatchPlan,
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
    addNote,
    deleteNote,
    markNoteConverted,
    recordTimerSession,
    updateCoinsPerYuan,
    addBatchPlan,
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
  return useContext(WorldContext);
}
