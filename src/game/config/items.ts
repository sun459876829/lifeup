export type ItemConfig = {
  id: string;
  name: string;
  category?: string;
};

export const ITEMS: Record<string, ItemConfig> = {
  energyDrink: {
    id: "energyDrink",
    name: "能量饮料",
    category: "buff",
  },
  gameTicket: {
    id: "gameTicket",
    name: "游戏券",
    category: "ticket",
  },
};
