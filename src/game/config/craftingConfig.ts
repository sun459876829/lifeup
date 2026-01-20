export type CraftRecipeCategory = "ticket" | "buff" | "food" | "upgrade" | "structure";

export type CraftRecipe = {
  id: string;
  name: string;
  description?: string;
  costs: Record<string, number>;
  coinsCost?: number;
  yields: Record<string, number>;
  category: CraftRecipeCategory;
};

export const CRAFTING_RECIPES: Record<string, CraftRecipe> = {
  game_ticket_basic: {
    id: "game_ticket_basic",
    name: "游戏券（基础）",
    costs: { insightShard: 2, soulShard: 1 },
    coinsCost: 40,
    yields: { gameTicket: 1 },
    category: "ticket",
    description: "用洞察与灵魂碎片制作一张基础游戏券。",
  },
  snack_voucher_10: {
    id: "snack_voucher_10",
    name: "小吃券（10元预算）",
    costs: { wood: 3, fiber: 3 },
    coinsCost: 60,
    yields: { snackVoucher10: 1 },
    category: "food",
    description: "兑换一张 10 元以内的小吃预算券。",
  },
  focus_potion_30m: {
    id: "focus_potion_30m",
    name: "专注药水（30 分钟）",
    costs: { insightShard: 3, energyCrystal: 2 },
    yields: { focusBuff30m: 1 },
    category: "buff",
    description: "临时提升专注力的药水。",
  },
  bed_basic: {
    id: "bed_basic",
    name: "基础小床",
    costs: { wood: 6, fiber: 2, stone: 2 },
    coinsCost: 30,
    yields: { bed_basic: 1 },
    category: "structure",
    description: "用木材与石块搭建的基础小床。",
  },
  desk_study: {
    id: "desk_study",
    name: "学习书桌",
    costs: { wood: 8, stone: 3, insightShard: 1 },
    coinsCost: 50,
    yields: { desk_study: 1 },
    category: "structure",
    description: "书桌与收纳结构，适合学习与记录。",
  },
  lamp_magic: {
    id: "lamp_magic",
    name: "魔法灯",
    costs: { energyCrystal: 2, insightShard: 2, scrap: 2 },
    coinsCost: 80,
    yields: { lamp_magic: 1 },
    category: "structure",
    description: "汲取能量结晶的光，照亮夜晚。",
  },
  wall_photo: {
    id: "wall_photo",
    name: "照片墙",
    costs: { wood: 4, fiber: 4, insightShard: 1 },
    coinsCost: 40,
    yields: { wall_photo: 1 },
    category: "structure",
    description: "把珍贵记忆挂在营地墙上。",
  },
  raft_front: {
    id: "raft_front",
    name: "木筏船头",
    costs: { wood: 10, stone: 4, scrap: 3 },
    coinsCost: 90,
    yields: { raft_front: 1 },
    category: "structure",
    description: "打造木筏结构，准备远航。",
  },
};
