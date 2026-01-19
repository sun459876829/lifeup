"use client";

import { useMemo, useState } from "react";
import { useGameState } from "@/state/GameStateContext";
import { computeReward, estimateRewardRange } from "@/game/config/rewards";
import { RESOURCES } from "@/game/config/resources";

const CATEGORY_LABELS = {
  learning: "学习",
  cleaning: "清洁",
  work: "夜场/工作",
  english: "英语",
  health: "健康",
  context: "情境切换",
  explore: "探索",
  other: "其他",
};

const DIFFICULTY_STARS = {
  tiny: 1,
  small: 2,
  medium: 3,
  large: 4,
  huge: 5,
};

const RESOURCE_ICONS = {
  wood: "🪵",
  stone: "🪨",
  fiber: "🧵",
  scrap: "⚙️",
  insightShard: "🔮",
  energyCrystal: "💠",
  languageRune: "📘",
  soulShard: "✨",
};

function formatDifficulty(difficulty) {
  const value = DIFFICULTY_STARS[difficulty] || 1;
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function formatRange(minValue, maxValue) {
  if (minValue === maxValue) return `${minValue}`;
  return `${minValue}–${maxValue}`;
}

function resolveCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "其他";
}

function buildRewardPreview(template) {
  const range = estimateRewardRange({
    minutes: template.estimatedMinutes,
    difficulty: template.difficulty,
    category: template.category,
  });
  const reward = computeReward({
    minutes: template.estimatedMinutes,
    difficulty: template.difficulty,
    category: template.category,
  });
  return {
    range,
    reward,
  };
}

export default function TasksPage() {
  const { hydrated, tasks, spawnTaskInstance, completeTaskInstance } = useGameState();
  const [message, setMessage] = useState("");

  const templates = useMemo(() => Object.values(tasks.templates || {}), [tasks.templates]);

  const groupedTemplates = useMemo(() => {
    const groups = {};
    templates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [templates]);

  const categories = useMemo(() => Object.keys(groupedTemplates), [groupedTemplates]);

  const activeInstances = useMemo(
    () => tasks.active.filter((task) => task.status === "pending" || task.status === "active"),
    [tasks.active]
  );

  const doneInstances = useMemo(
    () => tasks.active.filter((task) => task.status === "done"),
    [tasks.active]
  );

  function handleAccept(template) {
    const instance = spawnTaskInstance(template.id);
    if (!instance) {
      setMessage("该任务进行中或已达领取上限。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    setMessage(`📌 已领取任务：「${template.title}」`);
    setTimeout(() => setMessage(""), 2000);
  }

  function handleComplete(instanceId, template) {
    const result = completeTaskInstance(instanceId);
    if (!result.ok) {
      setMessage("完成失败，请稍后重试。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    const reward = result.reward;
    const drops = reward?.resourceDrops
      ?.map((drop) => `${RESOURCES[drop.id]?.name || drop.id} x${drop.amount}`)
      .join("、");
    const dropText = drops ? `，掉落 ${drops}` : "";
    setMessage(
      `✨ 完成「${template.title}」：+${reward?.coins || 0} 金币，+${reward?.exp || 0} EXP${dropText}`
    );
    setTimeout(() => setMessage(""), 3000);
  }

  function hasActiveInstance(templateId) {
    return activeInstances.some((task) => task.templateId === templateId);
  }

  function canSpawnTemplate(template) {
    if (template.repeatable) {
      return !hasActiveInstance(template.id);
    }
    const maxInstances = template.maxInstances ?? 1;
    const existingCount = tasks.active.filter((task) => task.templateId === template.id).length;
    return existingCount < maxInstances;
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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          📜 任务大厅 · 生存任务
        </h1>
        <p className="text-sm text-slate-400">
          领取任务 → 完成任务 → 掉落资源与经验。预计奖励基于任务时长与难度估算。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🧾 可领取任务</h2>
        <div className="space-y-6">
          {categories.map((categoryKey) => (
            <div key={categoryKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-200">
                    {resolveCategoryLabel(categoryKey)}
                  </div>
                  <div className="text-xs text-slate-500">任务分类 · {categoryKey}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(groupedTemplates[categoryKey] || []).map((template) => {
                  const { range, reward } = buildRewardPreview(template);
                  const canSpawn = canSpawnTemplate(template);
                  const active = hasActiveInstance(template.id);
                  const resourceIds = reward.resourceDrops.map((drop) => drop.id);
                  return (
                    <div
                      key={`${categoryKey}-${template.id}`}
                      className={`relative rounded-xl border p-4 space-y-3 ${
                        canSpawn
                          ? "border-slate-700 bg-slate-950/50"
                          : "border-slate-800 bg-slate-900/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{template.title}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            预计 {template.estimatedMinutes} 分钟 · {formatDifficulty(template.difficulty)}
                          </div>
                        </div>
                        {template.repeatable && (
                          <span className="text-[11px] px-2 py-1 rounded-full border border-violet-400/40 text-violet-200 bg-violet-500/10">
                            可重复
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-slate-400">{template.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>
                          约 {formatRange(range.minCoins, range.maxCoins)} 金币，
                          {formatRange(range.minExp, range.maxExp)} EXP
                        </span>
                      </div>
                      {resourceIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                          {resourceIds.map((id) => (
                            <span
                              key={id}
                              className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5"
                            >
                              <span>{RESOURCE_ICONS[id] || "🎁"}</span>
                              <span>{RESOURCES[id]?.name || id}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleAccept(template)}
                        disabled={!canSpawn}
                        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                          canSpawn
                            ? "bg-violet-500/80 hover:bg-violet-500 text-white"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {active ? "进行中" : canSpawn ? "领取" : "已领取"}
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
        {activeInstances.length === 0 ? (
          <div className="text-sm text-slate-500">还没有已领取的任务。</div>
        ) : (
          <div className="space-y-3">
            {activeInstances.map((task) => {
              const template = tasks.templates[task.templateId];
              if (!template) return null;
              const { range, reward } = buildRewardPreview(template);
              const resourceIds = reward.resourceDrops.map((drop) => drop.id);
              return (
                <div
                  key={task.instanceId}
                  className="relative rounded-xl border border-slate-700 bg-slate-950/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{template.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                          {resolveCategoryLabel(template.category)}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                          难度 {formatDifficulty(template.difficulty)}
                        </span>
                        {template.repeatable && (
                          <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-violet-200">
                            可重复
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      约 {formatRange(range.minCoins, range.maxCoins)} 金币
                    </span>
                  </div>
                  {template.description && (
                    <div className="mt-2 text-xs text-slate-400">{template.description}</div>
                  )}
                  {resourceIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                      {resourceIds.map((id) => (
                        <span
                          key={id}
                          className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5"
                        >
                          <span>{RESOURCE_ICONS[id] || "🎁"}</span>
                          <span>{RESOURCES[id]?.name || id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      预计奖励 {formatRange(range.minExp, range.maxExp)} EXP
                    </div>
                    <button
                      onClick={() => handleComplete(task.instanceId, template)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition bg-emerald-500/80 hover:bg-emerald-500 text-white"
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
        {doneInstances.length === 0 ? (
          <div className="text-sm text-slate-500">还没有完成记录。</div>
        ) : (
          <div className="space-y-2">
            {doneInstances.map((task) => {
              const template = tasks.templates[task.templateId];
              return (
                <div key={task.instanceId} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                  <div className="text-sm text-slate-200">{template?.title || task.templateId}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {task.finishedAt ? new Date(task.finishedAt).toLocaleString("zh-CN") : "已完成"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
