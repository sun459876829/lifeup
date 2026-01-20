"use client";

import Link from "next/link";
import React from "react";

export default function TopNavigation() {
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm mb-4">
      <nav className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3 text-sm text-neutral-100">
        <div className="font-semibold tracking-wide">
          LifeUP · Arcane Survival
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-emerald-300 transition-colors">
            首页
          </Link>
          <Link href="/tasks" className="hover:text-emerald-300 transition-colors">
            任务
          </Link>
          <Link href="/timer" className="hover:text-emerald-300 transition-colors">
            计时
          </Link>
          <Link href="/craft" className="hover:text-emerald-300 transition-colors">
            合成
          </Link>
          <Link
            href="/inventory"
            className="hover:text-emerald-300 transition-colors"
          >
            背包
          </Link>
          <Link
            href="/settings"
            className="hover:text-emerald-300 transition-colors"
          >
            设置
          </Link>
        </div>
      </nav>
    </header>
  );
}
