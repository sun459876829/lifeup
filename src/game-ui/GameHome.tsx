"use client";

import Link from "next/link";

const ENTRY_CARDS = [
  {
    title: "魔法时钟",
    description: "追踪世界时间与魔力律动",
    href: "/game/clock",
    icon: "🕰️",
    gradient: "from-indigo-500/40 via-sky-500/40 to-emerald-500/40",
  },
  {
    title: "人生大富翁",
    description: "掷骰踏上命运之环",
    href: "/game/monopoly",
    icon: "🎲",
    gradient: "from-amber-500/40 via-rose-500/40 to-purple-500/40",
  },
  {
    title: "藏宝图探索",
    description: "揭开迷雾与宝藏",
    href: "/game/map",
    icon: "🗺️",
    gradient: "from-emerald-500/40 via-cyan-500/40 to-indigo-500/40",
  },
];

export default function GameHome() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-200 via-sky-200 to-emerald-200 bg-clip-text text-transparent">
          🧙 游戏化入口
        </h1>
        <p className="text-sm text-slate-400">选择你的冒险模块，开启轻 RPG 世界。</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {ENTRY_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-[0_12px_30px_rgba(56,189,248,0.2)]`}
          >
            <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${card.gradient}`} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{card.icon}</div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-300">Enter</span>
              </div>
              <div className="text-lg font-semibold text-white">{card.title}</div>
              <p className="text-xs text-slate-200/80">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
