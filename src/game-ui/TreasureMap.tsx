"use client";

import React, { useMemo, useState } from "react";

type TileReward = {
  type: "coins" | "item" | "chest" | "monster" | "empty";
  label: string;
  icon: string;
};

const GRID_SIZE = 20;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const CHEST_REWARDS = [
  "星光金币 +20",
  "幸运符文",
  "稀有药剂",
  "神秘地图碎片",
  "金币 +50",
];

export function generateTileReward(): TileReward {
  const roll = Math.random();
  if (roll > 0.82) {
    return { type: "chest", label: "发现宝箱", icon: "🎁" };
  }
  if (roll > 0.62) {
    return { type: "monster", label: "遭遇怪物", icon: "👾" };
  }
  if (roll > 0.38) {
    return { type: "coins", label: "捡到金币", icon: "💰" };
  }
  if (roll > 0.2) {
    return { type: "item", label: "拾取道具", icon: "🧪" };
  }
  return { type: "empty", label: "空地", icon: "🪵" };
}

export default function TreasureMap() {
  const [tiles, setTiles] = useState(() =>
    Array.from({ length: TOTAL_TILES }).map(() => ({ explored: false, reward: null as TileReward | null }))
  );
  const [explorePoints, setExplorePoints] = useState(30);
  const [log, setLog] = useState("点击迷雾开始探索。");

  const exploredCount = useMemo(() => tiles.filter((tile) => tile.explored).length, [tiles]);

  function handleExplore(index: number) {
    if (tiles[index].explored) return;
    if (explorePoints <= 0) {
      setLog("探索点不足，请休整后再来。");
      return;
    }

    const reward = generateTileReward();
    setTiles((prev) =>
      prev.map((tile, idx) => (idx === index ? { explored: true, reward } : tile))
    );
    setExplorePoints((prev) => Math.max(0, prev - 1));

    if (reward.type === "chest") {
      const chestReward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];
      setLog(`开启宝箱：${chestReward}`);
    } else {
      setLog(`发现${reward.label}！`);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-emerald-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
          🗺️ 藏宝图探索系统
        </h1>
        <p className="text-sm text-slate-400">探索 20×20 的迷雾区域，揭开宝藏与事件。</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="grid grid-cols-10 md:grid-cols-20 gap-1">
            {tiles.map((tile, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleExplore(index)}
                className={`relative aspect-square rounded-sm border border-slate-800 text-[10px] transition-all ${
                  tile.explored
                    ? "bg-slate-900/80 text-slate-200"
                    : "bg-black/70 text-transparent hover:bg-black/50"
                }`}
              >
                {tile.explored && tile.reward ? (
                  <span className="flex h-full w-full items-center justify-center">
                    {tile.reward.icon}
                  </span>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500">
                    Fog
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
            <div className="text-sm text-slate-400">探索状态</div>
            <div className="text-sm text-slate-100">已探索 {exploredCount} / {TOTAL_TILES}</div>
            <div className="text-sm text-slate-100">探索点：{explorePoints}</div>
            <div className="text-xs text-slate-500">每探索一格消耗 1 点。</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
            <div className="text-sm text-slate-400">事件记录</div>
            <div className="text-sm text-slate-100 min-h-[60px]">{log}</div>
            <div className="text-xs text-slate-500">宝箱奖励会随机落入奖励池。</div>
          </div>
        </div>
      </section>
    </div>
  );
}
