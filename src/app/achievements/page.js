"use client";

import { useMemo } from "react";
import { useWorld } from "../worldState";

export default function AchievementsPage() {
  const { hydrated, achievements } = useWorld();

  const sorted = useMemo(() => {
    return [...achievements].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return (a.name || "").localeCompare(b.name || "", "zh-CN");
    });
  }, [achievements]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载成就卷轴…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🏆 成就与里程碑
        </h1>
        <p className="text-sm text-slate-400">每一步努力都会留下温柔的印记。</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-2xl border p-5 space-y-2 ${
              achievement.unlocked
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-white/5 bg-slate-950/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-200">
                <span className="mr-2">{achievement.icon || "✨"}</span>
                {achievement.name}
              </div>
              {achievement.unlocked && (
                <span className="text-xs text-emerald-300">已解锁</span>
              )}
            </div>
            <div className="text-xs text-slate-400">{achievement.description}</div>
            {!achievement.unlocked && (
              <div className="text-xs text-slate-500">
                进度：{achievement.progress ?? 0}/{achievement.target ?? achievement.condition?.value}
              </div>
            )}
            {achievement.unlockedAt && (
              <div className="text-xs text-slate-500">
                解锁时间：{new Date(achievement.unlockedAt).toLocaleString("zh-CN")}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
