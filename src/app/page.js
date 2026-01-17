"use client";

import { useState } from "react";
import { useWorld } from "./worldState";

const PHASE_LABELS = {
  day: "白天",
  dusk: "黄昏",
  night: "夜晚",
};

const STAT_META = [
  { key: "hunger", label: "饱食", emoji: "🍞", color: "from-amber-400 to-orange-400" },
  { key: "sanity", label: "精神", emoji: "🧠", color: "from-violet-400 to-fuchsia-400" },
  { key: "health", label: "生命", emoji: "❤️", color: "from-rose-400 to-red-500" },
  { key: "energy", label: "能量", emoji: "⚡", color: "from-sky-400 to-cyan-400" },
];

export default function Page() {
  const { hydrated, stats, world, currency, advancePhase } = useWorld();
  const [message, setMessage] = useState("");

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载荒野世界…</div>
        </div>
      </div>
    );
  }

  function handleAdvance() {
    advancePhase();
    setMessage("⏳ 世界阶段已推进");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
          LifeUP · Arcane Wilderness
        </div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          人生 · 饥荒魔法版 LifeUP
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          管理饱食、精神、生命与能量，穿行昼夜循环，用任务与事件雕刻你的荒野命运。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
          <h2 className="text-sm font-medium text-slate-100">🌑 荒野状态环</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STAT_META.map((stat) => {
              const value = stats[stat.key];
              return (
                <div key={stat.key} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">
                      {stat.emoji} {stat.label}
                    </div>
                    <div className="text-lg font-semibold text-slate-100">{value}</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stat.color}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">当前第</div>
              <div className="text-2xl font-semibold text-slate-100">{world.day} 天</div>
            </div>
            <div className="text-sm text-slate-300">{PHASE_LABELS[world.phase]}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">今日随机事件</div>
            {world.randomEvent ? (
              <div className="mt-1">
                <div className="text-sm text-slate-200">{world.randomEvent.name}</div>
                <div className="text-xs text-slate-400 mt-1">{world.randomEvent.description}</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-2">还没有事件，推进到新的一天会触发。</div>
            )}
          </div>
          <button
            onClick={handleAdvance}
            className="w-full rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium py-2.5 transition"
          >
            推进到下一阶段
          </button>
          <div className="text-xs text-slate-500">
            推进顺序：白天 → 黄昏 → 夜晚 → 新的一天
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-900/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">当前魔力币</div>
            <div className="text-2xl font-semibold text-amber-300">{currency.coins}🪙</div>
          </div>
          <div className="text-sm text-slate-400">完成任务获得魔力币，再兑换为游戏券</div>
        </div>
      </section>
    </div>
  );
}
