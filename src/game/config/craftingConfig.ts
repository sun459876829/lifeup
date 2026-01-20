import { ITEMS } from "./items";
import { RESOURCES } from "./resources";

export type CraftCost = { resource: string; amount: number };
export type CraftResult = { item: string; amount: number };

export type CraftRecipe = {
  id: string;
  name: string;
  costs: CraftCost[];
  results: CraftResult[];
};

export const CRAFTING_RECIPES: CraftRecipe[] = [
  {
    id: "ticket_bundle_basic",
    name: "基础游戏券礼包",
    costs: [{ resource: RESOURCES.coin.id, amount: 100 }],
    results: [{ item: ITEMS.gameTicket.id, amount: 1 }],
  },
];
