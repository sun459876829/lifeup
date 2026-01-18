"use client";

import { useState } from "react";
import { useWorld } from "../worldState";
import { COIN_TO_RMB } from "../../game/config";

const GAME_TICKET_COST = 50;

export default function ShopPage() {
  const { hydrated, currency, tickets, exchangeCoinsForGameTicket, useGameTicket } = useWorld();
  const [message, setMessage] = useState("");

  function handleExchange() {
    const result = exchangeCoinsForGameTicket(GAME_TICKET_COST);
    setMessage(result.message);
    setTimeout(() => setMessage(""), 2500);
  }

  function handleUseTicket() {
    const result = useGameTicket();
    setMessage(result.message);
    setTimeout(() => setMessage(""), 2500);
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
          🏪 魔力兑换所
        </h1>
        <p className="text-sm text-slate-400">把魔力币兑换为游戏券，允许自己安心娱乐。</p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">当前魔力币</div>
            <div className="text-2xl font-bold text-yellow-300">{currency.coins}🪙</div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            1 魔力币 ≈ {COIN_TO_RMB} 元兑换额度
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">当前游戏券</div>
            <div className="text-2xl font-bold text-emerald-300">{tickets.game}🎫</div>
          </div>
          <div className="text-xs text-slate-500 mt-2">游戏券用于标记可安心娱乐的次数</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-5">
        <h2 className="text-sm font-medium text-slate-100">🎮 游戏券兑换</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-200">兑换 1 张游戏券</div>
              <div className="text-xs text-slate-400 mt-1">
                消耗 {GAME_TICKET_COST} 魔力币获得 1 张游戏券
              </div>
            </div>
            <button
              onClick={handleExchange}
              disabled={currency.coins < GAME_TICKET_COST}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
                currency.coins >= GAME_TICKET_COST
                  ? "bg-violet-500 hover:bg-violet-400 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {currency.coins >= GAME_TICKET_COST ? "兑换游戏券" : "魔力币不足"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-200">使用 1 张游戏券</div>
              <div className="text-xs text-slate-400 mt-1">标记一次安心娱乐的时间段</div>
            </div>
            <button
              onClick={handleUseTicket}
              disabled={tickets.game <= 0}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
                tickets.game > 0
                  ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {tickets.game > 0 ? "使用游戏券" : "暂无游戏券"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
