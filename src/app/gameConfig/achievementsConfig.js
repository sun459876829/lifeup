export const ACHIEVEMENTS_CONFIG = [
  {
    key: "course_3days",
    name: "点亮第一盏灯",
    description: "连续 3 天完成看课任务",
    target: 3,
    type: "course_streak",
    reward: {
      coins: 30,
      stats: { sanity: 5 },
      claimName: "🕯️ 第一盏灯徽章",
    },
  },
  {
    key: "course_7days",
    name: "荒野学徒",
    description: "连续 7 天完成看课任务",
    target: 7,
    type: "course_streak",
    reward: {
      coins: 60,
      stats: { sanity: 8 },
      claimName: "📜 荒野学徒徽章",
    },
  },
  {
    key: "course_daily_3",
    name: "爆肝研究员",
    description: "单日完成看课任务 ≥ 3 节",
    target: 3,
    type: "course_daily",
    reward: {
      coins: 40,
      stats: { energy: -2, sanity: 6 },
    },
  },
  {
    key: "no_junk_food_3",
    name: "暴食怪克星 Lv1",
    description: "拒绝垃圾食品 3 次",
    target: 3,
    type: "tag_count",
    tag: "no_junk_food",
    reward: {
      coins: 25,
      stats: { health: 6 },
    },
  },
  {
    key: "nightclub_no_shift2_30",
    name: "能量守护者",
    description: "连续 30 天没有二班",
    target: 30,
    type: "no_tag_days",
    tag: "nightclub_shift2",
    reward: {
      coins: 80,
      stats: { energy: 10 },
    },
  },
  {
    key: "room_cleanup_20",
    name: "净化者徽章",
    description: "完成房间垃圾清理 20 次",
    target: 20,
    type: "tag_count",
    tag: "room_cleanup",
    reward: {
      coins: 50,
      stats: { sanity: 8, health: 6 },
      claimName: "🧹 净化者徽章",
    },
  },
];
