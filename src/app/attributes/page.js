"use client";

import { useMemo } from "react";
import { useWorld } from "../worldState";

function formatExp(value) {
  return `${Math.max(0, Math.round(value))} EXP`;
}

function resolveGrowth(attributeHistory, attributeId) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return attributeHistory
    .filter((entry) => entry.attributeId === attributeId && entry.createdAt >= sevenDaysAgo)
    .reduce((sum, entry) => sum + (entry.exp || 0), 0);
}

export default function AttributesPage() {
  const { hydrated, attributes, attributeHistory } = useWorld();

  const weeklyGrowth = useMemo(() => {
    const map = new Map();
    attributes.forEach((attribute) => {
      map.set(attribute.id, resolveGrowth(attributeHistory, attribute.id));
    });
    return map;
  }, [attributes, attributeHistory]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载属性面板…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🧬 属性与成长
        </h1>
        <p className="text-sm text-slate-400">把成长拆成可视化的能力值，方便追踪节奏。</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attribute) => {
          const progress = Math.min(1, attribute.exp / attribute.expToNext);
          const growth = weeklyGrowth.get(attribute.id) || 0;
          return (
            <div
              key={attribute.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-200">
                  <span className="mr-2">{attribute.icon || "✨"}</span>
                  {attribute.name}
                </div>
                <div className="text-xs text-emerald-300">Lv.{attribute.level}</div>
              </div>
              <div className="text-xs text-slate-500">{attribute.description}</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatExp(attribute.exp)}</span>
                  <span>下一级 {formatExp(attribute.expToNext)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-slate-400">
                近 7 天成长 +{formatExp(growth)}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
