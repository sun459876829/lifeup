"use client";

import { useMemo, useState } from "react";
import { useWorld } from "../worldState";
import { TASK_CATEGORIES, TASK_TEMPLATES } from "../gameConfig/tasksConfig";
import { calculateReward, resolveTaskKind } from "../../game/config";

const CUSTOM_CATEGORY_LABELS = {
  study: "学习",
  money: "工作赚钱",
  life: "生活整理",
  body: "运动身体",
  social: "社交",
  misc: "其他",
};

const SYSTEM_CATEGORY_LABELS = TASK_CATEGORIES.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

const CATEGORY_LABELS = { ...SYSTEM_CATEGORY_LABELS, ...CUSTOM_CATEGORY_LABELS };

function normalizeEffect(category, effect = {}) {
  return effect;
}

function formatEffect(category, effect = {}) {
  const normalized = normalizeEffect(category, effect);
  const labels = [];
  if (normalized.hunger) labels.push(`🍞 ${normalized.hunger > 0 ? "+" : ""}${normalized.hunger} 饱食`);
  if (normalized.sanity) labels.push(`🧠 ${normalized.sanity > 0 ? "+" : ""}${normalized.sanity} 精神`);
  if (normalized.life) labels.push(`❤️ ${normalized.life > 0 ? "+" : ""}${normalized.life} 生命`);
  return labels;
}

function formatDifficulty(level) {
  const value = Math.min(5, Math.max(1, Number(level) || 1));
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function resolveCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "其他";
}

export default function TasksPage() {
  const { hydrated, tasks, stats, achievements, registerTask, completeTask, burst } = useWorld();
  const [message, setMessage] = useState("");

  const groupedTemplates = useMemo(() => {
    const groups = {};
    TASK_CATEGORIES.forEach((category) => {
      groups[category.key] = [];
    });
    TASK_TEMPLATES.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, []);

  function handleAccept(template) {
    registerTask(template);
    setMessage(`📌 已接受任务：「${template.title}」`);
    setTimeout(() => setMessage(""), 2000);
  }

  function handleComplete(taskId) {
    const result = completeTask(taskId);
    if (!result.ok) {
      setMessage(result.message);
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    const burstRate = Math.round((result.burstBonus || 0) * 100);
    const comboNote =
      result.comboCount > 1 && burstRate > 0 ? `连击 x${result.comboCount}，额外奖励 +${burstRate}%！` : "";
    setMessage(
      `✨ 完成任务，获得 ${result.rewardCoins}🪙 + ${result.rewardExp} EXP ${comboNote}`.trim()
    );
    setTimeout(() => setMessage(""), 3000);
  }

  function canAccept(template) {
    if (!template.requirements) return true;
    if (template.requirements.hunger && stats.hunger < template.requirements.hunger) return false;
    if (template.requirements.sanity && stats.sanity < template.requirements.sanity) return false;
    if (template.requirements.life && stats.life < template.requirements.life) return false;

    if (template.prerequisites?.length) {
      const unlockedKeys = new Set(achievements.filter((a) => a.unlocked).map((a) => a.key));
      return template.prerequisites.every((key) => unlockedKeys.has(key));
    }

    return true;
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载任务大厅…</div>
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter((task) => task.status === "todo");
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          📜 任务大厅 · 荒野生存
        </h1>
        <p className="text-sm text-slate-400">
          接受任务 → 完成任务 → 资源与成就推进。每个任务都像饥荒里的「砍一棵树」。
        </p>
        {burst?.comboCount > 1 && (
          <div className="text-xs text-slate-500">当前连击 x{burst.comboCount}</div>
        )}
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🧾 可领取任务</h2>
        <div className="space-y-6">
          {TASK_CATEGORIES.map((category) => (
            <div key={category.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-200">{category.label}</div>
                  <div className="text-xs text-slate-500">{category.description}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(groupedTemplates[category.key] || []).map((template) => {
                  const effects = formatEffect(template.category, template.effect);
                  const canTake = canAccept(template);
                  const baseReward = calculateReward({
                    difficulty: template.difficulty || 1,
                    minutes: template.minutes || 10,
                    kind: resolveTaskKind(template.category, template.kind),
                    comboCount: 1,
                  });
                  return (
                    <div
                      key={`${category.key}-${template.title}`}
                      className={`rounded-xl border p-4 space-y-3 ${
                        canTake
                          ? "border-slate-700 bg-slate-950/50"
                          : "border-slate-800 bg-slate-900/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{template.title}</div>
                          {template.subtype && (
                            <div className="text-xs text-slate-500">{template.subtype}</div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">EXP {baseReward.exp}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>🪙 {baseReward.coins}</span>
                        {template.isRepeatable && <span>🔁 可重复</span>}
                      </div>
                      {effects.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {effects.map((effect) => (
                            <span
                              key={effect}
                              className="text-[11px] px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleAccept(template)}
                        disabled={!canTake}
                        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                          canTake
                            ? "bg-violet-500/80 hover:bg-violet-500 text-white"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {canTake ? "接受任务" : "条件不足"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🗂 当前任务</h2>
        {todoTasks.length === 0 ? (
          <div className="text-sm text-slate-500">还没有已接受的任务。</div>
        ) : (
          <div className="space-y-3">
            {todoTasks.map((task) => {
              const effects = formatEffect(task.category, task.effect);
              const resolvedKind = task.kind || resolveTaskKind(task.category, task.kind);
              const rewardPreview = calculateReward({
                difficulty: task.difficulty || 1,
                minutes: task.minutes || 10,
                kind: resolvedKind,
                comboCount: 1,
              });
              const canComplete = true;
              return (
                <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{task.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                          {resolveCategoryLabel(task.category)}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                          难度 {formatDifficulty(task.difficulty)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      预计 EXP {rewardPreview.exp}
                    </span>
                  </div>
                  {effects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {effects.map((effect) => (
                        <span
                          key={effect}
                          className="text-[11px] px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                        >
                          {effect}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      预计奖励 🪙 {rewardPreview.coins} · {task.isRepeatable ? "可重复" : "一次性"}
                    </div>
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={!canComplete}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        canComplete
                          ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      完成
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">✅ 已完成任务</h2>
        {doneTasks.length === 0 ? (
          <div className="text-sm text-slate-500">还没有完成记录。</div>
        ) : (
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="text-sm text-slate-200">{task.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleString("zh-CN")
                    : "已完成"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
