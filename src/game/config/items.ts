export type ItemCategory = "ticket" | "food" | "buff" | "upgrade";

export type ItemMeta = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: ItemCategory;
};

export const ITEMS: Record<string, ItemMeta> = {
  gameTicket: {
    id: "gameTicket",
    name: "游戏券",
    description: "用于游戏或娱乐奖励的凭证。",
    icon: "🎫",
    category: "ticket",
  },
  snackVoucher10: {
    id: "snackVoucher10",
    name: "小吃券（10元）",
    description: "现实中可兑换 10 元以内的吃喝。",
    icon: "🍢",
    category: "food",
  },
  snackVoucher20: {
    id: "snackVoucher20",
    name: "小吃券（20元）",
    description: "现实中可兑换 20 元以内的吃喝。",
    icon: "🥤",
    category: "food",
  },
  focusBuff30m: {
    id: "focusBuff30m",
    name: "专注药水（30 分钟）",
    description: "使用后进入 30 分钟专注状态。",
    icon: "🧪",
    category: "buff",
  },
};

export const ITEM_IDS = Object.keys(ITEMS);
