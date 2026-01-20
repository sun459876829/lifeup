"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWorld } from "../worldState";

const KIND_LABELS = {
  task_complete: "完成任务",
  task_add: "新增任务",
  task_edit: "编辑任务",
  task_revert: "撤销操作",
  reward_gain: "获得奖励",
  achievement_unlock: "成就解锁",
  attribute_level_up: "属性升级",
  timer_reward: "计时奖励",
  history_undo: "撤销记录",
};

function formatDelta(value, suffix) {
  if (typeof value !== "number" || Number.isNaN(value) || value === 0) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix || ""}`;
}

function resolveEntryTitle(entry, tasks, taskConfig) {
  const payload = entry.payload || {};
  const entryType = entry.type || entry.kind;
  if (entryType === "task_complete") {
    const templateTitle = payload.templateId
      ? taskConfig?.[payload.templateId]?.name
      : tasks.find((task) => task.id === payload.taskId)?.title;
    return templateTitle || payload.taskTitle || "未知任务";
  }
  if (entryType === "task_add" || entryType === "task_edit") {
    return payload.taskTitle || "未知任务";
  }
  if (entryType === "reward_gain") {
    return payload.title || payload.reason || "奖励";
  }
  if (entryType === "achievement_unlock") {
    return payload.name || "成就解锁";
  }
  if (entryType === "attribute_level_up") {
    return payload.attributeId ? `属性升级 · ${payload.attributeId}` : "属性升级";
  }
  if (entryType === "timer_reward") {
    return payload.taskTitle || "计时奖励";
  }
  if (entryType === "task_revert") {
    const label = KIND_LABELS[payload.targetType] || "操作";
    return payload.taskTitle
      ? `撤销：${payload.taskTitle}`
      : payload.targetTitle
        ? `撤销：${payload.targetTitle}`
        : `撤销：${label}`;
  }
  return payload.title || "";
}

function resolveCoinsDelta(entry) {
  const entryType = entry.type || entry.kind;
  if (entryType === "reward_gain") {
    const amount = entry.payload?.amount ?? entry.payload?.coins ?? entry.payload?.delta;
    if (typeof amount === "number") return amount;
  }
  if (entryType === "timer_reward") {
    const amount = entry.payload?.coins;
    if (typeof amount === "number") return amount;
  }
  return null;
}

export default function HistoryPage() {
  const { hydrated, history, tasks, undoHistory, taskConfig } = useWorld();
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const entries = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    const sorted = [...list].sort(
      (a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)
    );
    if (filter === "all") return sorted;
    return sorted.filter((entry) => (entry.type || entry.kind) === filter);
  }, [history, filter]);

  const handleUndo = (id) => {
    const result = undoHistory(id);
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>筛选：</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">全部</option>
              {Object.keys(KIND_LABELS).map((key) => (
                <option key={key} value={key}>
                  {KIND_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          {entries.map((entry) => {
            const entryType = entry.type || entry.kind;
            const label = KIND_LABELS[entryType] || "未知操作";
            const title = resolveEntryTitle(entry, tasks, taskConfig);
            const coinsText = formatDelta(resolveCoinsDelta(entry), " 🪙");
            const undoable = (entry.canUndo ?? entry.undoable ?? !entry.undone) && !entry.undone;
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
                  {entry.undone && <span className="text-rose-300">已撤销</span>}
                  <button
                    type="button"
                    onClick={() => handleUndo(entry.id)}
                    disabled={!undoable}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                      undoable
                        ? "border-rose-400/50 text-rose-200 hover:border-rose-300 hover:text-rose-100"
                        : "border-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    撤销
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
