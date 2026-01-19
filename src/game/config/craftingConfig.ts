export type CraftRecipeCategory = "ticket" | "buff" | "food" | "upgrade";

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
};
