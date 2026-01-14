"use client";

import { useState } from "react";
import { useMagicWorld } from "../magicWorldContext";

// 默认项目列表（与 Context 中保持一致）
const DEFAULT_PROJECTS = [
  { id: "ququ", name: "曲曲系统", target: 10 },
  { id: "kaizhi", name: "开智学习", target: 10 },
  { id: "douyin", name: "抖音 / tiktok", target: 10 },
  { id: "english", name: "英语 / 背单词", target: 10 },
  { id: "eddy", name: "Eddy 指导", target: 10 },
  { id: "life", name: "生活整理", target: 10 },
];

const GEM_INFO = {
  ruby: { name: "红宝石", emoji: "🔴", color: "rose" },
  sapphire: { name: "蓝宝石", emoji: "🔵", color: "sky" },
  emerald: { name: "绿宝石", emoji: "🟢", color: "emerald" },
  amethyst: { name: "紫水晶", emoji: "🟣", color: "purple" },
};

const GEM_TYPES = ["ruby", "sapphire", "emerald", "amethyst"];

// 里程碑定义
const MILESTONES = [3, 6, 10];

export default function TreasurePage() {
  const { hydrated, gems, projects, fuseGem } = useMagicWorld();
  const [message, setMessage] = useState("");

  function handleFuseGem(gemType) {
    const result = fuseGem(gemType);
    if (result) {
      if (result.success) {
        setMessage(result.message);
      } else {
        setMessage(result.message);
      }
      setTimeout(() => setMessage(""), result.success ? 3000 : 3000);
    }
  }

  // 计算下一个里程碑
  function getNextMilestone(steps) {
    return MILESTONES.find((m) => steps < m) || null;
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载藏宝图…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🗺 藏宝图 & 宝石
        </h1>
      </header>

      {/* 消息提示 */}
      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      {/* 宝石总览（顶部） */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4">
        <h2 className="text-sm font-medium text-slate-100 mb-3">💎 宝石总览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GEM_TYPES.map((gemType) => {
            const info = GEM_INFO[gemType];
            const count = gems[gemType] || 0;
            return (
              <div
                key={gemType}
                className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-center"
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className="text-lg font-bold text-slate-200">{count}</div>
                <div className="text-xs text-slate-400 mt-0.5">{info.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 上半部分：藏宝图进度 */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100 mb-4">📜 项目藏宝图</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_PROJECTS.map((project) => {
            const progressData = projects[project.id] || { steps: 0, target: project.target };
            const steps = progressData.steps || 0;
            const target = progressData.target || project.target;
            const percentage = (steps / target) * 100;
            const nextMilestone = getNextMilestone(steps);

            return (
              <div
                key={project.id}
                className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-200">{project.name}</h3>
                  <span className="text-sm text-slate-400">{steps}/{target}</span>
                </div>

                {/* 进度条 */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* 下一颗宝石提示 */}
                {nextMilestone ? (
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                    下一颗宝石还差 {nextMilestone - steps} 步（{nextMilestone} 步里程碑）
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 pt-2 border-t border-slate-800">
                    ✨ 已完成所有里程碑！
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 下半部分：宝石合成区 */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6 space-y-4">
        <h2 className="text-sm font-medium text-violet-100 mb-4">✨ 宝石合成</h2>
        <div className="space-y-3">
          {GEM_TYPES.map((gemType) => {
            const info = GEM_INFO[gemType];
            const count = gems[gemType] || 0;
            const canFuse = count >= 3;

            // 定义合成奖励说明
            const rewardNames = {
              emerald: "休息 1 小时券",
              sapphire: "自选奖励券",
              amethyst: "大礼盒券",
              ruby: "自选奖励券",
            };

            return (
              <div
                key={gemType}
                className={`rounded-xl border p-4 ${
                  canFuse
                    ? "border-slate-700 bg-slate-950/50"
                    : "border-slate-800 bg-slate-900/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">{info.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        当前数量：{count} 颗
                        {canFuse && (
                          <span className="text-emerald-400 ml-2">→ {rewardNames[gemType]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFuseGem(gemType)}
                    disabled={!canFuse}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                      canFuse
                        ? gemType === "ruby"
                          ? "bg-rose-500 hover:bg-rose-400 text-white active:scale-95"
                          : gemType === "sapphire"
                          ? "bg-sky-500 hover:bg-sky-400 text-white active:scale-95"
                          : gemType === "emerald"
                          ? "bg-emerald-500 hover:bg-emerald-400 text-white active:scale-95"
                          : "bg-purple-500 hover:bg-purple-400 text-white active:scale-95"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {canFuse ? "合成 (3→1)" : `${count}/3`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-slate-400 pt-3 border-t border-slate-800 space-y-1">
          <div className="text-slate-300 font-medium mb-1">合成奖励说明：</div>
          <div className="space-y-0.5">
            <div>🟢 绿宝石 × 3 → 😴 休息 1 小时券 + 10XP</div>
            <div>🔵 蓝宝石 × 3 → 🎁 自选奖励券 + 15XP</div>
            <div>🟣 紫水晶 × 3 → 🎉 大礼盒券 + 20XP</div>
            <div>🔴 红宝石 × 3 → 🎁 自选奖励券 + 10XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
