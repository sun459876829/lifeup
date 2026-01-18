"use client";

import { useWorld } from "@/app/worldState";

function formatDateTime(value) {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export default function WorldClock() {
  const { now, dayIndex } = useWorld();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30">
      <div className="text-xs text-slate-500 tracking-[0.2em] uppercase">世界时钟</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{formatDateTime(now)}</div>
      <div className="mt-2 text-sm text-slate-400">第 {dayIndex} 天 · 魔法荒野</div>
    </div>
  );
}

export { formatDateTime };
