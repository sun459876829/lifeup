export type ItemCategory = "ticket" | "food" | "buff" | "upgrade" | "structure";

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
  bed_basic: {
    id: "bed_basic",
    name: "基础小床",
    description: "简单舒适的小床，让营地更像家。",
    icon: "🛏️",
    category: "structure",
  },
  desk_study: {
    id: "desk_study",
    name: "学习书桌",
    description: "放置书桌，专注氛围更浓。",
    icon: "📚",
    category: "structure",
  },
  lamp_magic: {
    id: "lamp_magic",
    name: "魔法灯",
    description: "夜色里发光的魔法灯。",
    icon: "🪄",
    category: "structure",
  },
  wall_photo: {
    id: "wall_photo",
    name: "照片墙",
    description: "把记忆挂上墙，营地更温暖。",
    icon: "🖼️",
    category: "structure",
  },
  raft_front: {
    id: "raft_front",
    name: "木筏船头",
    description: "建造木筏的前端结构。",
    icon: "🛶",
    category: "structure",
  },
};

export const ITEM_IDS = Object.keys(ITEMS);
