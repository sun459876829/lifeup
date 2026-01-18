"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWorld } from "../worldState";

const KIND_LABELS = {
  task_complete: "完成任务",
  task_uncomplete: "撤销完成",
  reward_spend: "支出奖励",
  ticket_use: "使用券",
  ticket_unuse: "撤销券",
  coins_adjust: "金币调整",
  exp_adjust: "经验调整",
  coins_change: "金币变动",
  history_undo: "撤销记录",
};

function formatDelta(value, suffix) {
  if (typeof value !== "number" || Number.isNaN(value) || value === 0) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix || ""}`;
}

function resolveEntryTitle(entry, tasks) {
  const payload = entry.payload || {};
  const entryType = entry.type || entry.kind;
  if (entryType === "task_complete") {
    return payload.taskTitle || tasks.find((task) => task.id === payload.taskId)?.title || "未知任务";
  }
  if (entryType === "ticket_use") {
    return payload.ticketName || "券";
  }
  if (entryType === "history_undo") {
    const label = KIND_LABELS[payload.targetType] || "操作";
    return payload.targetTitle ? `撤销：${payload.targetTitle}` : `撤销：${label}`;
  }
  return payload.title || "";
}

function resolveCoinsDelta(entry) {
  if (typeof entry.payload?.coinsDelta === "number") return entry.payload.coinsDelta;
  if ((entry.type || entry.kind) === "coins_change" && typeof entry.payload?.delta === "number") {
    return entry.payload.delta;
  }
  return null;
}

function resolveExpDelta(entry) {
  if (typeof entry.payload?.expDelta === "number") return entry.payload.expDelta;
  return null;
}

export default function HistoryPage() {
  const { hydrated, history, tasks, undoHistoryItem } = useWorld();
  const [message, setMessage] = useState("");
  const entries = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    return [...list].sort(
      (a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)
    );
  }, [history]);

  const handleUndo = (id) => {
    const result = undoHistoryItem(id);
    if (result?.ok) {
      setMessage("已撤销所选记录");
    } else {
      setMessage(result?.error || "无法撤销该记录");
    }
    setTimeout(() => setMessage(""), 2000);
  };

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

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
          暂无历史记录，完成任务或使用券后会出现在这里。
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const entryType = entry.type || entry.kind;
            const label = KIND_LABELS[entryType] || "未知操作";
            const title = resolveEntryTitle(entry, tasks);
            const coinsText = formatDelta(resolveCoinsDelta(entry), " 🪙");
            const expText = formatDelta(resolveExpDelta(entry), " EXP");
            const undoable =
              !entry.undone &&
              (typeof entry.undoable === "boolean" ? entry.undoable : Boolean(entry.undo));
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
                    {(entry.timestamp || entry.createdAt)
                      ? new Date(entry.timestamp || entry.createdAt).toLocaleString("zh-CN")
                      : ""}
                  </div>
                </div>
                <div className="text-sm text-slate-300">{title}</div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {coinsText && <span>金币 {coinsText}</span>}
                  {expText && <span>经验 {expText}</span>}
                  {entry.undone && <span className="text-rose-300">已撤销</span>}
                  {undoable && (
                    <button
                      type="button"
                      onClick={() => handleUndo(entry.id)}
                      className="rounded-full border border-rose-400/50 px-2 py-0.5 text-[11px] text-rose-200 hover:border-rose-300 hover:text-rose-100 transition"
                    >
                      撤销
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
