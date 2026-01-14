"use client";

import { useState, useEffect } from "react";
import { useMagicWorld } from "../magicWorldContext";

// 来源映射
const SOURCE_MAP = {
  shop: "商店",
  lottery: "抽奖",
  task: "任务",
  fusion: "合成",
};

export default function InventoryPage() {
  const { hydrated, claims } = useMagicWorld();
  const [localClaims, setLocalClaims] = useState(claims || []);

  // 当 claims 更新时同步本地状态
  useEffect(() => {
    setLocalClaims(claims || []);
  }, [claims]);

  function toggleUsed(claimId) {
    setLocalClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId ? { ...claim, used: !claim.used } : claim
      )
    );
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载背包…</div>
        </div>
      </div>
    );
  }

  // 按时间倒序排序（最新的在前）
  const sortedClaims = [...(localClaims || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🎒 背包
        </h1>
        <p className="text-sm text-slate-400">查看你已获得的所有奖励和道具</p>
      </header>

      {/* 奖励列表 */}
      {sortedClaims.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8">
          <div className="text-center space-y-2">
            <div className="text-4xl mb-4">🎁</div>
            <div className="text-slate-300 text-base mb-1">还没有道具</div>
            <div className="text-slate-500 text-sm">
              去任务大厅或者商店逛逛吧~
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-3">
          <h2 className="text-sm font-medium text-slate-100 mb-4">
            我的奖励 ({sortedClaims.length})
          </h2>
          <div className="space-y-2">
            {sortedClaims.map((claim) => {
              const isUsed = claim.used || false;
              const source = SOURCE_MAP[claim.type] || "未知来源";

              return (
                <div
                  key={claim.id}
                  className={`rounded-lg border p-4 ${
                    isUsed
                      ? "border-slate-800 bg-slate-900/30 opacity-60"
                      : "border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{claim.emoji || "🎁"}</span>
                      <div className="flex-1">
                        <div
                          className={`text-sm font-medium ${
                            isUsed ? "line-through text-slate-500" : "text-slate-200"
                          }`}
                        >
                          {claim.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500">来源：{source}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(claim.ts).toLocaleDateString("zh-CN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isUsed
                            ? "bg-slate-800 text-slate-500"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {isUsed ? "已用" : "未用"}
                      </span>
                      <button
                        onClick={() => toggleUsed(claim.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${
                          isUsed
                            ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                        }`}
                      >
                        {isUsed ? "标记未用" : "标记已用"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
