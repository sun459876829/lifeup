"use client";

import React, { useMemo } from "react";
import { formatDateTime } from "./WorldClock";

const MARKERS = Array.from({ length: 12 }, (_, index) => index);

export type MagicWorldClockProps = {
  now: Date;
  gameDay: number;
  level: number;
  exp: number;
  stageLabel?: string;
};

export default function MagicWorldClock({
  now,
  gameDay,
  level,
  exp,
  stageLabel,
}: MagicWorldClockProps) {
  const glow = useMemo(() => {
    if (level >= 10) return "0 0 35px rgba(34,197,94,0.45)";
    if (level >= 5) return "0 0 30px rgba(59,130,246,0.45)";
    return "0 0 25px rgba(124,58,237,0.45)";
  }, [level]);

  const timeLabel = formatDateTime(now);
  const stageText = stageLabel || `第 ${gameDay} 日 · Lv.${level}`;
  const expText = `累计 EXP ${Math.max(0, Math.round(exp))}`;

  return (
    <section className="relative flex items-center justify-center">
      <div
        className="relative h-72 w-72 rounded-full border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        style={{ boxShadow: glow }}
      >
        <div className="absolute inset-4 rounded-full border border-white/10 bg-gradient-to-br from-violet-500/20 via-slate-900/70 to-emerald-500/10" />
        {MARKERS.map((marker) => {
          const angle = (marker / MARKERS.length) * 360;
          return (
            <span
              key={marker}
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-emerald-300/70"
              style={{
                transform: `rotate(${angle}deg) translate(0, -132px)`,
              }}
            />
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">魔法时钟</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">{timeLabel}</div>
          <div className="mt-1 text-sm text-emerald-200">{stageText}</div>
          <div className="mt-2 text-xs text-slate-400">{expText}</div>
        </div>
      </div>
    </section>
  );
}
