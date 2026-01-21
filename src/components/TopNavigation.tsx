"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useWorld } from "@/app/worldState";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", emoji: "🏠" },
  { href: "/tasks", label: "任务", emoji: "📜" },
  { href: "/attributes", label: "属性", emoji: "🧬" },
  { href: "/shop", label: "商店", emoji: "🛒" },
  { href: "/achievements", label: "成就", emoji: "🏆" },
  { href: "/timer", label: "番茄", emoji: "⏳" },
  { href: "/notes", label: "感想", emoji: "📝" },
  { href: "/settings", label: "设置", emoji: "⚙️" },
];

function formatTime(value?: Date) {
  if (!value) return "--:--";
  return value.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function TopNavigation() {
  const { currency, dayIndex, now } = useWorld();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm text-slate-100">
        <div className="flex items-center gap-4">
          <div className="font-semibold tracking-wide">LifeUP · Arcane Dashboard</div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span>🪙 {currency?.coins ?? 0}</span>
            <span>第 {dayIndex ?? 0} 天</span>
            <span>{formatTime(now)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-slate-300 hover:text-emerald-200"
                }`}
              >
                <span>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
