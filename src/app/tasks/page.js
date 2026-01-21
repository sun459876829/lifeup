"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGameState } from "@/state/GameStateContext";
import { useWorld } from "../worldState";
import { computeReward, estimateRewardRange } from "@/game/config/rewards";
import { RESOURCES } from "@/game/config/resources";
import { ITEMS } from "@/game/config/items";
import { getBatchSuggestion } from "@/game/engine/batchEngine";

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

const TAB_OPTIONS = [
  { id: "today", label: "今日任务" },
  { id: "repeat", label: "重复任务" },
  { id: "endless", label: "无限任务" },
  { id: "done", label: "已完成" },
];

function formatTileEventReward(result) {
  if (!result) return "";
  const parts = [];
  if (result.coinsDelta) {
    parts.push(`金币 +${result.coinsDelta}`);
  }
  if (result.expDelta) {
    parts.push(`EXP +${result.expDelta}`);
  }
  if (result.resourceChanges) {
    Object.entries(result.resourceChanges).forEach(([id, amount]) => {
      if (!amount) return;
      const meta = RESOURCES[id];
      const icon = RESOURCE_ICONS[id] || "📦";
      parts.push(`${icon} ${meta?.name || id} x${amount}`);
    });
  }
  if (result.inventoryChanges) {
    Object.entries(result.inventoryChanges).forEach(([id, amount]) => {
      if (!amount) return;
      parts.push(`🎁 ${ITEMS?.[id]?.name || id} x${amount}`);
    });
  }
  return parts.length > 0 ? parts.join("，") : "暂无额外奖励";
}

function formatDifficulty(difficulty) {
  const value = DIFFICULTY_STARS[difficulty] || 1;
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function formatRange(minValue, maxValue) {
  if (minValue === maxValue) return `${minValue}`;
  return `${minValue}–${maxValue}`;
}

function formatMinutes(value) {
  if (!value) return "-";
  return `${value} 分钟`;
}

function extractTags(title = "", tags = []) {
  const matches = Array.from(title.matchAll(/#([\\p{L}\\p{N}_-]+)/gu)).map((match) => match[1]);
  const cleanTitle = title.replace(/#[\\p{L}\\p{N}_-]+/gu, "").trim();
  const merged = Array.from(new Set([...(tags || []), ...matches])).filter(Boolean);
  return { cleanTitle: cleanTitle || title, tags: merged };
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
  const gameState = useGameState();
  const {
    hydrated: coreHydrated,
    tasks: coreTasks,
    registerTask,
    completeTask,
    addNote,
    addBatchPlan,
    dailyBatchPlan,
  } = useWorld();
  const {
    hydrated,
    tasks,
    spawnTaskInstance,
    completeTaskInstance,
    pushHistory,
    taskStreaks,
    board,
    player,
    npc,
  } = gameState;
  const [message, setMessage] = useState("");
  const [batchSuggestion, setBatchSuggestion] = useState(null);
  const [diceFeedback, setDiceFeedback] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [quickTitle, setQuickTitle] = useState("");
  const [randomPick, setRandomPick] = useState(null);
  const [batchMode, setBatchMode] = useState("category");
  const searchParams = useSearchParams();
  const [taskTab, setTaskTab] = useState(() => searchParams.get("tab") || "today");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (nextTab && TAB_OPTIONS.some((tab) => tab.id === nextTab)) {
      setTaskTab(nextTab);
    }
  }, [searchParams]);

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

  const coreTodoTasks = useMemo(
    () => (coreTasks || []).filter((task) => task.status !== "done"),
    [coreTasks]
  );

  const coreDoneTasks = useMemo(
    () => (coreTasks || []).filter((task) => task.status === "done"),
    [coreTasks]
  );

  const filteredCoreTasks = useMemo(() => {
    if (taskTab === "done") return coreDoneTasks;
    if (taskTab === "repeat") {
      return coreTodoTasks.filter((task) => task.isRepeatable || task.type === "REPEATABLE");
    }
    if (taskTab === "endless") {
      return coreTodoTasks.filter((task) => task.type === "HABIT");
    }
    return coreTodoTasks;
  }, [coreDoneTasks, coreTodoTasks, taskTab]);

  const batchGroups = useMemo(() => {
    const groups = {};
    coreTodoTasks.forEach((task) => {
      let key = task.category || "其他";
      if (batchMode === "priority") {
        key = task.priority || "FAST";
      }
      if (batchMode === "tag") {
        key = (task.tags && task.tags[0]) || "无标签";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [coreTodoTasks, batchMode]);

  function handleAccept(template, options) {
    const instance = spawnTaskInstance(template.id, options);
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

    if (typeof result.diceValue === "number") {
      setDiceFeedback({
        title: template.title,
        diceValue: result.diceValue,
        boardSteps: result.boardSteps,
        playerPosition: result.playerPosition,
        playerLaps: result.playerLaps,
        tileEvent: result.tileEvent,
      });
    }

    const suggestion = getBatchSuggestion(template.id, tasks.templates, gameState);
    if (suggestion) {
      setBatchSuggestion(suggestion);
    }
  }

  function handleBatchAccept() {
    if (!batchSuggestion) return;
    const spawned = batchSuggestion.templates
      .map((template) =>
        spawnTaskInstance(template.id, { bonusMultiplier: batchSuggestion.bonusMultiplier })
      )
      .filter(Boolean);
    const templateIds = spawned.map((item) => item.templateId);
    if (templateIds.length > 0) {
      pushHistory({
        type: "batch_accept",
        payload: {
          templateIds,
          bonusMultiplier: batchSuggestion.bonusMultiplier,
        },
      });
      setMessage("⚡ 已领取连做任务，完成可获得额外奖励！");
      setTimeout(() => setMessage(""), 2500);
    } else {
      setMessage("连做任务已存在或无法领取。");
      setTimeout(() => setMessage(""), 2000);
    }
    setBatchSuggestion(null);
  }

  function handleQuickAdd() {
    const title = quickTitle.trim();
    if (!title) return;
    const created = registerTask({ title, isRepeatable: false, isUserCreated: true });
    if (created) {
      setQuickTitle("");
      setMessage(`✅ 已加入任务：「${created.title}」`);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  function handleRandomTask() {
    const fastSmall = coreTodoTasks.filter(
      (task) => task.size === "SMALL" && task.priority === "FAST"
    );
    const source = fastSmall.length > 0 ? fastSmall : coreTodoTasks;
    if (source.length === 0) {
      setRandomPick(null);
      setMessage("暂无待办任务，可以去添加一个小目标。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    const pick = source[Math.floor(Math.random() * source.length)];
    setRandomPick(pick);
  }

  function handleCompleteCoreTask(task) {
    const result = completeTask(task.id);
    if (!result?.ok) {
      setMessage(result?.message || "完成失败，请稍后重试。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    setMessage(`✨ 完成「${task.title}」，奖励 +${result.rewardCoins || 0} 金币`);
    setTimeout(() => setMessage(""), 2000);
    const reflection = window.prompt("完成感想（可选）", "");
    if (reflection && task?.id) {
      addNote(reflection, { kind: "REFLECTION", relatedTaskId: task.id });
    }
  }

  function handleAddBatchPlan(groupKey, tasksInGroup) {
    addBatchPlan({
      groupKey,
      taskIds: tasksInGroup.map((task) => task.id),
      count: tasksInGroup.length,
      mode: batchMode,
    });
    setMessage("📦 已加入今日批量计划。");
    setTimeout(() => setMessage(""), 2000);
  }

  function handleBatchDismiss() {
    setBatchSuggestion(null);
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

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-slate-100">🌱 成长任务清单</h2>
            <p className="text-xs text-slate-500 mt-1">
              一键新增、自动分类，适合 ADHD 的低门槛启动模式。
            </p>
          </div>
          <div className="text-xs text-slate-400">核心系统 · LifeUP Lite</div>
        </div>

        {!coreHydrated ? (
          <div className="text-sm text-slate-500">正在加载成长任务…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={quickTitle}
                onChange={(event) => setQuickTitle(event.target.value)}
                placeholder="输入任务标题，例如：整理桌面"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleQuickAdd}
                className="rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2"
              >
                一键加入
              </button>
              <button
                type="button"
                onClick={handleRandomTask}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:text-emerald-200"
              >
                给我一个随机小任务
              </button>
            </div>

            {randomPick && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                🎯 今日推荐：{randomPick.title}（{randomPick.category} · {randomPick.priority || "FAST"}）
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-400">批量视图</div>
                <select
                  value={batchMode}
                  onChange={(event) => setBatchMode(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="category">按分类</option>
                  <option value="priority">按优先级</option>
                  <option value="tag">按标签</option>
                </select>
              </div>
              {Object.keys(batchGroups).length === 0 ? (
                <div className="text-xs text-slate-500">暂无待办任务。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(batchGroups).map(([groupKey, list]) => (
                    <div
                      key={groupKey}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>{groupKey}</span>
                        <span>{list.length} 项</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                        {list.slice(0, 5).map((task) => (
                          <span key={task.id} className="rounded-full border border-slate-700 px-2 py-0.5">
                            {task.title}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddBatchPlan(groupKey, list)}
                        className="w-full rounded-lg bg-emerald-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                      >
                        加入今日批量计划
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {dailyBatchPlan && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-100">
                今日批量计划：{dailyBatchPlan.groupKey} · {dailyBatchPlan.count} 项
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTaskTab(tab.id)}
                    className={`rounded-full border px-3 py-1 transition ${
                      taskTab === tab.id
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                        : "border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {filteredCoreTasks.length === 0 ? (
                <div className="text-sm text-slate-500">当前筛选下没有任务。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCoreTasks.map((task) => {
                    const { cleanTitle, tags } = extractTags(task.title, task.tags);
                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2"
                      >
                        <div className="text-sm text-slate-200">{cleanTitle}</div>
                        <div className="text-xs text-slate-500">
                          {task.category} · {task.priority || "FAST"} · {task.size || "SMALL"}
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-emerald-200">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {task.status !== "done" && (
                          <button
                            type="button"
                            onClick={() => handleCompleteCoreTask(task)}
                            className="w-full rounded-lg bg-emerald-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                          >
                            完成任务
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {taskTab !== "done" && coreDoneTasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">近期已完成</div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  {coreDoneTasks.slice(0, 8).map((task) => {
                    const { cleanTitle } = extractTags(task.title, task.tags);
                    return (
                      <span
                        key={task.id}
                        className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5"
                      >
                        {cleanTitle}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {diceFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-xl">
            <div className="text-sm text-slate-400">任务完成回合</div>
            <div className="mt-1 text-lg font-semibold text-slate-100">
              你完成了任务「{diceFeedback.title}」
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div>
                掷出了 🎲 {diceFeedback.diceValue} 点，前进了 {diceFeedback.boardSteps} 步
              </div>
              <div>
                你现在走到：
                {board?.tiles?.[diceFeedback.playerPosition ?? 0]?.name || "未知区域"}（第{" "}
                {(diceFeedback.playerLaps ?? 0) + 1} 圈）
              </div>
              {diceFeedback.tileEvent?.result && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200 space-y-1">
                  <div className="text-slate-300">
                    事件：{diceFeedback.tileEvent.result.description}
                  </div>
                  <div className="text-slate-400">
                    奖励：{formatTileEventReward(diceFeedback.tileEvent.result)}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDiceFeedback(null)}
              className="mt-5 w-full rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
        <div className="flex flex-wrap gap-4">
          <div>
            你：第 {(player?.laps ?? 0) + 1} 圈，第 {(player?.position ?? 0) + 1} 格
          </div>
          <div>
            影子旅伴：第 {(npc?.laps ?? 0) + 1} 圈，第 {(npc?.position ?? 0) + 1} 格
          </div>
        </div>
      </section>

      {batchSuggestion && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="text-sm font-medium text-emerald-100">🔥 连做奖励提示</div>
          <div className="text-xs text-emerald-200/80">{batchSuggestion.message}</div>
          <div className="flex flex-wrap gap-2 text-xs text-emerald-100">
            {batchSuggestion.templates.map((template) => (
              <span
                key={template.id}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5"
              >
                {template.title}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBatchAccept}
              className="rounded-lg bg-emerald-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              一键领取这些任务
            </button>
            <button
              type="button"
              onClick={handleBatchDismiss}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100"
            >
              下次再说
            </button>
          </div>
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
                  const streak = taskStreaks?.[template.id];
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
                      {streak?.count >= 3 && (
                        <div className="text-xs text-amber-300">🔥 习惯叠加中（连续 {streak.count} 天）</div>
                      )}
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
              const elapsedSeconds = task.startedAt ? Math.max(0, Math.floor((now - task.startedAt) / 1000)) : 0;
              const estimatedSeconds = Math.max(1, template.estimatedMinutes * 60);
              const progress = Math.min(elapsedSeconds / estimatedSeconds, 1);
              const ringSize = 80;
              const ringStroke = 6;
              const radius = (ringSize - ringStroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = circumference * (1 - progress);
              const streak = taskStreaks?.[template.id];
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
                  {streak?.count >= 3 && (
                    <div className="mt-2 text-xs text-amber-300">🔥 习惯叠加中（连续 {streak.count} 天）</div>
                  )}
                  {template.description && (
                    <div className="mt-2 text-xs text-slate-400">{template.description}</div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <svg width={ringSize} height={ringSize} className="text-slate-700">
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke="rgba(148,163,184,0.2)"
                          strokeWidth={ringStroke}
                          fill="none"
                        />
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke="rgba(99,102,241,0.9)"
                          strokeWidth={ringStroke}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                        />
                      </svg>
                      <div className="absolute text-[11px] text-slate-200">
                        {Math.min(100, Math.round(progress * 100))}%
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>预计时间：{formatMinutes(template.estimatedMinutes)}</div>
                      <div>已用时间：{formatMinutes(Math.round(elapsedSeconds / 60))}</div>
                    </div>
                  </div>
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
                  <div className="text-xs text-slate-500 mt-1">
                    实际用时：{formatMinutes(task.actualMinutes)}
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
