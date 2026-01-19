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
import { RESOURCES } from "@/game/config/resources";
import { TASK_TEMPLATES } from "@/game/config/tasksConfig";
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
    | "undo"
    | string;
  payload: Record<string, unknown>;
  timestamp: number;
};

export type GameState = {
  coins: number;
  exp: number;
  resources: Record<string, number>;
  inventory: Record<string, number>;
  worldTime: {
    currentDay: number;
    lastAdvanceAt: number | null;
  };
  tasks: {
    templates: Record<string, TaskTemplate>;
    active: TaskInstance[];
  };
  history: HistoryEntry[];
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
    worldTime: {
      currentDay: 1,
      lastAdvanceAt: null,
    },
    tasks: {
      templates: { ...TASK_TEMPLATES },
      active: [],
    },
    history: [],
  };
}

function normalizeState(raw: Partial<GameState> | null): GameState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

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

const GameStateContext = createContext<
  (GameState & {
    hydrated: boolean;
    addCoins: (amount: number, reason?: string) => void;
    addExp: (amount: number, reason?: string) => void;
    addResources: (changes: Record<string, number>, reason?: string) => void;
    consumeResources: (changes: Record<string, number>, reason?: string) => boolean;
    registerTaskTemplates: (templates: Record<string, TaskTemplate>) => void;
    spawnTaskInstance: (templateId: string) => TaskInstance | null;
    completeTaskInstance: (
      instanceId: string,
      options?: { actualMinutes?: number }
    ) => { ok: boolean; reward?: ReturnType<typeof computeReward> };
    advanceWorldDay: () => void;
    pushHistory: (entry: HistoryEntry) => void;
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

  const spawnTaskInstance = useCallback((templateId: string) => {
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
      status: "pending",
      startedAt: Date.now(),
      finishedAt: null,
      actualMinutes: null,
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

  const completeTaskInstance = useCallback(
    (instanceId: string, options?: { actualMinutes?: number }) => {
      const current = stateRef.current;
      const instance = current.tasks.active.find((item) => item.instanceId === instanceId);
      if (!instance) return { ok: false };
      const template = current.tasks.templates[instance.templateId];
      if (!template) return { ok: false };

      const estimatedMinutes = Math.max(5, template.estimatedMinutes);
      const actualMinutes = options?.actualMinutes ?? instance.actualMinutes ?? null;

      const reward = computeReward({
        minutes: estimatedMinutes,
        difficulty: template.difficulty,
        category: template.category,
      });

      const resourceChanges = reward.resourceDrops.reduce<Record<string, number>>(
        (acc, drop) => {
          acc[drop.id] = (acc[drop.id] || 0) + drop.amount;
          return acc;
        },
        {}
      );

      setState((prev) => {
        const entry = buildHistoryEntry("task_complete", {
          instanceId,
          templateId: template.id,
          coins: reward.coins,
          exp: reward.exp,
          resourceDrops: reward.resourceDrops,
          estimatedMinutes,
        });
        const updatedActive = template.repeatable
          ? prev.tasks.active.filter((item) => item.instanceId !== instanceId)
          : prev.tasks.active.map((item) =>
              item.instanceId === instanceId
                ? {
                    ...item,
                    status: "done",
                    finishedAt: Date.now(),
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
          history: pushHistoryEntry(entry, prev.history),
        };
      });

      addCoins(reward.coins, "task_complete");
      addExp(reward.exp, "task_complete");
      addResources(resourceChanges, "task_complete");

      return { ok: true, reward };
    },
    [addCoins, addExp, addResources]
  );

  const advanceWorldDay = useCallback(() => {
    setState((prev) => {
      const entry = buildHistoryEntry("world_advance", {
        fromDay: prev.worldTime.currentDay,
        toDay: prev.worldTime.currentDay + 1,
      });
      return {
        ...prev,
        worldTime: {
          currentDay: prev.worldTime.currentDay + 1,
          lastAdvanceAt: Date.now(),
        },
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
      registerTaskTemplates,
      spawnTaskInstance,
      completeTaskInstance,
      advanceWorldDay,
      pushHistory,
    }),
    [
      state,
      hydrated,
      addCoins,
      addExp,
      addResources,
      consumeResources,
      registerTaskTemplates,
      spawnTaskInstance,
      completeTaskInstance,
      advanceWorldDay,
      pushHistory,
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
