"use client";

import React from "react";

export type DailyOverviewCardsProps = {
  todoCount: number;
  doneCount: number;
  expToday: number;
  coinsToday: number;
  pomodoroCount: number;
  streakDays: number;
};

export default function DailyOverviewCards({
  todoCount,
  doneCount,
  expToday,
  coinsToday,
  pomodoroCount,
  streakDays,
}: DailyOverviewCardsProps) {
  const cards = [
    {
      title: "今日待办",
      value: todoCount,
      suffix: "项",
      hint: "尚未完成的任务",
    },
    {
      title: "已完成",
      value: doneCount,
      suffix: "项",
      hint: "今日完成任务",
    },
    {
      title: "今日收益",
      value: `+${expToday} EXP / +${coinsToday}🪙`,
      suffix: "",
      hint: "来自任务奖励",
    },
    {
      title: "专注与连击",
      value: `${pomodoroCount} 次 / ${streakDays} 天`,
      suffix: "",
      hint: "番茄钟与连续天数",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 shadow-lg"
        >
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {card.title}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-100">
            {card.value} {card.suffix}
          </div>
          <div className="mt-1 text-xs text-slate-400">{card.hint}</div>
        </div>
      ))}
    </section>
  );
}
