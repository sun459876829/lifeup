import { STAT_LIMITS } from "./config";

export const HISTORY_STORAGE_KEY = "lifeup.history.v1";
export const HISTORY_LIMIT = 200;

/**
 * @typedef {Object} HistoryUndo
 * @property {string} type
 * @property {Record<string, any>} payload
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id
 * @property {string} type
 * @property {number} timestamp
 * @property {Record<string, any>} payload
 * @property {HistoryUndo | null} [undo]
 * @property {boolean} [undoable]
 * @property {boolean} [undone]
 * @property {number} [undoneAt]
 */

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

export function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load history", error);
    return [];
  }
}

export function saveHistory(history) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history", error);
  }
}

export function pushHistory(entry, history) {
  const entryType = entry?.type || entry?.kind;
  if (!entryType) return history || [];
  const undo = entry?.undo ?? null;
  const undoable = typeof entry?.undoable === "boolean" ? entry.undoable : Boolean(undo);
  const normalizedEntry = {
    id: entry.id || newId(),
    type: entryType,
    timestamp: entry.timestamp || entry.createdAt || Date.now(),
    payload: entry.payload || {},
    undo,
    undoable,
    undone: entry.undone || false,
    undoneAt: entry.undoneAt,
  };
  const current = Array.isArray(history) ? history : loadHistory();
  const next = [...current, normalizedEntry].slice(-HISTORY_LIMIT);
  saveHistory(next);
  return next;
}

function removeCompletedEntry(list, taskId, completedAt) {
  if (!Array.isArray(list)) return [];
  const index = list.findIndex(
    (entry) => entry.taskId === taskId && (completedAt ? entry.completedAt === completedAt : true)
  );
  if (index < 0) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

function applyTaskCompleteUndo(state, payload) {
  const taskId = payload?.taskId;
  if (!taskId) return { ok: false, error: "缺少任务信息" };
  const tasks = state.tasks || [];
  const target = tasks.find((item) => item.id === taskId);
  if (!target) return { ok: false, error: "找不到任务" };

  const updatedTasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    return {
      ...task,
      status: payload.prevStatus ?? payload.previousStatus ?? task.status,
      completedAt: payload.prevCompletedAt ?? payload.previousCompletedAt,
      lastCompletedAt: payload.prevLastCompletedAt ?? payload.previousLastCompletedAt,
    };
  });

  const statsDelta = payload?.statsDelta || {};
  const updatedStats = clampStats({
    ...state.stats,
    hunger: state.stats.hunger - (statsDelta.hunger || 0),
    sanity: state.stats.sanity - (statsDelta.sanity || 0),
    life: state.stats.life - (statsDelta.life || 0),
  });

  const coinsDelta = Number(payload?.coinsDelta) || 0;
  const expDelta = Number(payload?.expDelta) || 0;
  const nextCoins = Math.max(0, (state.currency?.coins || 0) - coinsDelta);
  const nextExp = Math.max(0, (state.exp || 0) - expDelta);

  const updatedCompletedTasks = removeCompletedEntry(
    state.completedTasks || [],
    taskId,
    payload.completedAt
  );

  return {
    ok: true,
    state: {
      ...state,
      tasks: updatedTasks,
      stats: updatedStats,
      currency: {
        ...state.currency,
        coins: nextCoins,
      },
      exp: nextExp,
      completedTasks: updatedCompletedTasks,
      burst: payload.previousBurst || payload.prevBurst || state.burst,
    },
  };
}

function applyTicketUseUndo(state, payload) {
  const ticketId = payload?.ticketId;
  if (!ticketId) return { ok: false, error: "缺少券信息" };
  if (ticketId !== "game") return { ok: false, error: "找不到券类型" };

  const previousCount = payload?.previousCount;
  const currentCount = state.tickets?.game || 0;
  const delta = Number(payload?.delta);
  const nextCount =
    typeof previousCount === "number" ? previousCount : currentCount - (Number.isNaN(delta) ? -1 : delta);

  return {
    ok: true,
    state: {
      ...state,
      tickets: {
        ...state.tickets,
        game: Math.max(0, nextCount),
      },
    },
  };
}

function applyCoinsChangeUndo(state, payload) {
  const delta = Number(payload?.delta) || 0;
  const nextCoins = Math.max(0, (state.currency?.coins || 0) - delta);
  return {
    ok: true,
    state: {
      ...state,
      currency: {
        ...state.currency,
        coins: nextCoins,
      },
    },
  };
}

function applyExpChangeUndo(state, payload) {
  const delta = Number(payload?.delta) || 0;
  const nextExp = Math.max(0, (state.exp || 0) - delta);
  return {
    ok: true,
    state: {
      ...state,
      exp: nextExp,
    },
  };
}

function resolveEntryType(entry) {
  return entry?.type || entry?.kind;
}

function resolveEntryTimestamp(entry) {
  return entry?.timestamp || entry?.createdAt;
}

function isUndoable(entry) {
  if (!entry || entry.undone) return false;
  const undoable = typeof entry.undoable === "boolean" ? entry.undoable : Boolean(entry.undo);
  return Boolean(undoable && entry.undo);
}

function applyUndoByType(state, undo) {
  if (!undo) return { ok: false, error: "无法撤销该记录" };
  switch (undo.type) {
    case "revert_task_complete":
      return applyTaskCompleteUndo(state, undo.payload || {});
    case "revert_ticket_use":
      return applyTicketUseUndo(state, undo.payload || {});
    case "reverse_coins_change":
      return applyCoinsChangeUndo(state, undo.payload || {});
    case "reverse_exp_change":
      return applyExpChangeUndo(state, undo.payload || {});
    default:
      return { ok: false, error: "不支持撤销该操作" };
  }
}

export function undoHistoryItem({ state, history, id } = {}) {
  if (!state) return { ok: false, error: "世界尚未加载" };
  if (!id) return { ok: false, error: "缺少记录信息" };
  const current = Array.isArray(history) ? history : loadHistory();
  const targetIndex = current.findIndex((entry) => entry?.id === id);
  if (targetIndex < 0) return { ok: false, error: "找不到历史记录" };
  const entry = current[targetIndex];
  if (!isUndoable(entry)) return { ok: false, error: "该记录无法撤销" };

  const result = applyUndoByType(state, entry.undo);
  if (!result.ok) return result;

  const undoneAt = Date.now();
  const markedHistory = current.map((item, itemIndex) =>
    itemIndex === targetIndex
      ? {
          ...item,
          undone: true,
          undoneAt,
        }
      : item
  );

  const undoEntry = {
    type: "history_undo",
    payload: {
      targetId: entry.id,
      targetType: resolveEntryType(entry),
      targetTitle: entry.payload?.taskTitle || entry.payload?.ticketName || entry.payload?.title,
      targetTimestamp: resolveEntryTimestamp(entry),
    },
    undo: null,
    undoable: false,
  };

  const nextHistory = pushHistory(undoEntry, markedHistory);

  return {
    ok: true,
    state: result.state,
    history: nextHistory,
  };
}

export function undoLastAction({ state, history } = {}) {
  if (!state) return { ok: false, error: "世界尚未加载" };
  const current = Array.isArray(history) ? history : loadHistory();
  const index = [...current].reverse().findIndex((entry) => isUndoable(entry));
  if (index < 0) return { ok: false, error: "没有可撤销的记录" };
  const targetIndex = current.length - 1 - index;
  const entry = current[targetIndex];
  return undoHistoryItem({ state, history: current, id: entry.id });
}
