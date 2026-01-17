"use client";

import Link from "next/link";
import { useWorld } from "../worldState";

export default function ProfilePage() {
  const { hydrated, stats, world, currency, tickets, achievements, completedTasks } = useWorld();

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载档案…</div>
        </div>
      </main>
    );
  }

  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
              LifeUP · Arcane Wilderness
            </div>
            <h1 className="mt-1 text-2xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
              📖 角色档案
            </h1>
            <p className="mt-1 text-xs text-slate-400">记录你在荒野中的旅程与成长</p>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            ← 返回首页
          </Link>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">📊 生存概览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-900/50">
              <div className="text-2xl mb-1">📆</div>
              <div className="text-xl font-bold text-slate-100">第 {world.day} 天</div>
              <div className="text-[10px] text-slate-500 mt-1">当前阶段 {world.phase}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-2xl mb-1">🪙</div>
              <div className="text-xl font-bold text-amber-300">{currency.coins}</div>
              <div className="text-[10px] text-slate-400 mt-1">魔力币储备</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-2xl mb-1">🎫</div>
              <div className="text-xl font-bold text-emerald-300">{tickets.game}</div>
              <div className="text-[10px] text-slate-400 mt-1">当前游戏券</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xl font-bold text-sky-300">{unlockedCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">已解锁成就</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            历史完成任务：{completedTasks.length} 次
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">💠 四维状态</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-900/50 p-3 text-center">
                <div className="text-xs text-slate-500 uppercase">{key}</div>
                <div className="text-xl font-semibold text-slate-100 mt-1">{value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
