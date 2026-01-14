"use client";

import { useState } from "react";
import { useWorld } from "../worldState";

const SHOP_ITEMS = [
  {
    id: "rest_hour",
    name: "😴 休息券",
    price: 30,
    description: "给自己一个完全放松的休息时段",
    emoji: "😴",
  },
  {
    id: "milktea",
    name: "🧋 奶茶券",
    price: 20,
    description: "奖励自己一杯好喝的奶茶",
    emoji: "🧋",
  },
  {
    id: "nail",
    name: "💅 美甲基金",
    price: 60,
    description: "为下一次精致时刻存下预算",
    emoji: "💅",
  },
  {
    id: "movie",
    name: "🎬 电影券",
    price: 40,
    description: "奖励自己一场放松的电影",
    emoji: "🎬",
  },
];

export default function ShopPage() {
  const { hydrated, currency, spendCoins, addClaim, pushHistory } = useWorld();
  const [message, setMessage] = useState("");

  function handlePurchase(item) {
    if (currency.coins < item.price) {
      setMessage("🪙 金币不足，暂时无法兑换");
      setTimeout(() => setMessage(""), 2500);
      return;
    }
    pushHistory(`商店购买：${item.name}`, { type: "shop_purchase", itemId: item.id });
    const success = spendCoins(item.price);
    if (!success) {
      setMessage("🪙 金币不足，暂时无法兑换");
      setTimeout(() => setMessage(""), 2500);
      return;
    }
    addClaim({ type: "shop", name: item.name });
    setMessage(`✨ 已兑换 ${item.name}`);
    setTimeout(() => setMessage(""), 2000);
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载魔法商店…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🏪 魔法商店
        </h1>
        <p className="text-sm text-slate-400">用金币兑换现实奖励，让每次行动都有回声。</p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">当前金币</div>
          <div className="text-2xl font-bold text-yellow-300">{currency.coins}🪙</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🛒 现实奖励清单</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHOP_ITEMS.map((item) => {
            const canAfford = currency.coins >= item.price;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 space-y-3 ${
                  canAfford
                    ? "border-slate-700 bg-slate-950/50"
                    : "border-slate-800 bg-slate-900/30 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.description}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-lg font-bold text-yellow-300">{item.price}🪙</div>
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      canAfford
                        ? "bg-violet-500 hover:bg-violet-400 text-white"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "兑换" : "金币不足"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
