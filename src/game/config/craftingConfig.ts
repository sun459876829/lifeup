import { ITEMS } from "./items";
import { RESOURCES } from "./resources";

export type CraftRecipe = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  coinsCost?: number;
  costs?: Record<string, number>;
  yields?: Record<string, number>;
};

export const CRAFTING_RECIPES: Record<string, CraftRecipe> = {
  ticket_bundle_basic: {
    id: "ticket_bundle_basic",
    name: "基础游戏券礼包",
    description: "消耗魔晶币兑换 1 张游戏券。",
    category: "ticket",
    coinsCost: 100,
    costs: { [RESOURCES.coin.id]: 100 },
    yields: { [ITEMS.gameTicket.id]: 1 },
  },
};
