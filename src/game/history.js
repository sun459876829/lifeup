import { STAT_LIMITS } from "./config";

export const HISTORY_STORAGE_KEY = "lifeup.history.v1";
export const HISTORY_LIMIT = 200;

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id
 * @property {"task_complete"|"task_uncomplete"|"reward_spend"|"ticket_use"|"ticket_unuse"|"coins_adjust"|"exp_adjust"} kind
 * @property {number} createdAt
 * @property {Record<string, any>} payload
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
  if (!entry?.kind) return history || [];
  const normalizedEntry = {
    id: entry.id || newId(),
    kind: entry.kind,
    createdAt: entry.createdAt || Date.now(),
    payload: entry.payload || {},
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

function applyTaskCompleteUndo(state, entry) {
  const payload = entry?.payload || {};
  const taskId = payload.taskId;
  if (!taskId) return { ok: false, error: "缺少任务信息" };
  const tasks = state.tasks || [];
  const target = tasks.find((item) => item.id === taskId);
  if (!target) return { ok: false, error: "找不到任务" };

  const updatedTasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    return {
      ...task,
      status: payload.previousStatus ?? task.status,
      completedAt: payload.previousCompletedAt,
      lastCompletedAt: payload.previousLastCompletedAt,
    };
  });

  const statsDelta = payload.statsDelta || {};
  const updatedStats = clampStats({
    ...state.stats,
    hunger: state.stats.hunger - (statsDelta.hunger || 0),
    sanity: state.stats.sanity - (statsDelta.sanity || 0),
    life: state.stats.life - (statsDelta.life || 0),
  });

  const coinsDelta = Number(payload.coinsDelta) || 0;
  const expDelta = Number(payload.expDelta) || 0;
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
      burst: payload.previousBurst || state.burst,
    },
  };
}

function applyTicketUseUndo(state, entry) {
  const payload = entry?.payload || {};
  const ticketId = payload.ticketId;
  if (!ticketId) return { ok: false, error: "缺少券信息" };
  if (ticketId !== "game") return { ok: false, error: "找不到券类型" };

  const previousCount = payload.previousCount;
  const currentCount = state.tickets?.game || 0;
  const nextCount = typeof previousCount === "number" ? previousCount : currentCount + 1;

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

function applyCoinsAdjustUndo(state, entry) {
  const payload = entry?.payload || {};
  const delta = Number(payload.delta) || 0;
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

function applyExpAdjustUndo(state, entry) {
  const payload = entry?.payload || {};
  const delta = Number(payload.delta) || 0;
  const nextExp = Math.max(0, (state.exp || 0) - delta);
  return {
    ok: true,
    state: {
      ...state,
      exp: nextExp,
    },
  };
}

export function undoLastAction({ state, history } = {}) {
  if (!state) return { ok: false, error: "世界尚未加载" };
  const current = Array.isArray(history) ? history : loadHistory();
  const index = [...current].reverse().findIndex((entry) => !entry?.undone);
  if (index < 0) return { ok: false, error: "没有可撤销的记录" };
  const targetIndex = current.length - 1 - index;
  const entry = current[targetIndex];

  let result = { ok: false, error: "无法撤销该记录" };
  switch (entry.kind) {
    case "task_complete":
      result = applyTaskCompleteUndo(state, entry);
      break;
    case "ticket_use":
      result = applyTicketUseUndo(state, entry);
      break;
    case "coins_adjust":
      result = applyCoinsAdjustUndo(state, entry);
      break;
    case "exp_adjust":
      result = applyExpAdjustUndo(state, entry);
      break;
    default:
      result = { ok: false, error: "不支持撤销该操作" };
      break;
  }

  if (!result.ok) return result;

  const nextHistory = current.map((item, itemIndex) =>
    itemIndex === targetIndex
      ? {
          ...item,
          undone: true,
          undoneAt: Date.now(),
        }
      : item
  );
  saveHistory(nextHistory);

  return {
    ok: true,
    state: result.state,
    history: nextHistory,
  };
}
