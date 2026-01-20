"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { computeReward } from "@/game/config/rewards";
import { BOARD_TILES, type BoardTile } from "@/game/config/boardConfig";
import { RESOURCES } from "@/game/config/resources";
import { TASK_TEMPLATES } from "@/game/config/tasksConfig";
import { CRAFTING_RECIPES } from "@/game/config/craftingConfig";
import { rollDice } from "@/game/engine/diceEngine";
import {
  resolveTileEvent,
  type TileEventResult,
} from "@/game/engine/tileEventEngine";
import { loadHistory, pushHistory as pushHistoryEntry } from "@/game/history";

export type TaskDifficulty = "tiny" | "small" | "medium" | "large" | "huge";
export type TaskCategory =
  | "learning"
  | "cleaning"
  | "work"
  | "health"
  | "context"
  | "explore"
  | "english"
  | "other";

export type TaskTemplate = {
  id: string;
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  repeatable: boolean;
  estimatedMinutes: number;
  description?: string;
  maxInstances?: number;
};

export type TaskInstance = {
  instanceId: string;
  templateId: string;
  status: "pending" | "active" | "done";
  startedAt?: number | null;
  finishedAt?: number | null;
  actualMinutes?: number | null;
  bonusMultiplier?: number | null;
};

export type ParkedIdea = {
  id: string;
  text: string;
  createdAt: number;
  convertedAt?: number | null;
  templateId?: string | null;
};

export type TaskStreakState = {
  count: number;
  lastDoneDay: number | null;
};

export type HistoryEntry = {
  id: string;
  type:
    | "task_complete"
    | "task_start"
    | "coins_change"
    | "exp_change"
    | "resource_change"
    | "craft"
    | "world_advance"
    | "daily_drop_claimed"
    | "item_use"
    | "undo"
    | string;
  payload: Record<string, unknown>;
  timestamp: number;
};

export type BoardTileEventRecord = {
  tileId: string;
  tileType: string;
  result: TileEventResult;
  timestamp: number;
};

export type BoardTileEventOutcome = {
  tile: BoardTile;
  result: TileEventResult;
};

export type DailyDrop = {
  day: number;
  drops: Array<{ type: "coins" | "resource" | "item"; id?: string; amount: number }>;
  claimed: boolean;
};

export type GameState = {
  coins: number;
  exp: number;
  resources: Record<string, number>;
  inventory: Record<string, number>;
  dailyDrop: DailyDrop | null;
  board: {
    tiles: BoardTile[];
  };
  player: {
    position: number;
    laps: number;
  };
  npc: {
    position: number;
    laps: number;
  };
  worldTime: {
    currentDay: number;
    lastAdvanceAt: number | null;
  };
  tasks: {
    templates: Record<string, TaskTemplate>;
    active: TaskInstance[];
  };
  history: HistoryEntry[];
  tileEvents: BoardTileEventRecord[];
  parkedIdeas: ParkedIdea[];
  taskStreaks: Record<string, TaskStreakState>;
};

const STORAGE_KEY = "lifeup.survival.gamestate.v1";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function buildDefaultResources() {
  return Object.keys(RESOURCES).reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

function createDefaultState(): GameState {
  return {
    coins: 0,
    exp: 0,
    resources: buildDefaultResources(),
    inventory: {},
    dailyDrop: null,
    board: {
      tiles: BOARD_TILES,
    },
    player: {
      position: 0,
      laps: 0,
    },
    npc: {
      position: 0,
      laps: 0,
    },
    worldTime: {
      currentDay: 1,
      lastAdvanceAt: null,
    },
    tasks: {
      templates: { ...TASK_TEMPLATES },
      active: [],
    },
    history: [],
    tileEvents: [],
    parkedIdeas: [],
    taskStreaks: {},
  };
}

function normalizeState(raw: Partial<GameState> | null): GameState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

  const tiles = Array.isArray(raw.board?.tiles) ? raw.board?.tiles : base.board.tiles;
  const tileCount = tiles.length || base.board.tiles.length;
  const normalizePosition = (value: number | undefined) => {
    const position = Number.isFinite(value) ? Math.floor(Number(value)) : 0;
    if (tileCount <= 0) return 0;
    return ((position % tileCount) + tileCount) % tileCount;
  };

  return {
    coins: Number.isFinite(raw.coins) ? Number(raw.coins) : base.coins,
    exp: Number.isFinite(raw.exp) ? Number(raw.exp) : base.exp,
    resources: {
      ...base.resources,
      ...(raw.resources || {}),
    },
    inventory: {
      ...(raw.inventory || {}),
    },
    dailyDrop: raw.dailyDrop ?? base.dailyDrop,
    board: {
      tiles,
    },
    player: {
      position: normalizePosition(raw.player?.position),
      laps: Number.isFinite(raw.player?.laps) ? Math.max(0, Math.floor(raw.player?.laps ?? 0)) : 0,
    },
    npc: {
      position: normalizePosition(raw.npc?.position),
      laps: Number.isFinite(raw.npc?.laps) ? Math.max(0, Math.floor(raw.npc?.laps ?? 0)) : 0,
    },
    worldTime: {
      currentDay: raw.worldTime?.currentDay ?? base.worldTime.currentDay,
      lastAdvanceAt: raw.worldTime?.lastAdvanceAt ?? base.worldTime.lastAdvanceAt,
    },
    tasks: {
      templates: {
        ...base.tasks.templates,
        ...(raw.tasks?.templates || {}),
      },
      active: Array.isArray(raw.tasks?.active) ? raw.tasks.active : [],
    },
    history: Array.isArray(raw.history) ? raw.history : base.history,
    tileEvents: Array.isArray(raw.tileEvents) ? raw.tileEvents : base.tileEvents,
    parkedIdeas: Array.isArray(raw.parkedIdeas) ? raw.parkedIdeas : base.parkedIdeas,
    taskStreaks: raw.taskStreaks || base.taskStreaks,
  };
}

function loadState(): GameState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...createDefaultState(), history: loadHistory() };
    const parsed = JSON.parse(stored);
    return normalizeState({
      ...parsed,
      history: loadHistory(),
    });
  } catch (error) {
    console.error("Failed to load game state", error);
    return {
      ...createDefaultState(),
      history: loadHistory(),
    };
  }
}

function saveState(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    const { history, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (error) {
    console.error("Failed to save game state", error);
  }
}

function buildHistoryEntry(type: HistoryEntry["type"], payload: Record<string, unknown>) {
  return {
    id: newId(),
    type,
    payload,
    timestamp: Date.now(),
  };
}

function mergeResourceChanges(resources: Record<string, number>, changes: Record<string, number>) {
  const next = { ...resources };
  Object.entries(changes).forEach(([id, amount]) => {
    const delta = Number(amount) || 0;
    next[id] = Math.max(0, (next[id] || 0) + delta);
  });
  return next;
}

function mergeInventoryChanges(inventory: Record<string, number>, changes: Record<string, number>) {
  const next = { ...inventory };
  Object.entries(changes).forEach(([id, amount]) => {
    const delta = Number(amount) || 0;
    next[id] = Math.max(0, (next[id] || 0) + delta);
  });
  return next;
}

const COMMON_DROP_RESOURCES = ["wood", "fiber", "stone", "scrap"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeTaskStreakState(state?: TaskStreakState | null): TaskStreakState {
  if (!state || typeof state !== "object") {
    return { count: 0, lastDoneDay: null };
  }
  return {
    count: Number.isFinite(state.count) ? Math.max(0, Math.floor(state.count)) : 0,
    lastDoneDay: Number.isFinite(state.lastDoneDay) ? state.lastDoneDay : null,
  };
}

function generateDailyDrop(day: number): DailyDrop {
  const dropCount = randomInt(1, 3);
  const drops: DailyDrop["drops"] = [];
  for (let i = 0; i < dropCount; i += 1) {
    const roll = Math.random();
    if (roll < 0.05) {
      const itemId = Math.random() < 0.6 ? "gameTicket" : "snackVoucher10";
      drops.push({ type: "item", id: itemId, amount: 1 });
    } else if (roll < 0.5) {
      drops.push({ type: "coins", amount: randomInt(10, 50) });
    } else {
      const resourceId = COMMON_DROP_RESOURCES[randomInt(0, COMMON_DROP_RESOURCES.length - 1)];
      drops.push({ type: "resource", id: resourceId, amount: randomInt(1, 4) });
    }
  }
  return {
    day,
    drops,
    claimed: false,
  };
}

const GameStateContext = createContext<
  (GameState & {
    hydrated: boolean;
    addCoins: (amount: number, reason?: string) => void;
    addExp: (amount: number, reason?: string) => void;
    addResources: (changes: Record<string, number>, reason?: string) => void;
    consumeResources: (changes: Record<string, number>, reason?: string) => boolean;
    canCraft: (recipeId: string) => boolean;
    craft: (recipeId: string) => boolean;
    useItem: (itemId: string) => boolean;
    claimDailyDrop: () => boolean;
    registerTaskTemplates: (templates: Record<string, TaskTemplate>) => void;
    spawnTaskInstance: (
      templateId: string,
      options?: { bonusMultiplier?: number; startedAt?: number | null }
    ) => TaskInstance | null;
    movePlayer: (steps: number, options?: { lastTask?: TaskTemplate | null }) => BoardTileEventOutcome | null;
    moveNpc: (steps: number) => void;
    completeTaskInstance: (
      instanceId: string,
      options?: { actualMinutes?: number }
    ) => {
      ok: boolean;
      reward?: ReturnType<typeof computeReward>;
      diceValue?: number;
      boardSteps?: number;
      playerPosition?: number;
      playerLaps?: number;
      npcPosition?: number;
      npcLaps?: number;
      tileEvent?: BoardTileEventOutcome | null;
    };
    advanceWorldDay: () => void;
    pushHistory: (entry: HistoryEntry) => void;
    addParkedIdea: (text: string) => ParkedIdea | null;
    deleteParkedIdea: (ideaId: string) => void;
    markIdeaConverted: (ideaId: string, templateId: string) => void;
  }) | null
>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<GameState>(() => createDefaultState());
  const stateRef = useRef(state);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    stateRef.current = loaded;
    setHydrated(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setState((prev) => ({
      ...prev,
      history: pushHistoryEntry(entry, prev.history),
    }));
  }, []);

  const addCoins = useCallback((amount: number, reason = "manual_adjust") => {
    if (!amount) return;
    setState((prev) => {
      const entry = {
        type: "coins_change",
        payload: { delta: amount, reason },
        undo: {
          type: "reverse_coins_change",
          payload: { delta: amount },
        },
      };
      return {
        ...prev,
        coins: prev.coins + amount,
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const addExp = useCallback((amount: number, reason = "manual_adjust") => {
    if (!amount) return;
    const normalized = Math.max(0, Math.round(amount));
    if (!normalized) return;
    setState((prev) => {
      const entry = {
        type: "exp_change",
        payload: { delta: normalized, reason },
        undo: {
          type: "reverse_exp_change",
          payload: { delta: normalized },
        },
      };
      return {
        ...prev,
        exp: prev.exp + normalized,
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const addResources = useCallback((changes: Record<string, number>, reason = "manual_adjust") => {
    if (!changes || Object.keys(changes).length === 0) return;
    setState((prev) => {
      const entry = buildHistoryEntry("resource_change", { changes, reason });
      return {
        ...prev,
        resources: mergeResourceChanges(prev.resources, changes),
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const consumeResources = useCallback(
    (changes: Record<string, number>, reason = "consume") => {
      const current = stateRef.current;
      if (!current || !changes) return false;
      const isEnough = Object.entries(changes).every(([id, amount]) => {
        const need = Number(amount) || 0;
        return (current.resources[id] || 0) >= need;
      });
      if (!isEnough) return false;
      setState((prev) => {
        const entry = buildHistoryEntry("resource_change", { changes, reason });
        const negativeChanges = Object.fromEntries(
          Object.entries(changes).map(([id, amount]) => [id, -Math.abs(Number(amount) || 0)])
        );
        return {
          ...prev,
          resources: mergeResourceChanges(prev.resources, negativeChanges),
          history: pushHistoryEntry(entry, prev.history),
        };
      });
      return true;
    },
    []
  );

  const canCraft = useCallback((recipeId: string) => {
    const current = stateRef.current;
    const recipe = recipeId ? CRAFTING_RECIPES[recipeId] : null;
    if (!current || !recipe) return false;
    const hasResources = Object.entries(recipe.costs || {}).every(([id, amount]) => {
      const need = Number(amount) || 0;
      return (current.resources[id] || 0) >= need;
    });
    const coinCost = Number(recipe.coinsCost) || 0;
    const hasCoins = current.coins >= coinCost;
    return hasResources && hasCoins;
  }, []);

  const craft = useCallback((recipeId: string) => {
    const current = stateRef.current;
    const recipe = recipeId ? CRAFTING_RECIPES[recipeId] : null;
    if (!current || !recipe) return false;
    const canCraftNow = Object.entries(recipe.costs || {}).every(([id, amount]) => {
      const need = Number(amount) || 0;
      return (current.resources[id] || 0) >= need;
    });
    const coinCost = Number(recipe.coinsCost) || 0;
    if (!canCraftNow || current.coins < coinCost) return false;

    setState((prev) => {
      const entry = buildHistoryEntry("craft", {
        recipeId: recipe.id,
        costs: recipe.costs,
        yields: recipe.yields,
        coinsCost: coinCost,
      });
      const negativeCosts = Object.fromEntries(
        Object.entries(recipe.costs || {}).map(([id, amount]) => [id, -Math.abs(Number(amount) || 0)])
      );
      return {
        ...prev,
        coins: Math.max(0, prev.coins - coinCost),
        resources: mergeResourceChanges(prev.resources, negativeCosts),
        inventory: mergeInventoryChanges(prev.inventory, recipe.yields || {}),
        history: pushHistoryEntry(entry, prev.history),
      };
    });
    return true;
  }, []);

  const useItem = useCallback((itemId: string) => {
    const current = stateRef.current;
    if (!current || !itemId) return false;
    const currentCount = current.inventory[itemId] || 0;
    if (currentCount <= 0) return false;
    setState((prev) => {
      const entry = buildHistoryEntry("item_use", {
        itemId,
        delta: -1,
      });
      return {
        ...prev,
        inventory: mergeInventoryChanges(prev.inventory, { [itemId]: -1 }),
        history: pushHistoryEntry(entry, prev.history),
      };
    });
    return true;
  }, []);

  const claimDailyDrop = useCallback(() => {
    const current = stateRef.current;
    if (!current?.dailyDrop || current.dailyDrop.claimed) return false;
    const { drops } = current.dailyDrop;
    const coinGain = drops
      .filter((drop) => drop.type === "coins")
      .reduce((sum, drop) => sum + (Number(drop.amount) || 0), 0);
    const resourceChanges = drops
      .filter((drop) => drop.type === "resource" && drop.id)
      .reduce<Record<string, number>>((acc, drop) => {
        const id = drop.id as string;
        acc[id] = (acc[id] || 0) + (Number(drop.amount) || 0);
        return acc;
      }, {});
    const itemChanges = drops
      .filter((drop) => drop.type === "item" && drop.id)
      .reduce<Record<string, number>>((acc, drop) => {
        const id = drop.id as string;
        acc[id] = (acc[id] || 0) + (Number(drop.amount) || 0);
        return acc;
      }, {});

    setState((prev) => {
      const entry = buildHistoryEntry("daily_drop_claimed", {
        day: prev.dailyDrop?.day,
        drops,
      });
      return {
        ...prev,
        coins: prev.coins + coinGain,
        resources: mergeResourceChanges(prev.resources, resourceChanges),
        inventory: mergeInventoryChanges(prev.inventory, itemChanges),
        dailyDrop: prev.dailyDrop ? { ...prev.dailyDrop, claimed: true } : prev.dailyDrop,
        history: pushHistoryEntry(entry, prev.history),
      };
    });
    return true;
  }, []);

  const registerTaskTemplates = useCallback((templates: Record<string, TaskTemplate>) => {
    if (!templates || Object.keys(templates).length === 0) return;
    setState((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        templates: {
          ...prev.tasks.templates,
          ...templates,
        },
      },
    }));
  }, []);

  const addParkedIdea = useCallback((text: string) => {
    const trimmed = text?.trim();
    if (!trimmed) return null;
    const idea: ParkedIdea = {
      id: newId(),
      text: trimmed,
      createdAt: Date.now(),
      convertedAt: null,
      templateId: null,
    };
    setState((prev) => {
      const entry = buildHistoryEntry("idea_add", {
        ideaId: idea.id,
        text: idea.text,
      });
      return {
        ...prev,
        parkedIdeas: [idea, ...prev.parkedIdeas],
        history: pushHistoryEntry(entry, prev.history),
      };
    });
    return idea;
  }, []);

  const deleteParkedIdea = useCallback((ideaId: string) => {
    if (!ideaId) return;
    setState((prev) => {
      const entry = buildHistoryEntry("idea_delete", { ideaId });
      return {
        ...prev,
        parkedIdeas: prev.parkedIdeas.filter((idea) => idea.id !== ideaId),
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const markIdeaConverted = useCallback((ideaId: string, templateId: string) => {
    if (!ideaId) return;
    setState((prev) => ({
      ...prev,
      parkedIdeas: prev.parkedIdeas.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              convertedAt: Date.now(),
              templateId: templateId || idea.templateId,
            }
          : idea
      ),
    }));
  }, []);

  const spawnTaskInstance = useCallback(
    (templateId: string, options?: { bonusMultiplier?: number; startedAt?: number | null }) => {
    if (!templateId) return null;
    const template = stateRef.current.tasks.templates[templateId];
    if (!template) return null;
    const currentTasks = stateRef.current.tasks.active;
    if (template.repeatable) {
      const hasActive = currentTasks.some(
        (item) =>
          item.templateId === templateId && (item.status === "pending" || item.status === "active")
      );
      if (hasActive) return null;
    } else {
      const maxInstances = template.maxInstances ?? 1;
      const existingCount = currentTasks.filter((item) => item.templateId === templateId).length;
      if (existingCount >= maxInstances) return null;
    }
    const instance: TaskInstance = {
      instanceId: newId(),
      templateId,
      status: "active",
      startedAt: options?.startedAt ?? Date.now(),
      finishedAt: null,
      actualMinutes: null,
      bonusMultiplier: options?.bonusMultiplier ?? null,
    };

    setState((prev) => {
      const entry = buildHistoryEntry("task_start", {
        templateId,
        instanceId: instance.instanceId,
        title: template.title,
      });
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          active: [instance, ...prev.tasks.active],
        },
        history: pushHistoryEntry(entry, prev.history),
      };
    });

    return instance;
  }, []);

  const movePlayer = useCallback(
    (steps: number, options?: { lastTask?: TaskTemplate | null }) => {
      if (!Number.isFinite(steps) || !steps) return null;
      const current = stateRef.current;
      const tileCount = current.board.tiles.length;
      if (!tileCount) return null;
      const from = current.player.position;
      const target = from + steps;
      const to = ((target % tileCount) + tileCount) % tileCount;
      const lapsBefore = current.player.laps;
      const lapsAfter = target >= tileCount ? lapsBefore + 1 : lapsBefore;
      const tile = current.board.tiles[to];
      const result = resolveTileEvent(tile, { gameState: current, lastTask: options?.lastTask });
      const tileEventRecord: BoardTileEventRecord = {
        tileId: tile.id,
        tileType: tile.type,
        result,
        timestamp: Date.now(),
      };

      setState((prev) => {
        const entry = buildHistoryEntry("board_move_player", {
          from,
          to,
          steps,
          lapsBefore,
          lapsAfter,
        });
        const tileEventEntry = buildHistoryEntry("board_tile_event", {
          tileId: tile.id,
          tileType: tile.type,
          result,
        });
        const hasInventoryChanges =
          result.inventoryChanges && Object.keys(result.inventoryChanges).length > 0;
        return {
          ...prev,
          player: {
            position: to,
            laps: lapsAfter,
          },
          inventory: hasInventoryChanges
            ? mergeInventoryChanges(prev.inventory, result.inventoryChanges || {})
            : prev.inventory,
          tileEvents: [tileEventRecord, ...(prev.tileEvents || [])].slice(0, 20),
          history: pushHistoryEntry(tileEventEntry, pushHistoryEntry(entry, prev.history)),
        };
      });

      addCoins(result.coinsDelta || 0, "board_tile_event");
      addExp(result.expDelta || 0, "board_tile_event");
      if (result.resourceChanges) {
        addResources(result.resourceChanges, "board_tile_event");
      }

      return { tile, result };
    },
    [addCoins, addExp, addResources]
  );

  const moveNpc = useCallback((steps: number) => {
    if (!Number.isFinite(steps) || !steps) return;
    setState((prev) => {
      const tileCount = prev.board.tiles.length;
      if (!tileCount) return prev;
      const from = prev.npc.position;
      const target = from + steps;
      const to = ((target % tileCount) + tileCount) % tileCount;
      const lapsAfter = target >= tileCount ? prev.npc.laps + 1 : prev.npc.laps;
      const entry = buildHistoryEntry("board_move_npc", {
        from,
        to,
        steps,
      });
      return {
        ...prev,
        npc: {
          position: to,
          laps: lapsAfter,
        },
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const completeTaskInstance = useCallback(
    (instanceId: string, options?: { actualMinutes?: number }) => {
      const current = stateRef.current;
      const instance = current.tasks.active.find((item) => item.instanceId === instanceId);
      if (!instance) return { ok: false };
      const template = current.tasks.templates[instance.templateId];
      if (!template) return { ok: false };

      const estimatedMinutes = Math.max(5, template.estimatedMinutes);
      const finishedAt = Date.now();
      const computedMinutes =
        options?.actualMinutes ??
        (instance.startedAt ? Math.round((finishedAt - instance.startedAt) / 60000) : null) ??
        instance.actualMinutes ??
        null;
      const actualMinutes = computedMinutes && computedMinutes > 0 ? computedMinutes : estimatedMinutes;

      const baseReward = computeReward({
        minutes: actualMinutes || estimatedMinutes,
        difficulty: template.difficulty,
        category: template.category,
      });

      const currentDay = current.worldTime.currentDay;
      const existingStreak = normalizeTaskStreakState(current.taskStreaks?.[template.id]);
      const nextCount =
        existingStreak.lastDoneDay === currentDay
          ? existingStreak.count
          : existingStreak.lastDoneDay === currentDay - 1
            ? existingStreak.count + 1
            : 1;
      const nextStreak: TaskStreakState = {
        count: nextCount,
        lastDoneDay: currentDay,
      };
      const streakMultiplier = nextCount >= 3 ? 1.2 : 1;
      const batchMultiplier = instance.bonusMultiplier ?? 1;
      const rewardMultiplier = streakMultiplier * batchMultiplier;
      const suggestionRange: Record<TaskDifficulty, [number, number]> = {
        tiny: [1, 2],
        small: [1, 2],
        medium: [2, 3],
        large: [3, 4],
        huge: [4, 6],
      };
      const [minSuggestion, maxSuggestion] = suggestionRange[template.difficulty];
      const diceValue = rollDice().value;
      const boardSteps = Math.min(maxSuggestion, Math.max(minSuggestion, diceValue));

      const reward = {
        ...baseReward,
        coins: Math.round(baseReward.coins * rewardMultiplier),
        exp: Math.round(baseReward.exp * rewardMultiplier),
      };

      const resourceChanges = reward.resourceDrops.reduce<Record<string, number>>(
        (acc, drop) => {
          acc[drop.id] = (acc[drop.id] || 0) + drop.amount;
          return acc;
        },
        {}
      );

      const tileCount = current.board.tiles.length;
      const resolveMove = (position: number, laps: number, steps: number) => {
        if (!tileCount) {
          return { position, laps };
        }
        const target = position + steps;
        const nextPosition = ((target % tileCount) + tileCount) % tileCount;
        const nextLaps = target >= tileCount ? laps + 1 : laps;
        return { position: nextPosition, laps: nextLaps };
      };
      const nextPlayer = resolveMove(current.player.position, current.player.laps, boardSteps);
      const npcSteps = randomInt(1, 2);
      const nextNpc = resolveMove(current.npc.position, current.npc.laps, npcSteps);

      setState((prev) => {
        const entry = buildHistoryEntry("task_complete", {
          instanceId,
          templateId: template.id,
          coins: reward.coins,
          exp: reward.exp,
          resourceDrops: reward.resourceDrops,
          estimatedMinutes,
          actualMinutes,
          rewardMultiplier,
          streak: nextStreak,
          bonusMultiplier: batchMultiplier,
          diceValue,
          boardSteps,
        });
        const updatedActive = template.repeatable
          ? prev.tasks.active.filter((item) => item.instanceId !== instanceId)
          : prev.tasks.active.map((item) =>
              item.instanceId === instanceId
                ? {
                    ...item,
                    status: "done",
                    finishedAt,
                    actualMinutes,
                  }
                : item
            );
        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            active: updatedActive,
          },
          taskStreaks: {
            ...prev.taskStreaks,
            [template.id]: nextStreak,
          },
          history: pushHistoryEntry(entry, prev.history),
        };
      });

      addCoins(reward.coins, "task_complete");
      addExp(reward.exp, "task_complete");
      addResources(resourceChanges, "task_complete");
      const tileEvent = movePlayer(boardSteps, { lastTask: template });
      moveNpc(npcSteps);

      return {
        ok: true,
        reward,
        diceValue,
        boardSteps,
        playerPosition: nextPlayer.position,
        playerLaps: nextPlayer.laps,
        npcPosition: nextNpc.position,
        npcLaps: nextNpc.laps,
        tileEvent,
      };
    },
    [addCoins, addExp, addResources, moveNpc, movePlayer]
  );

  const advanceWorldDay = useCallback(() => {
    setState((prev) => {
      const nextDay = prev.worldTime.currentDay + 1;
      const entry = buildHistoryEntry("world_advance", {
        fromDay: prev.worldTime.currentDay,
        toDay: nextDay,
      });
      return {
        ...prev,
        worldTime: {
          currentDay: nextDay,
          lastAdvanceAt: Date.now(),
        },
        dailyDrop: generateDailyDrop(nextDay),
        history: pushHistoryEntry(entry, prev.history),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      addCoins,
      addExp,
      addResources,
      consumeResources,
      canCraft,
      craft,
      useItem,
      claimDailyDrop,
      registerTaskTemplates,
      spawnTaskInstance,
      movePlayer,
      moveNpc,
      completeTaskInstance,
      advanceWorldDay,
      pushHistory,
      addParkedIdea,
      deleteParkedIdea,
      markIdeaConverted,
    }),
    [
      state,
      hydrated,
      addCoins,
      addExp,
      addResources,
      consumeResources,
      canCraft,
      craft,
      useItem,
      claimDailyDrop,
      registerTaskTemplates,
      spawnTaskInstance,
      movePlayer,
      moveNpc,
      completeTaskInstance,
      advanceWorldDay,
      pushHistory,
      addParkedIdea,
      deleteParkedIdea,
      markIdeaConverted,
    ]
  );

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within GameStateProvider");
  }
  return context;
}
