"use client";

import { useState } from "react";
import { useWorld } from "../worldState";

const SOURCE_MAP = {
  shop: "商店",
  treasure: "藏宝图",
  achievement: "成就",
  event: "事件",
};

export default function InventoryPage() {
  const { hydrated, claims, achievements, useClaim } = useWorld();
  const [message, setMessage] = useState("");

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载背包…</div>
        </div>
      </div>
    );
  }

  const sortedClaims = [...claims].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const unlockedAchievements = achievements.filter((item) => item.unlocked);

  function handleUseClaim(claimId) {
    useClaim(claimId);
    setMessage("✅ 已标记为已使用");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🎒 背包与成就
        </h1>
        <p className="text-sm text-slate-400">查看纪念徽章与成就进度</p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🎁 纪念徽章</h2>
        {sortedClaims.length === 0 ? (
          <div className="text-sm text-slate-500">还没有纪念徽章。</div>
        ) : (
          <div className="space-y-2">
            {sortedClaims.map((claim) => {
              const source = SOURCE_MAP[claim.type] || "来源未知";
              return (
                <div
                  key={claim.id}
                  className={`rounded-lg border p-4 ${
                    claim.used
                      ? "border-slate-800 bg-slate-900/30 opacity-60"
                      : "border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-200">{claim.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {source} · {new Date(claim.ts).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseClaim(claim.id)}
                      disabled={claim.used}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${
                        claim.used
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      }`}
                    >
                      {claim.used ? "已使用" : "标记使用"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🏆 成就</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.key}
              className={`rounded-xl border p-4 ${
                achievement.unlocked
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">{achievement.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{achievement.description}</div>
                </div>
                <div className="text-xs text-slate-400">
                  {achievement.unlocked ? "已解锁" : `${achievement.progress || 0}/${achievement.target || 0}`}
                </div>
              </div>
              {achievement.unlocked && (
                <div className="text-[11px] text-emerald-300 mt-2">
                  解锁于 {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString("zh-CN") : "刚刚"}
                </div>
              )}
            </div>
          ))}
        </div>
        {unlockedAchievements.length === 0 && (
          <div className="text-xs text-slate-500">尚未解锁成就，继续在任务大厅积累进度。</div>
        )}
      </section>
    </div>
  );
}
