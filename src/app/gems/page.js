"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { safeLoadState, safeSaveState, newId, GEM_COLORS } from "@/lib/state";

const GEM_INFO = {
  red: {
    name: "红宝石",
    color: "rose",
    emoji: "🔴",
    description: "热情与行动的象征",
  },
  blue: {
    name: "蓝宝石",
    color: "sky",
    emoji: "🔵",
    description: "智慧与专注的结晶",
  },
  green: {
    name: "绿宝石",
    color: "emerald",
    emoji: "🟢",
    description: "成长与坚持的见证",
  },
  purple: {
    name: "紫宝石",
    color: "purple",
    emoji: "🟣",
    description: "创意与灵感的源泉",
  },
};

export default function GemsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loaded = safeLoadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  function fuseGems(color) {
    if (!state) return;
    const count = state.gems[color] || 0;
    if (count < 3) {
      setMessage(`💎 ${GEM_INFO[color].name}不足（需要 3 颗），当前只有 ${count} 颗。`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const newState = {
      ...state,
      gems: { ...state.gems, [color]: count - 3 },
      relics: [
        {
          id: newId(),
          text: `💠 使用 3 颗 ${GEM_INFO[color].name}进行合成，获得一次「自选奖励」机会（你可以线下给自己一点奖励）`,
          ts: Date.now(),
        },
        ...state.relics,
      ],
    };

    newState.relics = newState.relics.slice(0, 30);
    setState(newState);
    safeSaveState(newState);
    setMessage(`✨ 已消耗 3 颗 ${GEM_INFO[color].name}完成合成仪式！`);
    setTimeout(() => setMessage(""), 3000);
  }

  if (!hydrated || !state) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载宝石工坊…</div>
        </div>
      </main>
    );
  }

  const totalGems = Object.values(state.gems || {}).reduce((sum, count) => sum + count, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
              LifeUP · Arcane Edition
            </div>
            <h1 className="mt-1 text-2xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
              💎 宝石工坊
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              收集 3 颗同色宝石即可进行合成，获得自选奖励机会
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            ← 返回首页
          </Link>
        </header>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-violet-500/20 border border-violet-500/40 text-sm text-violet-100">
            {message}
          </div>
        )}

        {/* 宝石总览 */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">💎 当前宝石库存</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GEM_COLORS.map((color) => {
              const info = GEM_INFO[color];
              const count = state.gems[color] || 0;
              const colorClasses = {
                red: "border-rose-400/60 bg-rose-500/10 text-rose-200",
                blue: "border-sky-400/60 bg-sky-500/10 text-sky-200",
                green: "border-emerald-400/60 bg-emerald-500/10 text-emerald-200",
                purple: "border-purple-400/60 bg-purple-500/10 text-purple-200",
              };
              return (
                <div
                  key={color}
                  className={`rounded-xl border p-4 ${
                    count >= 3
                      ? colorClasses[color]
                      : "border-slate-700 bg-slate-900/50"
                  }`}
                >
                  <div className="text-3xl mb-2">{info.emoji}</div>
                  <div className={`text-sm font-medium mb-1 ${count >= 3 ? colorClasses[color].split(' ')[2] : 'text-slate-300'}`}>
                    {info.name}
                  </div>
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-[10px] text-slate-400">{info.description}</div>
                  {count >= 3 && (
                    <div className="mt-2 text-[10px] text-emerald-300">✓ 可合成</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            总计：{totalGems} 颗宝石
          </div>
        </section>

        {/* 合成区域 */}
        <section className="mb-6 rounded-2xl border border-violet-500/40 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-violet-100 mb-4">✨ 宝石合成</h2>
          <p className="text-xs text-slate-400 mb-4">
            使用 3 颗同色宝石进行合成，你将获得一次「自选奖励」机会。可以给自己买个小礼物、看一部电影、或者做任何你想做的事情！
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GEM_COLORS.map((color) => {
              const info = GEM_INFO[color];
              const count = state.gems[color] || 0;
              const canFuse = count >= 3;
              const buttonClasses = {
                red: canFuse ? "border-rose-400/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200" : "border-slate-700 bg-slate-900/30 opacity-50",
                blue: canFuse ? "border-sky-400/60 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200" : "border-slate-700 bg-slate-900/30 opacity-50",
                green: canFuse ? "border-emerald-400/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200" : "border-slate-700 bg-slate-900/30 opacity-50",
                purple: canFuse ? "border-purple-400/60 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200" : "border-slate-700 bg-slate-900/30 opacity-50",
              };

              return (
                <button
                  key={color}
                  onClick={() => fuseGems(color)}
                  disabled={!canFuse}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    canFuse
                      ? `${buttonClasses[color]} hover:scale-[1.02] cursor-pointer`
                      : "cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{info.emoji}</span>
                      <span className="text-sm font-medium">{info.name}</span>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      canFuse
                        ? `bg-${info.color}-500/20 text-${info.color}-200`
                        : "bg-slate-800 text-slate-500"
                    }`}>
                      {count}/3
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {canFuse ? "点击合成" : `还需 ${3 - count} 颗`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    合成后获得：自选奖励机会 × 1
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 获得方式 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-3">📖 如何获得宝石</h2>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>完成项目任务，推进藏宝图进度</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>当项目进度达到 3、6、10 步时，会随机掉落一颗宝石</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>宝石颜色随机，可能是红、蓝、绿、紫中的任意一种</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <Link href="/treasure" className="text-violet-300 hover:text-violet-200 underline">
                  查看藏宝图进度
                </Link>
                {" "}来追踪你的宝石收集进度
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
