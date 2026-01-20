"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TASK_TEMPLATES } from "@/game/config/tasksConfig";
import { BOARD_TILES } from "@/game/config/boardConfig";
import { RESOURCES } from "@/game/config/resources";
import { ITEMS } from "@/game/config/items";
import { CRAFTING_RECIPES } from "@/game/config/craftingConfig";
import { computeReward } from "@/game/config/rewards";
import { rollDice } from "@/game/engine/diceEngine";
import { resolveTileEvent } from "@/game/engine/tileEventEngine";
import { canAdvanceGameDay, getGameDayKey, getTodayKey, setGameDayKey } from "@/game/time";
import { safeLoad, safeSave } from "@/lib/storage";

const STORAGE_KEY = "lifeup.survival.v1";

const DEFAULT_RESOURCES = Object.keys(RESOURCES).reduce<Record<string, number>>((acc, key) => {
  acc[key] = 0;
  return acc;
}, {});

type DailyDropReward = {
  coins?: number;
  resources?: Record<string, number>;
};

type DailyDropState = {
  dayKey: string;
  claimed: boolean;
  reward: DailyDropReward;
};

type MonopolyRollState = {
  dayKey: string;
  rolled: boolean;
  lastRoll?: number;
};

type GameState = {
  coins: number;
  exp: number;
  resources: Record<string, number>;
  inventory: Record<string, number>;
  tasks: {
    templates: Record<string, any>;
    active: Array<any>;
  };
  taskStreaks: Record<string, any>;
  board: { tiles: typeof BOARD_TILES };
  player: { position: number; laps: number };
  npc: { position: number; laps: number };
  tileEvents: Array<any>;
  dailyDrop: DailyDropState;
  worldTime: {
    currentDay: number;
    lastAdvanceAt: number | null;
    gameDayKey: string;
  };
  buildState: { placedStructures: Array<{ itemId?: string; placedAt?: number }> };
  history: Array<any>;
  monopolyRoll: MonopolyRollState;
};

const DEFAULT_STATE: GameState = {
  coins: 0,
  exp: 0,
  resources: { ...DEFAULT_RESOURCES },
  inventory: {},
  tasks: {
    templates: { ...TASK_TEMPLATES },
    active: [],
  },
  taskStreaks: {},
  board: { tiles: BOARD_TILES },
  player: { position: 0, laps: 0 },
  npc: { position: 0, laps: 0 },
  tileEvents: [],
  dailyDrop: {
    dayKey: getTodayKey(),
    claimed: false,
    reward: { coins: 20 },
  },
  worldTime: {
    currentDay: 1,
    lastAdvanceAt: null,
    gameDayKey: getGameDayKey(),
  },
  buildState: { placedStructures: [] },
  history: [],
  monopolyRoll: {
    dayKey: getTodayKey(),
    rolled: false,
    lastRoll: undefined,
  },
};

type GameStateContextValue = {
  hydrated: boolean;
  coins: number;
  exp: number;
  resources: Record<string, number>;
  inventory: Record<string, number>;
  tasks: GameState["tasks"];
  taskStreaks: Record<string, any>;
  board: GameState["board"];
  player: GameState["player"];
  npc: GameState["npc"];
  tileEvents: GameState["tileEvents"];
  dailyDrop: GameState["dailyDrop"];
  worldTime: GameState["worldTime"];
  buildState: GameState["buildState"];
  monopolyRoll: GameState["monopolyRoll"];
  spawnTaskInstance: (templateId: string, options?: { bonusMultiplier?: number }) => any;
  completeTaskInstance: (instanceId: string) => any;
  registerTaskTemplates: (templates: Record<string, any>) => void;
  claimDailyDrop: () => boolean;
  addCoins: (amount: number, source?: string) => void;
  advanceWorldDay: () => void;
  movePlayer: (steps: number) => void;
  recordMonopolyRoll: (roll: number) => void;
  canCraft: (recipeId: string) => boolean;
  craft: (recipeId: string) => boolean;
  placeStructure: (itemId: string) => boolean;
  useItem: (itemId: string) => boolean;
  pushHistory: (entry: any) => void;
};

const DEFAULT_CONTEXT_VALUE: GameStateContextValue = {
  hydrated: false,
  coins: DEFAULT_STATE.coins,
  exp: DEFAULT_STATE.exp,
  resources: DEFAULT_STATE.resources,
  inventory: DEFAULT_STATE.inventory,
  tasks: DEFAULT_STATE.tasks,
  taskStreaks: DEFAULT_STATE.taskStreaks,
  board: DEFAULT_STATE.board,
  player: DEFAULT_STATE.player,
  npc: DEFAULT_STATE.npc,
  tileEvents: DEFAULT_STATE.tileEvents,
  dailyDrop: DEFAULT_STATE.dailyDrop,
  worldTime: DEFAULT_STATE.worldTime,
  buildState: DEFAULT_STATE.buildState,
  monopolyRoll: DEFAULT_STATE.monopolyRoll,
  spawnTaskInstance: () => null,
  completeTaskInstance: () => ({ ok: false }),
  registerTaskTemplates: () => undefined,
  claimDailyDrop: () => false,
  addCoins: () => undefined,
  advanceWorldDay: () => undefined,
  movePlayer: () => undefined,
  recordMonopolyRoll: () => undefined,
  canCraft: () => false,
  craft: () => false,
  placeStructure: () => false,
  useItem: () => false,
  pushHistory: () => undefined,
};

const GameStateContext = createContext<GameStateContextValue>(DEFAULT_CONTEXT_VALUE);

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function loadState(): GameState {
  const parsed = safeLoad<GameState | null>(STORAGE_KEY, null);
  if (!parsed) return { ...DEFAULT_STATE };
  return {
    ...DEFAULT_STATE,
    ...parsed,
    resources: { ...DEFAULT_RESOURCES, ...(parsed.resources || {}) },
    inventory: { ...(parsed.inventory || {}) },
    tasks: {
      templates: { ...TASK_TEMPLATES, ...(parsed.tasks?.templates || {}) },
      active: Array.isArray(parsed.tasks?.active) ? parsed.tasks.active : [],
    },
    taskStreaks: parsed.taskStreaks || {},
    board: parsed.board || { tiles: BOARD_TILES },
    player: parsed.player || { position: 0, laps: 0 },
    npc: parsed.npc || { position: 0, laps: 0 },
    tileEvents: Array.isArray(parsed.tileEvents) ? parsed.tileEvents : [],
    dailyDrop: parsed.dailyDrop || DEFAULT_STATE.dailyDrop,
    worldTime: parsed.worldTime || DEFAULT_STATE.worldTime,
    buildState: parsed.buildState || DEFAULT_STATE.buildState,
    history: Array.isArray(parsed.history) ? parsed.history : [],
    monopolyRoll: parsed.monopolyRoll || DEFAULT_STATE.monopolyRoll,
  };
}

function saveState(state: GameState) {
  safeSave(STORAGE_KEY, state);
}

function applyResourceChanges(base: Record<string, number>, changes?: Record<string, number>) {
  if (!changes) return base;
  const next = { ...base };
  Object.entries(changes).forEach(([id, amount]) => {
    next[id] = Math.max(0, (next[id] || 0) + (Number(amount) || 0));
  });
  return next;
}

function applyInventoryChanges(base: Record<string, number>, changes?: Record<string, number>) {
  if (!changes) return base;
  const next = { ...base };
  Object.entries(changes).forEach(([id, amount]) => {
    next[id] = Math.max(0, (next[id] || 0) + (Number(amount) || 0));
  });
  return next;
}

function refreshDailyDrop(previous: GameState) {
  const todayKey = getTodayKey();
  if (previous.dailyDrop?.dayKey === todayKey) return previous.dailyDrop;
  return {
    dayKey: todayKey,
    claimed: false,
    reward: {
      coins: 20 + Math.floor(Math.random() * 20),
      resources: {
        wood: Math.random() < 0.5 ? 1 : 0,
        stone: Math.random() < 0.3 ? 1 : 0,
      },
    },
  };
}

function refreshMonopolyRoll(previous: GameState) {
  const todayKey = getTodayKey();
  if (previous.monopolyRoll?.dayKey === todayKey) return previous.monopolyRoll;
  return {
    dayKey: todayKey,
    rolled: false,
    lastRoll: undefined,
  };
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => loadState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    setState((prev) => ({
      ...prev,
      dailyDrop: refreshDailyDrop(prev),
      monopolyRoll: refreshMonopolyRoll(prev),
    }));
  }, [hydrated]);

  const registerTaskTemplates = useCallback((templates: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        templates: { ...prev.tasks.templates, ...templates },
      },
    }));
  }, []);

  const spawnTaskInstance = useCallback(
    (templateId: string, options: { bonusMultiplier?: number } = {}) => {
      const template = state.tasks.templates[templateId];
      if (!template) return null;
      const activeList = state.tasks.active || [];
      const exists = activeList.find(
        (task) => task.templateId === templateId && task.status !== "done"
      );
      if (exists) return null;
      const instance = {
        instanceId: newId(),
        templateId,
        status: "pending",
        startedAt: Date.now(),
        bonusMultiplier: options.bonusMultiplier || 1,
      };
      setState((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          active: [instance, ...(prev.tasks.active || [])],
        },
      }));
      return instance;
    },
    [state.tasks]
  );

  const completeTaskInstance = useCallback(
    (instanceId: string) => {
      const instance = state.tasks.active.find((task) => task.instanceId === instanceId);
      if (!instance) return { ok: false };
      const template = state.tasks.templates[instance.templateId];
      if (!template) return { ok: false };

      const reward = computeReward({
        estimatedMinutes: template.estimatedMinutes,
        difficulty: template.difficulty,
        category: template.category,
      });
      const multiplier = instance.bonusMultiplier || 1;
      const rewardCoins = Math.round(reward.coins * multiplier);
      const rewardExp = Math.round(reward.exp * multiplier);

      const dice = rollDice();
      const tiles = state.board.tiles || BOARD_TILES;
      const tileCount = tiles.length || 1;
      const nextPosition = (state.player.position + dice.value) % tileCount;
      const nextLaps = state.player.laps + (state.player.position + dice.value >= tileCount ? 1 : 0);
      const tile = tiles[nextPosition];
      const tileEvent = resolveTileEvent(tile, {
        gameState: {
          history: state.history,
          tasks: { templates: state.tasks.templates },
        },
        lastTask: template,
      });

      const todayKey = getTodayKey();
      const prevStreak = state.taskStreaks[template.id] || { count: 0, lastDayKey: "" };
      const streak =
        prevStreak.lastDayKey === todayKey ? prevStreak.count : prevStreak.count + 1;

      const updatedActive = state.tasks.active.map((task) =>
        task.instanceId === instanceId
          ? { ...task, status: "done", completedAt: Date.now() }
          : task
      );

      const resourceDrops = reward.resourceDrops.reduce<Record<string, number>>((acc, drop) => {
        acc[drop.id] = (acc[drop.id] || 0) + drop.amount;
        return acc;
      }, {});

      const nextResources = applyResourceChanges(state.resources, {
        ...resourceDrops,
        ...(tileEvent.resourceChanges || {}),
      });

      const nextInventory = applyInventoryChanges(state.inventory, tileEvent.inventoryChanges);

      setState((prev) => ({
        ...prev,
        coins: prev.coins + rewardCoins + (tileEvent.coinsDelta || 0),
        exp: prev.exp + rewardExp + (tileEvent.expDelta || 0),
        resources: nextResources,
        inventory: nextInventory,
        tasks: {
          ...prev.tasks,
          active: updatedActive,
        },
        taskStreaks: {
          ...prev.taskStreaks,
          [template.id]: { count: streak, lastDayKey: todayKey },
        },
        player: { position: nextPosition, laps: nextLaps },
        tileEvents: [
          {
            id: newId(),
            templateId: template.id,
            tileId: tile.id,
            result: tileEvent,
            createdAt: Date.now(),
          },
          ...(prev.tileEvents || []),
        ],
      }));

      return {
        ok: true,
        reward: { coins: rewardCoins, exp: rewardExp, resourceDrops: reward.resourceDrops },
        diceValue: dice.value,
        boardSteps: dice.value,
        playerPosition: nextPosition,
        playerLaps: nextLaps,
        tileEvent: { tile, result: tileEvent },
      };
    },
    [state]
  );

  const claimDailyDrop = useCallback(() => {
    if (!state.dailyDrop || state.dailyDrop.claimed) return false;
    const reward = state.dailyDrop.reward || {};
    setState((prev) => ({
      ...prev,
      dailyDrop: { ...prev.dailyDrop, claimed: true },
      coins: prev.coins + (reward.coins || 0),
      resources: applyResourceChanges(prev.resources, reward.resources),
    }));
    return true;
  }, [state]);

  const addCoins = useCallback((amount: number, source = "manual") => {
    if (!amount) return;
    setState((prev) => ({
      ...prev,
      coins: prev.coins + amount,
      history: [
        ...(prev.history || []),
        { id: newId(), type: "coins_change", payload: { amount, source }, timestamp: Date.now() },
      ],
    }));
  }, []);

  const advanceWorldDay = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      if (!canAdvanceGameDay()) return prev;
      if (prev.worldTime?.lastAdvanceAt && now - prev.worldTime.lastAdvanceAt < 1000) {
        return prev;
      }
      const nextKey = setGameDayKey(getTodayKey());
      return {
        ...prev,
        worldTime: {
          currentDay: (prev.worldTime?.currentDay || 1) + 1,
          lastAdvanceAt: now,
          gameDayKey: nextKey,
        },
        dailyDrop: refreshDailyDrop(prev),
      };
    });
  }, []);

  const movePlayer = useCallback((steps: number) => {
    const tiles = state.board.tiles || BOARD_TILES;
    const tileCount = tiles.length || 1;
    const nextPosition = (state.player.position + steps) % tileCount;
    const nextLaps = state.player.laps + (state.player.position + steps >= tileCount ? 1 : 0);
    setState((prev) => ({
      ...prev,
      player: { position: nextPosition, laps: nextLaps },
    }));
  }, [state.board.tiles, state.player]);

  const recordMonopolyRoll = useCallback((roll: number) => {
    setState((prev) => ({
      ...prev,
      monopolyRoll: {
        dayKey: getTodayKey(),
        rolled: true,
        lastRoll: roll,
      },
    }));
  }, []);

  const canCraft = useCallback(
    (recipeId: string) => {
      const recipe = CRAFTING_RECIPES[recipeId];
      if (!recipe) return false;
      const costs = recipe.costs || {};
      const hasResources = Object.entries(costs).every(
        ([id, amount]) => (state.resources[id] || 0) >= (Number(amount) || 0)
      );
      const hasCoins = (state.coins || 0) >= (recipe.coinsCost || 0);
      return hasResources && hasCoins;
    },
    [state.coins, state.resources]
  );

  const craft = useCallback(
    (recipeId: string) => {
      const recipe = CRAFTING_RECIPES[recipeId];
      if (!recipe) return false;
      if (!canCraft(recipeId)) return false;
      const costs = recipe.costs || {};
      const yields = recipe.yields || {};
      setState((prev) => ({
        ...prev,
        coins: prev.coins - (recipe.coinsCost || 0),
        resources: applyResourceChanges(prev.resources, Object.fromEntries(
          Object.entries(costs).map(([id, amount]) => [id, -(Number(amount) || 0)])
        )),
        inventory: applyInventoryChanges(prev.inventory, yields),
      }));
      return true;
    },
    [canCraft]
  );

  const placeStructure = useCallback(
    (itemId: string) => {
      const currentCount = state.inventory[itemId] || 0;
      if (currentCount <= 0) return false;
      setState((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, [itemId]: Math.max(0, currentCount - 1) },
        buildState: {
          ...prev.buildState,
          placedStructures: [
            ...(prev.buildState?.placedStructures || []),
            { itemId, placedAt: Date.now() },
          ],
        },
      }));
      return true;
    },
    [state.inventory]
  );

  const useItem = useCallback(
    (itemId: string) => {
      const currentCount = state.inventory[itemId] || 0;
      if (currentCount <= 0) return false;
      setState((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, [itemId]: Math.max(0, currentCount - 1) },
        history: [
          ...(prev.history || []),
          {
            id: newId(),
            type: "ticket_use",
            payload: { itemId, title: ITEMS[itemId]?.name || itemId },
            timestamp: Date.now(),
          },
        ],
      }));
      return true;
    },
    [state.inventory]
  );

  const pushHistory = useCallback((entry: any) => {
    if (!entry) return;
    setState((prev) => ({
      ...prev,
      history: [...(prev.history || []), { ...entry, id: entry.id || newId() }],
    }));
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      coins: state.coins,
      exp: state.exp,
      resources: state.resources,
      inventory: state.inventory,
      tasks: state.tasks,
      taskStreaks: state.taskStreaks,
      board: state.board,
      player: state.player,
      npc: state.npc,
      tileEvents: state.tileEvents,
      dailyDrop: state.dailyDrop,
      worldTime: state.worldTime,
      buildState: state.buildState,
      monopolyRoll: state.monopolyRoll,
      spawnTaskInstance,
      completeTaskInstance,
      registerTaskTemplates,
      claimDailyDrop,
      addCoins,
      advanceWorldDay,
      movePlayer,
      recordMonopolyRoll,
      canCraft,
      craft,
      placeStructure,
      useItem,
      pushHistory,
    }),
    [
      hydrated,
      state,
      spawnTaskInstance,
      completeTaskInstance,
      registerTaskTemplates,
      claimDailyDrop,
      addCoins,
      advanceWorldDay,
      movePlayer,
      recordMonopolyRoll,
      canCraft,
      craft,
      placeStructure,
      useItem,
      pushHistory,
    ]
  );

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  return useContext(GameStateContext);
}
