"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { safeLoadState, PROJECTS, GEM_COLORS } from "@/lib/state";

export default function ProfilePage() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(null);

  useEffect(() => {
    const loaded = safeLoadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    if (!state) return null;

    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((t) => t.status === "done").length;
    const totalCoinsEarned = state.tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.reward || 0) * (t.timesDone || 1), 0);
    const totalGems = Object.values(state.gems || {}).reduce((sum, count) => sum + count, 0);
    const totalProgress = PROJECTS.reduce(
      (sum, p) => sum + (state.projectProgress[p.id]?.steps || 0),
      0
    );
    const completedProjects = PROJECTS.filter(
      (p) => (state.projectProgress[p.id]?.steps || 0) >= 10
    ).length;

    return {
      totalTasks,
      completedTasks,
      totalCoinsEarned,
      totalGems,
      totalProgress,
      completedProjects,
    };
  }, [state]);

  if (!hydrated || !state || !stats) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载角色面板…</div>
        </div>
      </main>
    );
  }

  const levelProgress = state.xpForNext
    ? Math.max(0, Math.min(1, state.xp / state.xpForNext))
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
              LifeUP · Arcane Edition
            </div>
            <h1 className="mt-1 text-2xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
              ⚡ 角色面板
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              查看你在魔法世界中的成长历程与成就
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
          >
            ← 返回首页
          </Link>
        </header>

        {/* 等级信息 */}
        <section className="mb-6 rounded-2xl border border-violet-500/40 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">等级信息</h2>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Lv.{state.level}
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>魔力经验</span>
              <span>
                {state.xp} / {state.xpForNext}
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-400 via-sky-400 to-emerald-400 transition-all"
                style={{ width: `${Math.round(levelProgress * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-slate-400">
            距离下一级还需 {state.xpForNext - state.xp} 点经验
          </div>
        </section>

        {/* 资源统计 */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">💰 资源统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="text-2xl mb-1">🪙</div>
              <div className="text-xl font-bold text-yellow-300">{state.coins}</div>
              <div className="text-[10px] text-slate-400 mt-1">当前魔晶币</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-xl font-bold text-violet-300">{stats.totalGems}</div>
              <div className="text-[10px] text-slate-400 mt-1">总宝石数</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-2xl mb-1">📜</div>
              <div className="text-xl font-bold text-emerald-300">{stats.totalProgress}</div>
              <div className="text-[10px] text-slate-400 mt-1">藏宝图总步数</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <div className="text-2xl mb-1">✨</div>
              <div className="text-xl font-bold text-sky-300">{stats.totalCoinsEarned}</div>
              <div className="text-[10px] text-slate-400 mt-1">累计获得魔晶币</div>
            </div>
          </div>
        </section>

        {/* 任务统计 */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">📋 任务统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/50">
              <div className="text-2xl font-bold text-slate-100">{stats.totalTasks}</div>
              <div className="text-xs text-slate-400 mt-1">总任务数</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50">
              <div className="text-2xl font-bold text-emerald-300">{stats.completedTasks}</div>
              <div className="text-xs text-slate-400 mt-1">已完成任务</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50">
              <div className="text-2xl font-bold text-violet-300">
                {stats.totalTasks > 0
                  ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                  : 0}
                %
              </div>
              <div className="text-xs text-slate-400 mt-1">完成率</div>
            </div>
          </div>
        </section>

        {/* 项目进度概览 */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">🗺️ 项目进度概览</h2>
          <div className="space-y-3">
            {PROJECTS.map((project) => {
              const progress = state.projectProgress[project.id]?.steps || 0;
              const percentage = (progress / 10) * 100;
              return (
                <div key={project.id} className="p-3 rounded-lg bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-200">{project.name}</span>
                    <span className="text-xs text-slate-400">{progress}/10</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">
            已完成 {stats.completedProjects} / {PROJECTS.length} 个项目
          </div>
        </section>

        {/* 宝石收集 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-medium text-slate-100 mb-4">💎 宝石收集</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GEM_COLORS.map((color) => {
              const count = state.gems[color] || 0;
              const colorNames = {
                red: "红宝石",
                blue: "蓝宝石",
                green: "绿宝石",
                purple: "紫宝石",
              };
              const colorEmojis = {
                red: "🔴",
                blue: "🔵",
                green: "🟢",
                purple: "🟣",
              };
              return (
                <div
                  key={color}
                  className="p-3 rounded-lg bg-slate-900/50 text-center"
                >
                  <div className="text-2xl mb-1">{colorEmojis[color]}</div>
                  <div className="text-lg font-bold text-slate-100">{count}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{colorNames[color]}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
