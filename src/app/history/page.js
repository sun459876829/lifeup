"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWorld } from "../worldState";

const KIND_LABELS = {
  task_complete: "完成任务",
  task_uncomplete: "撤销完成",
  reward_spend: "支出奖励",
  ticket_use: "使用券",
  ticket_unuse: "撤销券",
  coins_adjust: "金币调整",
  exp_adjust: "经验调整",
};

function formatDelta(value, suffix) {
  if (typeof value !== "number" || Number.isNaN(value) || value === 0) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix || ""}`;
}

function resolveEntryTitle(entry, tasks) {
  const payload = entry.payload || {};
  if (entry.kind === "task_complete") {
    return payload.taskTitle || tasks.find((task) => task.id === payload.taskId)?.title || "未知任务";
  }
  if (entry.kind === "ticket_use") {
    return payload.ticketName || "券";
  }
  return payload.title || "";
}

export default function HistoryPage() {
  const { hydrated, history, tasks } = useWorld();
  const entries = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [history]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载历史记录…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
            🕒 历史记录
          </h1>
          <p className="text-sm text-slate-400">查看最近的任务、券使用记录与撤销状态。</p>
        </div>
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
        >
          ← 返回首页
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
          暂无历史记录，完成任务或使用券后会出现在这里。
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const label = KIND_LABELS[entry.kind] || "未知操作";
            const title = resolveEntryTitle(entry, tasks);
            const coinsText = formatDelta(entry.payload?.coinsDelta, " 🪙");
            const expText = formatDelta(entry.payload?.expDelta, " EXP");
            return (
              <div
                key={entry.id}
                className={`rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 ${
                  entry.undone ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-100">{label}</div>
                  <div className="text-xs text-slate-500">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString("zh-CN") : ""}
                  </div>
                </div>
                <div className="text-sm text-slate-300">{title}</div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {coinsText && <span>金币 {coinsText}</span>}
                  {expText && <span>经验 {expText}</span>}
                  {entry.undone && <span className="text-rose-300">已撤销</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
