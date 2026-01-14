"use client";

import { useMagicWorld } from "./magicWorldContext";

export default function Page() {
  const { hydrated, player, currency, gems } = useMagicWorld();

  // 计算 XP 进度百分比
  const xpProgress = player.xpToNext > 0
    ? Math.max(0, Math.min(1, player.xp / player.xpToNext))
    : 0;

  // 计算宝石总数
  const totalGems = (gems?.ruby || 0) + (gems?.sapphire || 0) + (gems?.emerald || 0) + (gems?.amethyst || 0);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载魔法世界…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <header className="space-y-2">
        <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
          LifeUP · Arcane World
        </div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          个人魔法世界 · 总览
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          现实里的每个任务会变成这里的：魔力、宝石、等级、故事。
          <br />
          <span className="text-xs text-slate-500">
            详细的任务操作目前在{" "}
            <a href="/tasks" className="text-violet-300 hover:text-violet-200 underline">
              /tasks
            </a>{" "}
            页面
          </span>
        </p>
      </header>

      {/* 总览卡片 */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-6">
        {/* 两列布局：魔力等级 + 魔晶币 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 魔力等级 */}
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4">
            <div className="text-xs text-slate-400 mb-2">魔力等级</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                Lv.{player.level}
              </div>
              <div className="text-lg">⚡</div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>经验值</span>
                <span>
                  {player.xp} / {player.xpToNext}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 transition-all"
                  style={{ width: `${Math.round(xpProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 魔晶币 */}
          <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4">
            <div className="text-xs text-slate-400 mb-2">魔晶币</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-yellow-300">{currency.coins}🪙</div>
              <div className="text-lg">💰</div>
            </div>
            <div className="text-[10px] text-slate-500">
              完成任务即可获得魔晶币奖励
            </div>
          </div>
        </div>

        {/* 宝石总览 */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4">
          <div className="text-xs text-slate-400 mb-2">💎 宝石总览</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-300 mb-1">
                {totalGems} 颗
              </div>
              <div className="text-xs text-slate-500">
                红宝石 {gems?.ruby || 0} · 蓝宝石 {gems?.sapphire || 0} · 绿宝石 {gems?.emerald || 0} · 紫水晶 {gems?.amethyst || 0}
              </div>
            </div>
            <div className="text-3xl">💎</div>
          </div>
        </div>
      </div>

      {/* 快速入口提示 */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div className="text-xs text-slate-400 mb-2">快速入口</div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/tasks"
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            📋 任务管理
          </a>
          <a
            href="/treasure"
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            📜 藏宝图
          </a>
          <a
            href="/shop"
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            🛒 魔法商店
          </a>
          <a
            href="/inventory"
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            🎒 背包
          </a>
          <a
            href="/profile"
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            ⚡ 角色面板
          </a>
        </div>
      </div>
    </div>
  );
}
