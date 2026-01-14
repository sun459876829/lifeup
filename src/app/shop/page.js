"use client";

import { useState } from "react";
import { useMagicWorld } from "../magicWorldContext";

const SHOP_ITEMS = [
  {
    id: "rest30",
    name: "😴 休息 30 分钟券",
    price: 15,
    description: "累了的时候，给自己 30 分钟完全放松的时间",
    emoji: "😴",
  },
  {
    id: "milktea",
    name: "🧋 奶茶券",
    price: 25,
    description: "奖励自己一杯好喝的奶茶，享受甜蜜时光",
    emoji: "🧋",
  },
  {
    id: "movie",
    name: "🎬 看电影券",
    price: 40,
    description: "给自己一个放松的夜晚，看一部想看的电影",
    emoji: "🎬",
  },
];

export default function ShopPage() {
  const { hydrated, wallet, claims, redeem } = useMagicWorld();
  const [message, setMessage] = useState("");

  function handlePurchase(item) {
    const result = redeem(item.name, item.price);
    if (result.success) {
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(""), result.success ? 2000 : 3000);
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载魔法商店…</div>
        </div>
      </div>
    );
  }

  // 筛选出商店购买的道具（type === "shop"）
  const shopItems = claims.filter((claim) => claim.type === "shop");

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🏪 魔法商店
        </h1>
        <p className="text-sm text-slate-400">
          用金币兑换现实中的小奖励，让努力变得更有意义
        </p>
      </header>

      {/* 当前金币显示 */}
      <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">当前金币</div>
          <div className="text-2xl font-bold text-yellow-300">{wallet}🪙</div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      {/* 商店商品 */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100 mb-4">🛒 可购买道具</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHOP_ITEMS.map((item) => {
            const canAfford = wallet >= item.price;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 space-y-3 ${
                  canAfford
                    ? "border-slate-700 bg-slate-950/50 hover:border-violet-400/60 transition"
                    : "border-slate-800 bg-slate-900/30 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
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
                        ? "bg-violet-500 hover:bg-violet-400 text-white active:scale-95"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "购买" : "金币不足"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 我的道具 */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🎁 我的道具</h2>
        {shopItems.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/50">
            <div className="text-slate-500 text-sm mb-1">还没有道具</div>
            <div className="text-xs text-slate-600">在商店购买道具后，会显示在这里</div>
          </div>
        ) : (
          <div className="space-y-2">
            {shopItems
              .slice()
              .reverse()
              .map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <div className="text-sm text-slate-200">{claim.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        购买于 {new Date(claim.ts).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">商店购买</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
