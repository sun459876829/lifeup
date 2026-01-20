"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/components/WorldClock";

export function formatGameTime(value: Date | number | string): string {
  return formatDateTime(value);
}

const TICK_COUNT = 12;

export default function MagicClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }).map((_, index) => ({
        id: index,
        rotate: (360 / TICK_COUNT) * index,
      })),
    []
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="relative flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 bg-clip-text text-transparent">
            🕰️ 魔法时钟
          </h1>
          <p className="text-sm text-slate-400">从世界时间萃取的奥术节拍。</p>
        </div>

        <div className="relative w-72 h-72">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_55%)] blur-2xl animate-pulse" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700 shadow-[0_0_40px_rgba(99,102,241,0.25)]" />
          <div className="absolute inset-6 rounded-full bg-[conic-gradient(from_90deg,_rgba(79,70,229,0.35),_rgba(56,189,248,0.35),_rgba(16,185,129,0.35),_rgba(79,70,229,0.35))] opacity-70" />

          <div
            className="absolute inset-0 rounded-full"
            style={{ animation: "spin 20s linear infinite" }}
          />

          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "spin 18s linear infinite" }}
          >
            {ticks.map((tick) => (
              <span
                key={tick.id}
                className="absolute top-2 left-1/2 h-4 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-200 to-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                style={{ transform: `translateX(-50%) rotate(${tick.rotate}deg)` }}
              />
            ))}
          </div>

          <div className="absolute inset-10 rounded-full border border-indigo-400/30 shadow-[0_0_20px_rgba(129,140,248,0.4)] animate-pulse" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-slate-950/80 px-6 py-3 text-center shadow-[0_0_16px_rgba(14,165,233,0.35)]">
              <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
                World Time
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {formatGameTime(now)}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">魔力波纹随时间缓慢旋转，记录每日节奏。</p>
      </div>
    </div>
  );
}
