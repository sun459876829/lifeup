export type ResourceConfig = {
  id: string;
  name: string;
  emoji?: string;
};

export const RESOURCES: Record<string, ResourceConfig> = {
  coin: { id: "coin", name: "金币", emoji: "🪙" },
  ticket: { id: "ticket", name: "游戏券", emoji: "🎫" },
  wood: { id: "wood", name: "木头", emoji: "🪵" },
  stone: { id: "stone", name: "石头", emoji: "🪨" },
  fiber: { id: "fiber", name: "纤维", emoji: "🧵" },
  scrap: { id: "scrap", name: "废铁", emoji: "⚙️" },
  insightShard: { id: "insightShard", name: "洞察碎片", emoji: "🔮" },
  energyCrystal: { id: "energyCrystal", name: "能量晶石", emoji: "💠" },
  languageRune: { id: "languageRune", name: "语言符文", emoji: "📘" },
  soulShard: { id: "soulShard", name: "灵魂碎片", emoji: "✨" },
};
