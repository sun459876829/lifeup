"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

const DEFAULT_CELLS = [
  { title: "训练", detail: "强化体力与意志", emoji: "💪", href: "/tasks" },
  { title: "学习", detail: "补充知识与技能", emoji: "📘", href: "/tasks" },
  { title: "健身", detail: "身体状态维护", emoji: "🏃" },
  { title: "社交", detail: "拓展关系与信任", emoji: "🤝" },
  { title: "财务", detail: "规划金币与资源", emoji: "💰", href: "/shop" },
  { title: "休息", detail: "恢复能量与心情", emoji: "🛌" },
  { title: "探索", detail: "解锁新事件", emoji: "🗺️", href: "/treasure" },
  { title: "秩序", detail: "整理与清理", emoji: "🧹" },
  { title: "创作", detail: "输出内容与作品", emoji: "🎨" },
  { title: "协作", detail: "团队任务与支援", emoji: "🧭" },
  { title: "挑战", detail: "推进高难任务", emoji: "⚔️" },
  { title: "日常", detail: "推进日常节奏", emoji: "📅" },
  { title: "激励", detail: "兑换奖励", emoji: "🎁", href: "/shop" },
  { title: "灵感", detail: "记录闪光想法", emoji: "💡", href: "/notes" },
  { title: "专注", detail: "番茄钟引导", emoji: "⏳", href: "/timer" },
  { title: "成就", detail: "查看勋章进度", emoji: "🏆", href: "/achievements" },
];

export type MonopolyBoardProps = {
  position: number;
};

export default function MonopolyBoard({ position }: MonopolyBoardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cells = useMemo(() => DEFAULT_CELLS, []);
  const resolvedIndex = ((position ?? 0) % cells.length + cells.length) % cells.length;
  const focusedIndex = activeIndex ?? resolvedIndex;
  const focusedCell = cells[focusedIndex];

  return (
    <section className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-slate-100">🎲 人生棋盘</div>
          <div className="text-xs text-slate-400">当前位置：{focusedCell?.title}</div>
        </div>
        {focusedCell?.href && (
          <Link
            href={focusedCell.href}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            前往相关模块 →
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {cells.map((cell, index) => {
          const isActive = index === resolvedIndex;
          return (
            <button
              key={cell.title}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(index)}
              className={`rounded-xl border px-2 py-3 text-left text-xs transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-emerald-500/10 ${
                isActive
                  ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                  : "border-slate-800 bg-slate-900/40 text-slate-300"
              }`}
            >
              <div className="text-base">{cell.emoji}</div>
              <div className="mt-1 font-medium">{cell.title}</div>
            </button>
          );
        })}
      </div>

      {focusedCell && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
          <div className="font-medium text-slate-200">{focusedCell.title} · 指引</div>
          <div className="mt-1 text-slate-400">{focusedCell.detail}</div>
        </div>
      )}
    </section>
  );
}
