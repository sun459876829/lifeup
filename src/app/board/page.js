"use client";

import { useMemo } from "react";
import { useWorld } from "../worldState";

export default function BoardPage() {
  const { hydrated, completedTasks } = useWorld();

  const progress = useMemo(() => {
    const total = completedTasks.length;
    const trackSize = 12;
    return {
      total,
      position: total % trackSize,
      trackSize,
    };
  }, [completedTasks]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在绘制人生轨道…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🧭 人生大富翁轨道
        </h1>
        <p className="text-sm text-slate-400">
          每完成一个任务就向前走一步，记录自己在轨道上的进度。
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <div className="text-sm text-slate-200">
          累计完成任务 {progress.total} 次
        </div>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {Array.from({ length: progress.trackSize }).map((_, index) => (
            <div
              key={index}
              className={`h-10 rounded-lg border flex items-center justify-center text-xs ${
                index === progress.position
                  ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                  : "border-slate-800 bg-slate-900/40 text-slate-400"
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          当日目标完成后，记得回来看看轨道前进的感觉。
        </div>
      </section>
    </div>
  );
}
