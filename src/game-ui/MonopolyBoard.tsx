"use client";

import React, { useMemo, useState } from "react";
import { useGameState } from "@/state/GameStateContext";

const TILE_COUNT = 24;

const EVENT_STYLES: Record<string, string> = {
  gain: "from-emerald-500/40 to-emerald-900/20 text-emerald-100",
  loss: "from-rose-500/40 to-rose-900/20 text-rose-100",
  battle: "from-amber-500/40 to-amber-900/20 text-amber-100",
  random: "from-sky-500/40 to-sky-900/20 text-sky-100",
  chest: "from-violet-500/40 to-violet-900/20 text-violet-100",
};

const EVENT_LABELS: Record<string, string> = {
  gain: "祝福",
  loss: "代价",
  battle: "试炼",
  random: "奇遇",
  chest: "宝箱",
};

const EVENT_ICONS: Record<string, string> = {
  gain: "✨",
  loss: "💀",
  battle: "⚔️",
  random: "🌀",
  chest: "🎁",
};

function createTiles() {
  const types = ["gain", "loss", "battle", "random", "chest"] as const;
  return Array.from({ length: TILE_COUNT }).map((_, index) => {
    const type = types[index % types.length];
    return {
      id: index,
      name: `第${index + 1}格`,
      type,
      icon: EVENT_ICONS[type],
    };
  });
}

const CHEST_POOL = [
  "获得神秘徽章",
  "拾取星辉碎片",
  "解锁一次祝福",
  "抽到幸运金币",
  "获得魔法卷轴",
];

export default function MonopolyBoard() {
  const { player, movePlayer, addCoins, monopolyRoll, recordMonopolyRoll } = useGameState();
  const tiles = useMemo(() => createTiles(), []);
  const [dice, setDice] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const canRoll = !monopolyRoll?.rolled;

  function onStop(tile: { type: string; name: string }) {
    let result = "";
    if (tile.type === "gain") {
      const coins = 10 + Math.floor(Math.random() * 20);
      addCoins(coins, "monopoly_gain");
      result = `在${tile.name}获得祝福，金币 +${coins}`;
    } else if (tile.type === "loss") {
      const coins = 5 + Math.floor(Math.random() * 15);
      addCoins(-coins, "monopoly_loss");
      result = `在${tile.name}承受代价，金币 -${coins}`;
    } else if (tile.type === "battle") {
      result = `在${tile.name}触发试炼，战胜心魔获得勇气值 +1`;
    } else if (tile.type === "chest") {
      const reward = CHEST_POOL[Math.floor(Math.random() * CHEST_POOL.length)];
      result = `在${tile.name}开启宝箱：${reward}`;
    } else {
      const luck = Math.random();
      if (luck > 0.6) {
        const coins = 8 + Math.floor(Math.random() * 16);
        addCoins(coins, "monopoly_random");
        result = `在${tile.name}遇到奇遇，金币 +${coins}`;
      } else if (luck > 0.3) {
        result = `在${tile.name}捕捉到稀有事件，下一步更幸运`;
      } else {
        result = `在${tile.name}风平浪静，恢复心情 +1`;
      }
    }
    setMessage(result);
  }

  function handleRoll() {
    if (isRolling || !canRoll) {
      setMessage("今日掷骰次数已用完，明天再来吧！");
      return;
    }
    setIsRolling(true);
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    recordMonopolyRoll(roll);

    const nextPosition = (player.position + roll) % tiles.length;
    movePlayer(roll);
    onStop(tiles[nextPosition]);
    setTimeout(() => setIsRolling(false), 400);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
          🎲 人生大富翁地图
        </h1>
        <p className="text-sm text-slate-400">掷骰探索 24 格命运环，收集奇遇与奖励。</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="grid grid-cols-6 gap-2">
            {tiles.map((tile, index) => {
              const isPlayer = player.position === index;
              return (
                <div
                  key={tile.id}
                  className={`relative rounded-xl border border-slate-800 p-2 text-center text-xs transition-all bg-gradient-to-br ${
                    EVENT_STYLES[tile.type]
                  } ${isPlayer ? "scale-105 ring-2 ring-emerald-300" : ""}`}
                >
                  <div className="text-base">{tile.icon}</div>
                  <div className="text-[11px] text-slate-100">{tile.name}</div>
                  <div className="text-[10px] text-slate-300">{EVENT_LABELS[tile.type]}</div>
                  {isPlayer && (
                    <span className="absolute -top-2 -right-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] text-emerald-950">
                      你在此
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">今日掷骰</div>
                <div className="text-2xl text-slate-100 font-semibold">
                  {dice ? `🎲 ${dice}` : "等待命运"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRoll}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  canRoll
                    ? "bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 text-slate-900 hover:opacity-90"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {canRoll ? "掷骰子" : "明日再来"}
              </button>
            </div>
            <div className="text-xs text-slate-500">
              每日仅可掷骰一次，记录于游戏档案中。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
            <div className="text-sm text-slate-400">最新事件</div>
            <div className="text-sm text-slate-100 min-h-[60px]">
              {message || "还没有触发事件。"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
