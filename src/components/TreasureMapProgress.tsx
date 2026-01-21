"use client";

import React from "react";

const DEFAULT_MILESTONES = [
  { level: 1, title: "LV1 起航", detail: "建立第一个习惯" },
  { level: 5, title: "LV5 深林营地", detail: "完成 10 个任务" },
  { level: 10, title: "LV10 星光港", detail: "连续 7 天完成任务" },
  { level: 15, title: "LV15 圣树门", detail: "完成 30 次专注" },
  { level: 20, title: "LV20 宝藏核心", detail: "解锁关键成就" },
];

export type TreasureMapProgressProps = {
  level: number;
};

export default function TreasureMapProgress({ level }: TreasureMapProgressProps) {
  const currentIndex = DEFAULT_MILESTONES.findIndex((item, index) => {
    const next = DEFAULT_MILESTONES[index + 1];
    return level >= item.level && (!next || level < next.level);
  });

  return (
    <section className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 shadow-lg">
      <div className="text-sm font-medium text-slate-100">🧭 藏宝图式成长路径</div>
      <div className="mt-4 space-y-4">
        {DEFAULT_MILESTONES.map((milestone, index) => {
          const isReached = level >= milestone.level;
          const isCurrent = index === (currentIndex === -1 ? 0 : currentIndex);
          return (
            <div key={milestone.title} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    isReached
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-700 bg-slate-900/60 text-slate-400"
                  }`}
                >
                  {isCurrent ? "🏴" : "🎯"}
                </div>
                {index < DEFAULT_MILESTONES.length - 1 && (
                  <div className="h-6 w-px bg-slate-800" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-200">{milestone.title}</div>
                <div className="text-xs text-slate-400">{milestone.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
