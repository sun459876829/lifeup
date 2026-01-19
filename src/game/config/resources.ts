export type ResourceRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ResourceMeta = {
  id: string;
  name: string;
  rarity: ResourceRarity;
  description?: string;
};

export const RESOURCES: Record<string, ResourceMeta> = {
  wood: { id: "wood", name: "木头", rarity: "common" },
  stone: { id: "stone", name: "石头", rarity: "common" },
  fiber: { id: "fiber", name: "纤维", rarity: "common" },
  scrap: { id: "scrap", name: "废料", rarity: "uncommon" },
  insightShard: { id: "insightShard", name: "洞察碎片", rarity: "rare" },
  energyCrystal: { id: "energyCrystal", name: "能量结晶", rarity: "rare" },
  languageRune: { id: "languageRune", name: "语言符文", rarity: "rare" },
  soulShard: { id: "soulShard", name: "灵魂碎片", rarity: "epic" },
};

export const RESOURCE_IDS = Object.keys(RESOURCES);
