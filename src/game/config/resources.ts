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
  insight: { id: "insight", name: "洞察碎片", emoji: "🔮" },
};
