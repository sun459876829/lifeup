export type BoardTileType =
  | "home"
  | "work"
  | "study"
  | "chest"
  | "event"
  | "build"
  | "food"
  | "rare"
  | "empty";

export type BoardTile = {
  id: string;
  index: number;
  type: BoardTileType;
  name: string;
  description?: string;
};

export const BOARD_TILES: BoardTile[] = [
  {
    id: "home_camp",
    index: 0,
    type: "home",
    name: "营地 · 小窝",
    description: "临时落脚点，整理背包与心情。",
  },
  {
    id: "empty_forest_edge",
    index: 1,
    type: "empty",
    name: "林间小径",
    description: "安静的林道，风吹过树叶。",
  },
  {
    id: "work_sawmill",
    index: 2,
    type: "work",
    name: "锯木工坊",
    description: "木屑飞舞，适合锻炼手艺。",
  },
  {
    id: "study_old_desk",
    index: 3,
    type: "study",
    name: "旧书桌",
    description: "翻开旧书，灵感慢慢聚集。",
  },
  {
    id: "empty_creek",
    index: 4,
    type: "empty",
    name: "浅溪边",
    description: "清水潺潺，适合短暂休息。",
  },
  {
    id: "chest_drift",
    index: 5,
    type: "chest",
    name: "漂流宝箱",
    description: "也许有意外惊喜。",
  },
  {
    id: "food_trail_snack",
    index: 6,
    type: "food",
    name: "路边小炉",
    description: "补充热量的临时摊位。",
  },
  {
    id: "work_night_gate",
    index: 7,
    type: "work",
    name: "夜场之门",
    description: "夜色里也有任务等着你。",
  },
  {
    id: "empty_ruins",
    index: 8,
    type: "empty",
    name: "破旧遗迹",
    description: "碎石堆里透露着古老气息。",
  },
  {
    id: "study_tower",
    index: 9,
    type: "study",
    name: "风语塔",
    description: "记录旅途所学。",
  },
  {
    id: "build_planks",
    index: 10,
    type: "build",
    name: "建造点 · 木板",
    description: "适合修补或搭建小设施。",
  },
  {
    id: "empty_field",
    index: 11,
    type: "empty",
    name: "荒草地",
    description: "风吹草低，远处传来鸟鸣。",
  },
  {
    id: "food_snack",
    index: 12,
    type: "food",
    name: "零食摊",
    description: "短暂补给，甜味驱散疲劳。",
  },
  {
    id: "event_echo",
    index: 13,
    type: "event",
    name: "回声山谷",
    description: "这里的回声像在讲故事。",
  },
  {
    id: "work_outpost",
    index: 14,
    type: "work",
    name: "哨站委托",
    description: "补给、巡逻、修复各类请求。",
  },
  {
    id: "empty_mist",
    index: 15,
    type: "empty",
    name: "薄雾沼泽",
    description: "路有点滑，小心前进。",
  },
  {
    id: "study_campfire",
    index: 16,
    type: "study",
    name: "篝火旁",
    description: "总结一天的冒险。",
  },
  {
    id: "event_stranger",
    index: 17,
    type: "event",
    name: "奇怪的路人",
    description: "他似乎知道一些秘密。",
  },
  {
    id: "build_stone",
    index: 18,
    type: "build",
    name: "建造点 · 石块",
    description: "稳固的材料能提升防护。",
  },
  {
    id: "empty_cave",
    index: 19,
    type: "empty",
    name: "洞口",
    description: "不确定洞内有什么。",
  },
  {
    id: "rare_starlight",
    index: 20,
    type: "rare",
    name: "星光祭坛",
    description: "稀有能量在此汇聚。",
  },
  {
    id: "food_stove",
    index: 21,
    type: "food",
    name: "火塘料理",
    description: "暖胃的一餐。",
  },
  {
    id: "chest_sunken",
    index: 22,
    type: "chest",
    name: "沉睡箱",
    description: "尘封已久的奖励。",
  },
  {
    id: "event_weather",
    index: 23,
    type: "event",
    name: "突变气候",
    description: "天气变化可能带来新的挑战。",
  },
];
