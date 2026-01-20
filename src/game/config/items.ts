export type ItemConfig = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  icon?: string;
};

export const ITEMS: Record<string, ItemConfig> = {
  energyDrink: {
    id: "energyDrink",
    name: "能量饮料",
    category: "buff",
    description: "补充一点精力与专注。",
    icon: "🥤",
  },
  gameTicket: {
    id: "gameTicket",
    name: "游戏券",
    category: "ticket",
    description: "用来兑换现实中的娱乐时间。",
    icon: "🎟️",
  },
  snackVoucher10: {
    id: "snackVoucher10",
    name: "小吃券 · 10 元",
    category: "food",
    description: "奖励自己一点小零食。",
    icon: "🍪",
  },
  snackVoucher20: {
    id: "snackVoucher20",
    name: "小吃券 · 20 元",
    category: "food",
    description: "奖励自己一份安心小食。",
    icon: "🧁",
  },
  focusBuff30m: {
    id: "focusBuff30m",
    name: "专注增益 · 30 分钟",
    category: "buff",
    description: "记录一次更有力量的专注。",
    icon: "✨",
  },
};
