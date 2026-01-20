import type { BoardTile } from "@/game/config/boardConfig";

export type TileEventResult = {
  description: string;
  coinsDelta?: number;
  expDelta?: number;
  resourceChanges?: Record<string, number>;
  inventoryChanges?: Record<string, number>;
  rare?: boolean;
  extraEffects?: any;
};

type TaskSnapshot = {
  id?: string;
  title?: string;
  category?: string;
};

type TileEventContext = {
  gameState: {
    history?: Array<{ type?: string; timestamp?: number; payload?: Record<string, unknown> }>;
    tasks?: {
      templates?: Record<string, TaskSnapshot>;
    };
  };
  lastTask?: TaskSnapshot | null;
};

const RESOURCE_POOL = ["wood", "stone", "insightShard"];
const LIGHT_EVENT_RESOURCES = ["wood", "fiber", "insightShard"];
const BUILD_RESOURCES = ["wood", "stone", "fiber"];
const RARE_RESOURCE_POOL = ["soulShard", "languageRune"];
const RARE_ITEM_POOL = ["gameTicket", "snackVoucher20", "focusBuff30m"];
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(list: T[]) {
  return list[randomInt(0, list.length - 1)];
}

function isNightTask(task?: TaskSnapshot | null) {
  if (!task) return false;
  const title = task.title || "";
  const id = task.id || "";
  return task.category === "work" && (title.includes("夜场") || id.includes("night"));
}

function hasRecentNightTask(context: TileEventContext) {
  if (isNightTask(context.lastTask)) return true;
  const history = Array.isArray(context.gameState?.history) ? context.gameState.history : [];
  const templates = context.gameState?.tasks?.templates || {};
  const since = Date.now() - RECENT_WINDOW_MS;
  return history.some((entry) => {
    if (entry?.type !== "task_complete") return false;
    const timestamp = Number(entry.timestamp) || 0;
    if (timestamp < since) return false;
    const templateId = entry?.payload?.templateId;
    if (!templateId || typeof templateId !== "string") return false;
    return isNightTask(templates[templateId]);
  });
}

export function resolveTileEvent(tile: BoardTile, context: TileEventContext): TileEventResult {
  switch (tile.type) {
    case "home":
      return {
        description: "回到营地 · 小窝，稍微休息了一下，感觉好一点了。",
        coinsDelta: randomInt(8, 14),
        expDelta: 10,
      };
    case "study": {
      const baseExp = randomInt(20, 40);
      const bonus = context.lastTask?.category === "learning" ? randomInt(6, 12) : 0;
      return {
        description: bonus
          ? "你翻了一本旧书，夹着的学习笔记又点亮了一小段灵感。"
          : "你翻了一本旧书，纸页摩挲带来新的思路。",
        expDelta: baseExp + bonus,
      };
    }
    case "chest": {
      const resourceCount = randomInt(1, 3);
      const resourceChanges = Array.from({ length: resourceCount }).reduce<Record<string, number>>(
        (acc) => {
          const resourceId = pickOne(RESOURCE_POOL);
          acc[resourceId] = (acc[resourceId] || 0) + randomInt(1, 3);
          return acc;
        },
        {}
      );
      const hasItem = Math.random() < 0.08;
      const itemId = hasItem ? pickOne(["gameTicket", "snackVoucher10"]) : null;
      return {
        description: "你打开了一个老旧的箱子，里头叮当作响。",
        coinsDelta: randomInt(30, 100),
        resourceChanges,
        inventoryChanges: itemId ? { [itemId]: 1 } : undefined,
        rare: Math.random() < 0.1,
      };
    }
    case "food":
      return {
        description: "你给自己买了一点好吃的，暖意立刻充满了胃和心。",
        coinsDelta: randomInt(10, 30),
        resourceChanges: { energyCrystal: randomInt(1, 2) },
      };
    case "work": {
      const bonusActive = hasRecentNightTask(context);
      const bonusCoins = bonusActive ? randomInt(20, 40) : 0;
      const bonusExp = bonusActive ? randomInt(8, 16) : 0;
      return {
        description: bonusActive
          ? "你路过熟悉的夜场门口，听到点名声，顺手接了个小奖励。"
          : "你路过熟悉的夜场门口，想着接下来要安排的活儿。",
        coinsDelta: randomInt(20, 40) + bonusCoins,
        expDelta: randomInt(12, 24) + bonusExp,
      };
    }
    case "build": {
      const resourceId = pickOne(BUILD_RESOURCES);
      return {
        description: `你顺手整理了建材，记得去 /craft 或 /inventory 看看能造些什么。`,
        resourceChanges: { [resourceId]: randomInt(1, 2) },
      };
    }
    case "event": {
      const resourceId = pickOne(LIGHT_EVENT_RESOURCES);
      return {
        description: "一个奇怪的路人给了你一张纸条，似乎还塞了点小礼物。",
        expDelta: randomInt(6, 14),
        resourceChanges: { [resourceId]: 1 },
      };
    }
    case "rare": {
      const rewardRoll = Math.random();
      const resourceId = rewardRoll < 0.6 ? pickOne(RARE_RESOURCE_POOL) : null;
      const itemId = rewardRoll >= 0.6 ? pickOne(RARE_ITEM_POOL) : null;
      return {
        description: "星光在脚下凝成碎片，你像被祝福般收获了稀有赠礼。",
        coinsDelta: randomInt(200, 500),
        resourceChanges: resourceId ? { [resourceId]: 1 } : undefined,
        inventoryChanges: itemId ? { [itemId]: 1 } : undefined,
        rare: true,
      };
    }
    case "empty":
    default:
      return {
        description: "路过一段安静的小径，风吹过树叶，只留下轻微的沙沙声。",
      };
  }
}
