"use client";

import Link from "next/link";
import React from "react";
import { useWorld } from "@/app/worldState";

function formatTime(value?: Date) {
  if (!value) return "--:--";
  return value.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function TopNavigation() {
  const { currency, dayIndex, now } = useWorld();
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm mb-4">
      <nav className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm text-neutral-100">
        <div className="flex items-center gap-4">
          <div className="font-semibold tracking-wide">LifeUP · Arcane Survival</div>
          <div className="hidden md:flex items-center gap-3 text-xs text-neutral-400">
            <span>🪙 {currency?.coins ?? 0}</span>
            <span>第 {dayIndex ?? 0} 天</span>
            <span>{formatTime(now)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="hover:text-emerald-300 transition-colors">
            首页
          </Link>
          <Link href="/tasks" className="hover:text-emerald-300 transition-colors">
            任务
          </Link>
          <Link href="/attributes" className="hover:text-emerald-300 transition-colors">
            属性
          </Link>
          <Link href="/shop" className="hover:text-emerald-300 transition-colors">
            商店
          </Link>
          <Link href="/achievements" className="hover:text-emerald-300 transition-colors">
            成就
          </Link>
          <Link href="/timer" className="hover:text-emerald-300 transition-colors">
            计时
          </Link>
          <Link href="/history" className="hover:text-emerald-300 transition-colors">
            历史
          </Link>
          <Link href="/notes" className="hover:text-emerald-300 transition-colors">
            笔记
          </Link>
          <Link href="/board" className="hover:text-emerald-300 transition-colors">
            世界
          </Link>
          <Link href="/settings" className="hover:text-emerald-300 transition-colors">
            设置
          </Link>
        </div>
      </nav>
    </header>
  );
}
