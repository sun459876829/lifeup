"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// 默认项目列表
const DEFAULT_PROJECTS = [
  { id: "ququ", name: "曲曲系统", steps: 0, target: 10 },
  { id: "kaizhi", name: "开智学习", steps: 0, target: 10 },
  { id: "douyin", name: "抖音 / tiktok", steps: 0, target: 10 },
  { id: "english", name: "英语 / 背单词", steps: 0, target: 10 },
  { id: "eddy", name: "Eddy 指导", steps: 0, target: 10 },
  { id: "life", name: "生活整理", steps: 0, target: 10 },
];

// 抽奖奖品池
const LOTTERY_PRIZES = [
  { id: "rest", name: "😴 休息券", emoji: "😴" },
  { id: "milktea", name: "🧋 奶茶券", emoji: "🧋" },
  { id: "nail", name: "💅 美甲基金", emoji: "💅" },
  { id: "coffee", name: "☕ 咖啡券", emoji: "☕" },
  { id: "snack", name: "🍰 小零食券", emoji: "🍰" },
];

const STORAGE_KEY = "lifeup.world.v1";
const OLD_STORAGE_KEY = "lifeup.magicworld.v1"; // 兼容旧数据

// 计算下一级所需经验
function calculateXpToNext(level) {
  return 20 + (level - 1) * 10;
}

// 创建默认状态
function createDefaultState() {
  const projectProgress = {};
  DEFAULT_PROJECTS.forEach((p) => {
    projectProgress[p.id] = { steps: 0, target: p.target };
  });

  const today = new Date().toISOString().split("T")[0];

  return {
    player: {
      level: 1,
      xp: 0,
      xpToNext: calculateXpToNext(1), // 20
    },
    currency: {
      coins: 0,
    },
    tasks: [],
    claims: [],
    ledger: [],
    daily: {
      date: today,
      bonusGiven: false,
    },
    projects: projectProgress,
    gems: {
      ruby: 0, // 红宝石
      sapphire: 0, // 蓝宝石
      emerald: 0, // 绿宝石
      amethyst: 0, // 紫水晶
    },
    treasureMaps: [], // 藏宝图列表
  };
}

// 迁移旧数据到新结构
function migrateOldData(oldData) {
  const newState = createDefaultState();

  // 迁移玩家数据
  if (oldData.level !== undefined) {
    newState.player.level = oldData.level;
  }
  if (oldData.xp !== undefined) {
    newState.player.xp = oldData.xp;
  }
  if (oldData.xpForNext !== undefined) {
    newState.player.xpToNext = oldData.xpForNext;
  } else {
    newState.player.xpToNext = calculateXpToNext(newState.player.level);
  }

  // 迁移金币
  if (oldData.coins !== undefined) {
    newState.currency.coins = oldData.coins;
  }

  // 迁移任务
  if (Array.isArray(oldData.tasks)) {
    newState.tasks = oldData.tasks;
  }

  // 迁移奖励
  if (Array.isArray(oldData.claims)) {
    newState.claims = oldData.claims;
  }

  // 迁移项目进度
  if (oldData.projectProgress) {
    // 确保每个项目都有 target 字段
    Object.keys(oldData.projectProgress).forEach((projectId) => {
      const oldProgress = oldData.projectProgress[projectId];
      newState.projects[projectId] = {
        steps: oldProgress.steps || 0,
        target: oldProgress.target || 10,
      };
    });
  }

  // 迁移宝石（旧格式：red/blue/green/purple -> 新格式：ruby/sapphire/emerald/amethyst）
  if (oldData.gems) {
    if (oldData.gems.red !== undefined) newState.gems.ruby = oldData.gems.red;
    if (oldData.gems.blue !== undefined) newState.gems.sapphire = oldData.gems.blue;
    if (oldData.gems.green !== undefined) newState.gems.emerald = oldData.gems.emerald;
    if (oldData.gems.purple !== undefined) newState.gems.amethyst = oldData.gems.amethyst;
  }

  // 迁移藏宝图（如果有）
  if (Array.isArray(oldData.treasureMaps)) {
    newState.treasureMaps = oldData.treasureMaps;
  }

  return newState;
}

// 加载状态（兼容旧数据）
function loadState() {
  if (typeof window === "undefined") return createDefaultState();

  try {
    // 先尝试加载新格式
    const newRaw = localStorage.getItem(STORAGE_KEY);
    if (newRaw) {
      const parsed = JSON.parse(newRaw);
      return { ...createDefaultState(), ...parsed };
    }

    // 如果没有新格式，尝试加载旧格式并迁移
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const oldData = JSON.parse(oldRaw);
      const migrated = migrateOldData(oldData);
      // 保存为新格式
      saveState(migrated);
      // 可选：删除旧数据
      // localStorage.removeItem(OLD_STORAGE_KEY);
      return migrated;
    }

    return createDefaultState();
  } catch (error) {
    console.error("Failed to load state:", error);
    return createDefaultState();
  }
}

// 保存状态
function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

const MagicWorldContext = createContext(null);

export function MagicWorldProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(null);

  // 初始化：从 localStorage 加载数据
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  // 自动保存到 localStorage
  useEffect(() => {
    if (!hydrated || !state) return;
    saveState(state);
  }, [state, hydrated]);

  // 生成新 ID
  function newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
  }

  // 增加经验并处理升级
  function gainXp(amount, reason = "") {
    if (!state || amount <= 0) return;

    let newLevel = state.player.level;
    let newXp = state.player.xp + amount;
    let newXpToNext = state.player.xpToNext;
    const levelUps = [];

    // 处理可能的多级升级
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = calculateXpToNext(newLevel);
      levelUps.push(newLevel);
    }

    const newState = {
      ...state,
      player: {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
      },
    };

    // 记录到流水
    if (reason) {
      newState.ledger = [
        ...(newState.ledger || []),
        {
          id: newId(),
          type: "xp",
          amount,
          reason,
          ts: Date.now(),
        },
      ];
    }

    setState(newState);
    return { levelUps, newLevel, newXp };
  }

  // 获得金币
  function earnCoins(amount, reason = "") {
    if (!state || amount <= 0) return;

    const newState = {
      ...state,
      currency: {
        ...state.currency,
        coins: state.currency.coins + amount,
      },
    };

    // 记录到流水
    if (reason) {
      newState.ledger = [
        ...(newState.ledger || []),
        {
          id: newId(),
          type: "earn",
          amount,
          reason,
          ts: Date.now(),
        },
      ];
    }

    setState(newState);
    return newState.currency.coins;
  }

  // 花费金币
  function spendCoins(amount, reason = "") {
    if (!state || amount <= 0) return false;
    if (state.currency.coins < amount) return false;

    const newState = {
      ...state,
      currency: {
        ...state.currency,
        coins: state.currency.coins - amount,
      },
    };

    // 记录到流水
    if (reason) {
      newState.ledger = [
        ...(newState.ledger || []),
        {
          id: newId(),
          type: "spend",
          amount,
          reason,
          ts: Date.now(),
        },
      ];
    }

    setState(newState);
    return true;
  }

  // 计算任务奖励
  function calculateTaskRewards(type, estMinutes) {
    let baseCoins = 5;
    let baseXp = 5;

    if (estMinutes && estMinutes > 0) {
      baseCoins = Math.max(2, Math.round(estMinutes / 5));
      baseXp = baseCoins; // XP 与金币相同
    }

    // 项目型任务加成 50%
    if (type === "project") {
      baseCoins = Math.round(baseCoins * 1.5);
      baseXp = Math.round(baseXp * 1.5);
    }

    return {
      rewardCoins: baseCoins,
      rewardXp: baseXp,
    };
  }

  // 添加任务
  function addTask(taskInput) {
    if (!state) return;

    const taskData = typeof taskInput === "string" 
      ? { title: taskInput, type: "oneoff" }
      : taskInput;

    const title = taskData.title?.trim();
    if (!title) return;

    const type = taskData.type || "oneoff";
    const estMinutes = taskData.estMinutes;
    const projectId = taskData.projectId;

    const { rewardCoins, rewardXp } = calculateTaskRewards(type, estMinutes);

    const newTask = {
      id: newId(),
      title: title,
      status: "todo",
      type: type, // "repeat" | "oneoff" | "project"
      projectId: type === "project" ? projectId : undefined,
      rewardCoins,
      rewardXp,
      estMinutes: estMinutes || undefined,
      createdAt: Date.now(),
    };

    setState({
      ...state,
      tasks: [newTask, ...(state.tasks || [])],
    });
  }

  // 完成任务
  function completeTask(id) {
    if (!state) return null;

    const task = (state.tasks || []).find((t) => t.id === id);
    if (!task) return null;

    // 如果是已完成的一次性任务，不再重复给奖励
    if (task.type === "oneoff" && task.status === "done") {
      return null;
    }

    const rewardCoins = task.rewardCoins || 5;
    const rewardXp = task.rewardXp || 5;

    // 处理经验升级
    let newLevel = state.player.level;
    let newXp = state.player.xp + rewardXp;
    let newXpToNext = state.player.xpToNext;
    const levelUps = [];

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = calculateXpToNext(newLevel);
      levelUps.push(newLevel);
    }

    // 根据任务类型处理状态
    let updatedTasks;
    if (task.type === "oneoff") {
      // 一次性任务：标记为完成
      updatedTasks = (state.tasks || []).map((t) =>
        t.id === id ? { ...t, status: "done" } : t
      );
    } else if (task.type === "repeat") {
      // 可重复任务：重置为待办
      updatedTasks = (state.tasks || []).map((t) =>
        t.id === id ? { ...t, status: "todo" } : t
      );
    } else {
      // 项目型任务：标记为完成
      updatedTasks = (state.tasks || []).map((t) =>
        t.id === id ? { ...t, status: "done" } : t
      );
    }

    // 如果是项目型任务，推进项目进度并处理里程碑奖励
    let updatedProjects = { ...state.projects };
    let updatedGems = { ...state.gems };
    let updatedClaims = [...(state.claims || [])];

    if (task.type === "project" && task.projectId) {
      const currentSteps = state.projects[task.projectId]?.steps || 0;
      const target = state.projects[task.projectId]?.target || 10;
      const newSteps = Math.min(currentSteps + 1, target);

      // 检查里程碑（3/6/10 步）
      const milestones = [
        { step: 3, gem: "emerald", name: "绿宝石" },
        { step: 6, gem: "sapphire", name: "蓝宝石" },
        { step: 10, gem: "amethyst", name: "紫水晶" },
      ];

      const reachedMilestones = milestones.filter(
        (m) => currentSteps < m.step && newSteps >= m.step
      );

      // 更新项目进度
      updatedProjects[task.projectId] = { steps: newSteps, target };

      // 处理里程碑奖励
      const projectName = DEFAULT_PROJECTS.find((p) => p.id === task.projectId)?.name || task.projectId;
      reachedMilestones.forEach((milestone) => {
        // 添加宝石
        updatedGems[milestone.gem] = (updatedGems[milestone.gem] || 0) + 1;

        // 10 步时添加完成奖励
        if (milestone.step === 10) {
          updatedClaims.push({
            id: newId(),
            type: "project",
            name: `✨ 完成「${projectName}」阶段性任务`,
            ts: Date.now(),
          });
        }
      });
    } else {
      updatedGems = { ...state.gems };
    }

    // 检查是否项目完成（达到 target），如果是则生成 A 级藏宝图
    let updatedTreasureMaps = [...(state.treasureMaps || [])];
    let treasureMapBaseRewardCoins = 0;
    let treasureMapBaseRewardXp = 0;
    let treasureMapName = "";
    
    if (task.type === "project" && task.projectId) {
      const projectSteps = updatedProjects[task.projectId]?.steps || 0;
      const projectTarget = updatedProjects[task.projectId]?.target || 10;
      const projectName = DEFAULT_PROJECTS.find((p) => p.id === task.projectId)?.name || task.projectId;
      
      // 如果项目达到目标，生成 A 级藏宝图
      if (projectSteps >= projectTarget) {
        const baseRewardCoins = 50;
        const baseRewardXp = 30;
        treasureMapBaseRewardCoins = baseRewardCoins;
        treasureMapBaseRewardXp = baseRewardXp;
        treasureMapName = `A级·${projectName}藏宝图`;
        
        const newMap = {
          id: newId(),
          name: treasureMapName,
          tier: "A",
          source: "project",
          createdAt: Date.now(),
          status: "new",
          baseRewardClaimed: true, // 立即发放基础奖励
          condition: {
            type: "tasksWithinDays",
            tasksNeeded: 5,
            daysLimit: 7,
          },
          baseReward: {
            coins: baseRewardCoins,
            xp: baseRewardXp,
            claimName: "🎁 藏宝图基础奖励券",
          },
          bigReward: {
            coins: 200,
            xp: 100,
            claimName: "🎉 完成藏宝图·大礼盒券",
          },
        };
        
        updatedTreasureMaps.push(newMap);
        // 发放藏宝图基础奖励（额外奖励，不包含在任务奖励中）
        updatedClaims.push({
          id: newId(),
          type: "treasure",
          name: newMap.baseReward.claimName,
          ts: Date.now(),
        });
        // 基础奖励的金币和 XP 需要额外添加
        rewardCoins += baseRewardCoins;
        newXp += baseRewardXp;
        // 处理可能的升级
        while (newXp >= newXpToNext) {
          newXp -= newXpToNext;
          newLevel += 1;
          newXpToNext = calculateXpToNext(newLevel);
          levelUps.push(newLevel);
        }
      }
    }

    // 更新所有状态
    const ledgerEntries = [
      {
        id: newId(),
        type: "earn",
        amount: rewardCoins,
        reason: `完成任务：${task.title}`,
        ts: Date.now(),
      },
      {
        id: newId(),
        type: "xp",
        amount: rewardXp,
        reason: `完成任务：${task.title}`,
        ts: Date.now(),
      },
    ];

    // 如果有藏宝图基础奖励，单独记录
    if (treasureMapBaseRewardCoins > 0) {
      ledgerEntries.push({
        id: newId(),
        type: "earn",
        amount: treasureMapBaseRewardCoins,
        reason: `获得藏宝图：${treasureMapName}`,
        ts: Date.now(),
      });
    }
    if (treasureMapBaseRewardXp > 0) {
      ledgerEntries.push({
        id: newId(),
        type: "xp",
        amount: treasureMapBaseRewardXp,
        reason: `获得藏宝图：${treasureMapName}`,
        ts: Date.now(),
      });
    }

    const newState = {
      ...state,
      tasks: updatedTasks,
      projects: updatedProjects,
      gems: updatedGems,
      claims: updatedClaims,
      treasureMaps: updatedTreasureMaps,
      currency: {
        ...state.currency,
        coins: state.currency.coins + rewardCoins,
      },
      player: {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
      },
      ledger: [...(state.ledger || []), ...ledgerEntries],
    };

    setState(newState);
    return { rewardCoins, rewardXp, levelUps };
  }

  // 增加宝石
  function addGem(type, count = 1) {
    if (!state || count <= 0) return;

    const gemMap = {
      red: "ruby",
      blue: "sapphire",
      green: "emerald",
      purple: "amethyst",
      ruby: "ruby",
      sapphire: "sapphire",
      emerald: "emerald",
      amethyst: "amethyst",
    };

    const gemKey = gemMap[type];
    if (!gemKey) return;

    setState({
      ...state,
      gems: {
        ...state.gems,
        [gemKey]: (state.gems[gemKey] || 0) + count,
      },
    });
  }

  // 宝石合成
  function fuseGem(gemType) {
    if (!state) return { success: false, message: "状态未初始化" };

    const count = state.gems[gemType] || 0;
    if (count < 3) {
      return {
        success: false,
        message: `💎 ${gemType === "emerald" ? "绿宝石" : gemType === "sapphire" ? "蓝宝石" : gemType === "amethyst" ? "紫水晶" : "红宝石"}不足（需要 3 颗），当前只有 ${count} 颗。`,
      };
    }

    // 定义合成奖励
    const rewards = {
      emerald: {
        name: "😴 休息 1 小时券",
        xp: 10,
      },
      sapphire: {
        name: "🎁 自选奖励券（可以随便奖励自己一次）",
        xp: 15,
      },
      amethyst: {
        name: "🎉 大礼盒券（可以兑换大件，比如美甲/电影/好好吃一顿）",
        xp: 20,
      },
      ruby: {
        name: "🎁 自选奖励券",
        xp: 10,
      },
    };

    const reward = rewards[gemType] || rewards.ruby;

    // 扣除宝石
    const updatedGems = {
      ...state.gems,
      [gemType]: count - 3,
    };

    // 添加奖励到 claims
    const newClaim = {
      id: newId(),
      type: "fusion",
      name: reward.name,
      ts: Date.now(),
    };

    // 处理经验升级（如果给经验）
    let newLevel = state.player.level;
    let newXp = state.player.xp + reward.xp;
    let newXpToNext = state.player.xpToNext;
    const levelUps = [];

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = calculateXpToNext(newLevel);
      levelUps.push(newLevel);
    }

    // 检查是否合成紫宝石，如果是则生成 S 级藏宝图
    let updatedTreasureMaps = [...(state.treasureMaps || [])];
    let updatedClaims = [...(state.claims || []), newClaim];
    let updatedCoins = state.currency.coins;
    let updatedXp = newXp;
    let updatedLevel = newLevel;
    let updatedXpToNext = newXpToNext;

    if (gemType === "amethyst") {
      // 合成紫宝石时，生成 S 级藏宝图
      const baseRewardCoins = 100;
      const baseRewardXp = 50;
      
      const newMap = {
        id: newId(),
        name: "S级·月光藏宝图",
        tier: "S",
        source: "gem",
        createdAt: Date.now(),
        status: "new",
        baseRewardClaimed: true, // 立即发放基础奖励
        condition: {
          type: "tasksWithinDays",
          tasksNeeded: 10,
          daysLimit: 14,
        },
        baseReward: {
          coins: baseRewardCoins,
          xp: baseRewardXp,
          claimName: "🌟 藏宝图基础奖励券（S级）",
        },
        bigReward: {
          coins: 500,
          xp: 200,
          claimName: "🎊 完成S级藏宝图·超级大礼盒券",
        },
      };
      
      updatedTreasureMaps.push(newMap);
      updatedCoins += baseRewardCoins;
      updatedXp += baseRewardXp;
      
      // 处理可能的升级
      while (updatedXp >= updatedXpToNext) {
        updatedXp -= updatedXpToNext;
        updatedLevel += 1;
        updatedXpToNext = calculateXpToNext(updatedLevel);
        levelUps.push(updatedLevel);
      }
      
      updatedClaims.push({
        id: newId(),
        type: "treasure",
        name: newMap.baseReward.claimName,
        ts: Date.now(),
      });
    }

    setState({
      ...state,
      gems: updatedGems,
      claims: updatedClaims,
      treasureMaps: updatedTreasureMaps,
      currency: {
        ...state.currency,
        coins: updatedCoins,
      },
      player: {
        level: updatedLevel,
        xp: updatedXp,
        xpToNext: updatedXpToNext,
      },
      ledger: [
        ...(state.ledger || []),
        {
          id: newId(),
          type: "xp",
          amount: reward.xp,
          reason: `宝石合成：${gemType}`,
          ts: Date.now(),
        },
        ...(gemType === "amethyst" ? [{
          id: newId(),
          type: "earn",
          amount: 100,
          reason: "获得S级藏宝图",
          ts: Date.now(),
        }, {
          id: newId(),
          type: "xp",
          amount: 50,
          reason: "获得S级藏宝图",
          ts: Date.now(),
        }] : []),
      ],
    });

    return {
      success: true,
      message: `✨ 合成成功！获得「${reward.name}」${levelUps.length > 0 ? `，升级到 Lv.${levelUps[levelUps.length - 1]}！` : ""}${gemType === "amethyst" ? " 并获得S级藏宝图！" : ""}`,
      reward: reward.name,
    };
  }

  // 项目进度前进（独立调用时使用，completeTask 中已集成此逻辑）
  function advanceProject(projectId, steps = 1) {
    if (!state || steps <= 0) return;

    const currentSteps = state.projects[projectId]?.steps || 0;
    const target = state.projects[projectId]?.target || 10;
    const newSteps = Math.min(currentSteps + steps, target);

    // 检查里程碑（3/6/10 步）
    const milestones = [
      { step: 3, gem: "emerald", name: "绿宝石" },
      { step: 6, gem: "sapphire", name: "蓝宝石" },
      { step: 10, gem: "amethyst", name: "紫水晶" },
    ];

    const reachedMilestones = milestones.filter(
      (m) => currentSteps < m.step && newSteps >= m.step
    );

    // 更新宝石和奖励
    let updatedGems = { ...state.gems };
    let updatedClaims = [...(state.claims || [])];
    const projectName = DEFAULT_PROJECTS.find((p) => p.id === projectId)?.name || projectId;

    reachedMilestones.forEach((milestone) => {
      // 添加宝石
      updatedGems[milestone.gem] = (updatedGems[milestone.gem] || 0) + 1;

      // 10 步时添加完成奖励
      if (milestone.step === 10) {
        updatedClaims.push({
          id: newId(),
          type: "project",
          name: `✨ 完成「${projectName}」阶段性任务`,
          ts: Date.now(),
        });
      }
    });

    setState({
      ...state,
      projects: {
        ...state.projects,
        [projectId]: { steps: newSteps, target },
      },
      gems: updatedGems,
      claims: updatedClaims,
    });

    return { newSteps, reachedMilestones };
  }

  // 商店兑换（redeem）
  function redeem(name, cost) {
    if (!state) return { success: false, message: "状态未初始化" };
    if (state.currency.coins < cost) {
      return {
        success: false,
        message: `🪙 金币不足！需要 ${cost}🪙，当前只有 ${state.currency.coins}🪙`,
      };
    }

    const claim = {
      id: newId(),
      type: "shop",
      name: name,
      ts: Date.now(),
    };

    setState({
      ...state,
      currency: {
        ...state.currency,
        coins: state.currency.coins - cost,
      },
      claims: [...(state.claims || []), claim],
      ledger: [
        ...(state.ledger || []),
        {
          id: newId(),
          type: "spend",
          amount: cost,
          reason: `购买：${name}`,
          ts: Date.now(),
        },
      ],
    });

    return { success: true, message: `✨ 成功兑换「${name}」！` };
  }

  // 抽奖（drawGacha）
  function drawGacha() {
    if (!state) return null;
    if (state.currency.coins < 10) {
      return {
        success: false,
        message: `🪙 金币不足！抽奖需要 10🪙，当前只有 ${state.currency.coins}🪙`,
      };
    }

    // 极小概率事件：生成藏宝图（r > 0.99，即 1% 概率）
    const randomValue = Math.random();
    let treasureMapGenerated = false;
    let updatedTreasureMaps = [...(state.treasureMaps || [])];
    let updatedClaims = [...(state.claims || [])];
    let bonusCoins = 0;
    let bonusXp = 0;
    let bonusMessage = "";

    if (randomValue > 0.99) {
      // 1% 概率生成藏宝图
      const tier = randomValue > 0.995 ? "A" : "B"; // 0.5% A级，0.5% B级
      const baseRewardCoins = tier === "A" ? 50 : 30;
      const baseRewardXp = tier === "A" ? 30 : 20;
      
      const newMap = {
        id: newId(),
        name: `${tier}级·幸运藏宝图`,
        tier: tier,
        source: "gacha",
        createdAt: Date.now(),
        status: "new",
        baseRewardClaimed: true, // 立即发放基础奖励
        condition: {
          type: "tasksWithinDays",
          tasksNeeded: tier === "A" ? 5 : 3,
          daysLimit: tier === "A" ? 7 : 5,
        },
        baseReward: {
          coins: baseRewardCoins,
          xp: baseRewardXp,
          claimName: `🎁 藏宝图基础奖励券（${tier}级）`,
        },
        bigReward: {
          coins: tier === "A" ? 200 : 100,
          xp: tier === "A" ? 100 : 50,
          claimName: tier === "A" ? "🎉 完成A级藏宝图·大礼盒券" : "🎁 完成B级藏宝图·礼盒券",
        },
      };
      
      updatedTreasureMaps.push(newMap);
      bonusCoins = baseRewardCoins;
      bonusXp = baseRewardXp;
      bonusMessage = ` 并获得${tier}级藏宝图！`;
      
      updatedClaims.push({
        id: newId(),
        type: "treasure",
        name: newMap.baseReward.claimName,
        ts: Date.now(),
      });
      
      treasureMapGenerated = true;
    }

    // 随机抽取奖品
    const prize = LOTTERY_PRIZES[Math.floor(Math.random() * LOTTERY_PRIZES.length)];

    const claim = {
      id: newId(),
      type: "lottery",
      name: prize.name,
      emoji: prize.emoji,
      ts: Date.now(),
    };

    // 处理经验升级（如果给了藏宝图奖励）
    let newLevel = state.player.level;
    let newXp = state.player.xp + bonusXp;
    let newXpToNext = state.player.xpToNext;
    const levelUps = [];

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = calculateXpToNext(newLevel);
      levelUps.push(newLevel);
    }

    setState({
      ...state,
      currency: {
        ...state.currency,
        coins: state.currency.coins - 10 + bonusCoins,
      },
      treasureMaps: updatedTreasureMaps,
      claims: [...updatedClaims, claim],
      player: {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
      },
      ledger: [
        ...(state.ledger || []),
        {
          id: newId(),
          type: "spend",
          amount: 10,
          reason: "抽奖",
          ts: Date.now(),
        },
        ...(treasureMapGenerated ? [{
          id: newId(),
          type: "earn",
          amount: bonusCoins,
          reason: "抽奖获得藏宝图",
          ts: Date.now(),
        }, {
          id: newId(),
          type: "xp",
          amount: bonusXp,
          reason: "抽奖获得藏宝图",
          ts: Date.now(),
        }] : []),
      ],
    });

    return {
      success: true,
      message: `🎰 抽中了「${prize.name}」！${bonusMessage}${levelUps.length > 0 ? ` 升级到 Lv.${levelUps[levelUps.length - 1]}！` : ""}`,
      prize: prize.name,
    };
  }

  // 使用奖励（标记为已使用）
  function useClaim(id) {
    if (!state) return;

    const updatedClaims = (state.claims || []).map((claim) =>
      claim.id === id ? { ...claim, used: true } : claim
    );

    setState({
      ...state,
      claims: updatedClaims,
    });
  }

  // 添加藏宝图
  function addTreasureMap(mapInput) {
    if (!state) return null;

    const {
      name,
      tier = "B", // "A" | "S" | "B"
      source = "project", // "project" | "gacha" | "gem"
      condition = {},
      baseReward = {},
      bigReward = {},
    } = mapInput;

    if (!name) return null;

    const newMap = {
      id: newId(),
      name,
      tier,
      source,
      createdAt: Date.now(),
      status: "new",
      baseRewardClaimed: false,
      condition: {
        type: condition.type || "tasksWithinDays",
        tasksNeeded: condition.tasksNeeded,
        daysLimit: condition.daysLimit,
        projectId: condition.projectId,
        targetSteps: condition.targetSteps,
      },
      baseReward: {
        coins: baseReward.coins || 0,
        xp: baseReward.xp || 0,
        claimName: baseReward.claimName,
      },
      bigReward: {
        coins: bigReward.coins || 0,
        xp: bigReward.xp || 0,
        claimName: bigReward.claimName,
      },
    };

    // 立即发放基础奖励
    let updatedState = { ...state };
    let updatedClaims = [...(state.claims || [])];

    // 增加金币
    if (newMap.baseReward.coins > 0) {
      updatedState.currency = {
        ...state.currency,
        coins: state.currency.coins + newMap.baseReward.coins,
      };
      updatedState.ledger = [
        ...(updatedState.ledger || []),
        {
          id: newId(),
          type: "earn",
          amount: newMap.baseReward.coins,
          reason: `获得藏宝图：${name}`,
          ts: Date.now(),
        },
      ];
    }

    // 增加经验
    if (newMap.baseReward.xp > 0) {
      let newLevel = updatedState.player.level;
      let newXp = updatedState.player.xp + newMap.baseReward.xp;
      let newXpToNext = updatedState.player.xpToNext;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = calculateXpToNext(newLevel);
      }

      updatedState.player = {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
      };

      updatedState.ledger = [
        ...(updatedState.ledger || []),
        {
          id: newId(),
          type: "xp",
          amount: newMap.baseReward.xp,
          reason: `获得藏宝图：${name}`,
          ts: Date.now(),
        },
      ];
    }

    // 添加奖励券（如果有）
    if (newMap.baseReward.claimName) {
      updatedClaims.push({
        id: newId(),
        type: "treasure",
        name: newMap.baseReward.claimName,
        ts: Date.now(),
      });
    }

    // 标记基础奖励已发放
    newMap.baseRewardClaimed = true;

    // 更新状态
    updatedState.treasureMaps = [...(state.treasureMaps || []), newMap];
    updatedState.claims = updatedClaims;

    setState(updatedState);
    return newMap;
  }

  // 完成藏宝图
  function completeTreasureMap(id) {
    if (!state) return { success: false, message: "状态未初始化" };

    const map = (state.treasureMaps || []).find((m) => m.id === id);
    if (!map) {
      return { success: false, message: "找不到该藏宝图" };
    }

    if (map.status === "completed") {
      return { success: false, message: "该藏宝图已完成" };
    }

    // 简单检查条件（后续可以扩展）
    // 目前暂时允许直接完成
    let canComplete = true;
    let checkMessage = "";

    if (map.condition.type === "tasksWithinDays") {
      // 简化：暂时允许完成，后续可以检查任务数量
      canComplete = true;
    } else if (map.condition.type === "projectSteps") {
      const projectId = map.condition.projectId;
      const targetSteps = map.condition.targetSteps || 0;
      const currentSteps = state.projects[projectId]?.steps || 0;
      canComplete = currentSteps >= targetSteps;
      if (!canComplete) {
        checkMessage = `项目进度不足（需要 ${targetSteps} 步，当前 ${currentSteps} 步）`;
      }
    }

    if (!canComplete) {
      return { success: false, message: checkMessage || "条件未满足" };
    }

    // 发放大额奖励
    let updatedState = { ...state };
    let updatedClaims = [...(state.claims || [])];

    // 增加金币
    if (map.bigReward.coins > 0) {
      updatedState.currency = {
        ...state.currency,
        coins: state.currency.coins + map.bigReward.coins,
      };
      updatedState.ledger = [
        ...(updatedState.ledger || []),
        {
          id: newId(),
          type: "earn",
          amount: map.bigReward.coins,
          reason: `完成藏宝图：${map.name}`,
          ts: Date.now(),
        },
      ];
    }

    // 增加经验
    if (map.bigReward.xp > 0) {
      let newLevel = updatedState.player.level;
      let newXp = updatedState.player.xp + map.bigReward.xp;
      let newXpToNext = updatedState.player.xpToNext;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = calculateXpToNext(newLevel);
      }

      updatedState.player = {
        level: newLevel,
        xp: newXp,
        xpToNext: newXpToNext,
      };

      updatedState.ledger = [
        ...(updatedState.ledger || []),
        {
          id: newId(),
          type: "xp",
          amount: map.bigReward.xp,
          reason: `完成藏宝图：${map.name}`,
          ts: Date.now(),
        },
      ];
    }

    // 添加奖励券（如果有）
    if (map.bigReward.claimName) {
      updatedClaims.push({
        id: newId(),
        type: "treasure",
        name: map.bigReward.claimName,
        ts: Date.now(),
      });
    }

    // 更新藏宝图状态
    updatedState.treasureMaps = (state.treasureMaps || []).map((m) =>
      m.id === id ? { ...m, status: "completed" } : m
    );
    updatedState.claims = updatedClaims;

    setState(updatedState);
    return {
      success: true,
      message: `✨ 完成藏宝图「${map.name}」！获得大额奖励！`,
    };
  }

  const gems = state?.gems || { ruby: 0, sapphire: 0, emerald: 0, amethyst: 0 };
  const projects = state?.projects || {};

  const value = {
    // 状态
    hydrated,
    player: state?.player || { level: 1, xp: 0, xpToNext: 20 },
    currency: state?.currency || { coins: 0 },
    tasks: state?.tasks || [],
    claims: state?.claims || [],
    ledger: state?.ledger || [],
    daily: state?.daily || { date: new Date().toISOString().split("T")[0], bonusGiven: false },
    projects,
    gems,
    treasureMaps: state?.treasureMaps || [],

    // 兼容旧接口（为了不破坏现有页面）
    wallet: state?.currency?.coins || 0,
    projectProgress: projects,

    // 方法
    addTask,
    completeTask,
    earnCoins,
    spendCoins,
    gainXp,
    addGem,
    fuseGem,
    advanceProject,
    redeem,
    drawGacha,
    useClaim,
    addTreasureMap,
    completeTreasureMap,
  };

  return (
    <MagicWorldContext.Provider value={value}>
      {children}
    </MagicWorldContext.Provider>
  );
}

export function useMagicWorld() {
  const context = useContext(MagicWorldContext);
  if (!context) {
    throw new Error("useMagicWorld must be used within MagicWorldProvider");
  }
  return context;
}
