export const RANDOM_EVENTS = [
  {
    id: "inspiration_wind",
    name: "灵感之风",
    description: "今天完成看课任务 EXP +20%",
    taskRewardModifier: {
      expMultiplier: 1.2,
      categories: ["course"],
    },
  },
  {
    id: "stacked_anxiety",
    name: "堆积焦虑",
    description: "今天完成整理房间任务 EXP +50",
    taskRewardModifier: {
      expBonus: 50,
      categories: ["life"],
    },
  },
  {
    id: "lucky_star",
    name: "幸运星雨",
    description: "今天任务魔力币 +20%",
    taskRewardModifier: {
      coinMultiplier: 1.2,
    },
  },
  {
    id: "low_pressure",
    name: "心情低气压",
    description: "Sanity -5，但完成任何任务额外 +5 EXP",
    effectOnStats: {
      sanity: -5,
    },
    taskRewardModifier: {
      expBonus: 5,
    },
    specialRules: "完成任何任务额外获得 5 EXP",
  },
  {
    id: "warm_fire",
    name: "篝火温度",
    description: "夜晚能量损耗减轻，今天 Energy +5",
    effectOnStats: {
      energy: 5,
    },
  },
];
