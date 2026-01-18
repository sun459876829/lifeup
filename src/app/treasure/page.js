"use client";

import { useRef, useState } from "react";
import { useWorld } from "../worldState";

const TIER_STYLES = {
  B: "border-slate-600 text-slate-300",
  A: "border-violet-500 text-violet-300",
  S: "border-amber-500 text-amber-300",
};

function renderReward(reward) {
  const parts = [];
  if (reward.coins) parts.push(`🪙 ${reward.coins}`);
  if (reward.sanity) parts.push(`🧠 +${reward.sanity}`);
  if (reward.life || reward.health) parts.push(`❤️ +${reward.life || reward.health}`);
  if (reward.claimName) parts.push(`🎁 ${reward.claimName}`);
  return parts.length ? parts.join(" · ") : "无";
}

export default function TreasurePage() {
  const { hydrated, treasureMaps, completeTreasureMap } = useWorld();
  const [message, setMessage] = useState("");
  const lastClickRef = useRef(new Map());

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载藏宝图…</div>
        </div>
      </div>
    );
  }

  const grouped = {
    new: treasureMaps.filter((map) => map.status === "new"),
    active: treasureMaps.filter((map) => map.status === "active"),
    completed: treasureMaps.filter((map) => map.status === "completed"),
  };

  function handleComplete(mapId) {
    const now = Date.now();
    const lastClick = lastClickRef.current.get(mapId) || 0;
    if (now - lastClick < 1000) return;
    lastClickRef.current.set(mapId, now);
    const result = completeTreasureMap(mapId);
    if (!result.ok) {
      setMessage(result.message);
    } else {
      setMessage("✨ 宝箱已开启，大额奖励已入账");
    }
    setTimeout(() => setMessage(""), 3000);
  }

  function renderSection(title, maps) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-100">{title}</h2>
        {maps.length === 0 ? (
          <div className="text-sm text-slate-500">暂无记录</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maps.map((map) => {
              const progress = Math.min(100, Math.round((map.completedTasks / map.targetTasks) * 100));
              const readyToOpen = map.completedTasks >= map.targetTasks && map.status !== "completed";
              return (
                <div key={map.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-200">{map.name}</div>
                      <div className={`text-xs mt-1 ${TIER_STYLES[map.tier] || "text-slate-400"}`}>
                        {map.tier} 级远征 · {map.source}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {map.completedTasks}/{map.targetTasks}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">远征进度 {progress}%</div>
                  </div>
                  <div className="text-xs text-slate-400">
                    基础奖励：{renderReward(map.baseReward)}
                  </div>
                  <div className="text-xs text-slate-400">
                    大额奖励：{renderReward(map.bigReward)}
                  </div>
                  {readyToOpen && (
                    <button
                      onClick={() => handleComplete(map.id)}
                      className="w-full rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-medium py-2"
                    >
                      开启宝箱
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🗺 藏宝图与远征
        </h1>
        <p className="text-sm text-slate-400">
          藏宝图是大额奖励系统，完成相关任务即可推进进度并开启宝箱。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      {renderSection("🌟 新获得", grouped.new)}
      {renderSection("🔥 进行中", grouped.active)}
      {renderSection("✅ 已完成", grouped.completed)}
    </div>
  );
}
