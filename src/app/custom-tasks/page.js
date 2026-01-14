"use client";

import { useMemo, useState } from "react";
import { computeRewardsForTask } from "../gameConfig/customTaskRewards";
import { useWorld } from "../worldState";

const CATEGORY_OPTIONS = [
  { label: "生活", value: "life", category: "life" },
  { label: "购物", value: "shopping", category: "other" },
  { label: "工作", value: "work", category: "future" },
  { label: "学习", value: "study", category: "course" },
  { label: "情绪", value: "emotion", category: "other" },
  { label: "其他", value: "other", category: "other" },
];

const SIZE_OPTIONS = [
  { label: "小任务", value: "small" },
  { label: "中任务", value: "medium" },
  { label: "大任务", value: "large" },
];

const SIZE_LABELS = Object.fromEntries(SIZE_OPTIONS.map((item) => [item.value, item.label]));
const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.value, item.label])
);

function formatSanity(effect) {
  const value = effect?.sanity ?? 0;
  const prefix = value >= 0 ? "+" : "";
  return `🧠 ${prefix}${value}`;
}

export default function CustomTasksPage() {
  const { hydrated, tasks, registerTask, removeTask } = useWorld();
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState(CATEGORY_OPTIONS[0].value);
  const [size, setSize] = useState("small");
  const [difficulty, setDifficulty] = useState(3);
  const [isRepeatable, setIsRepeatable] = useState(true);
  const [message, setMessage] = useState("");

  const rewards = useMemo(
    () => computeRewardsForTask({ size, difficulty }),
    [size, difficulty]
  );

  const userTasks = useMemo(
    () => tasks.filter((task) => task.isUserCreated),
    [tasks]
  );

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("请填写任务名称。");
      return;
    }

    if (!rewards) {
      setMessage("请选择任务体量与难度。");
      return;
    }

    const categoryOption = CATEGORY_OPTIONS.find((option) => option.value === categoryKey);

    const created = registerTask({
      title: trimmedTitle,
      category: categoryOption?.category || "other",
      customCategoryLabel: categoryOption?.label || "其他",
      size,
      difficulty,
      isRepeatable,
      isUserCreated: true,
      exp: rewards.exp,
      coinsReward: rewards.coinsReward,
      effect: rewards.effect,
    });

    if (created) {
      setTitle("");
      setCategoryKey(CATEGORY_OPTIONS[0].value);
      setSize("small");
      setDifficulty(3);
      setIsRepeatable(true);
      setMessage(`已创建任务：${created.title}`);
      return;
    }

    setMessage("创建任务失败，请稍后重试。");
  }

  function handleRemove(taskId) {
    removeTask(taskId);
    setMessage("任务已删除。");
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在打开自定义任务工坊…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🧪 自定义任务工坊
        </h1>
        <p className="text-sm text-slate-400">
          这里适合加：临时要去买东西、回消息、做一个小决定这种一小步任务。
        </p>
        <p className="text-xs text-slate-500">大任务可以拆成多个小任务来创建。</p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-5">
        <h2 className="text-sm font-medium text-slate-100">🪄 创建临时任务</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-slate-300">
              任务名称（必填）
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：买水果 / 回一封邮件"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              分类
              <select
                value={categoryKey}
                onChange={(event) => setCategoryKey(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 text-sm text-slate-300">
              任务体量
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSize(option.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      size === option.value
                        ? "bg-violet-500/30 text-violet-100 border-violet-500/60"
                        : "bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-2 text-sm text-slate-300">
              难度
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 mt-7">
              <input
                type="checkbox"
                checked={isRepeatable}
                onChange={(event) => setIsRepeatable(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-500 focus:ring-violet-500/40"
              />
              是否可重复
            </label>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="text-xs text-slate-400">预览奖励</div>
            {rewards ? (
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span>EXP {rewards.exp}</span>
                <span>🪙 {rewards.coinsReward}</span>
                <span>{formatSanity(rewards.effect)}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-500">选择体量与难度即可预览奖励。</div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition"
          >
            创建任务
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🧾 我的自定义任务</h2>
        {userTasks.length === 0 ? (
          <div className="text-sm text-slate-500">还没有自定义任务，先创建一个试试吧。</div>
        ) : (
          <div className="space-y-3">
            {userTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-200">{task.title}</div>
                    <div className="text-xs text-slate-500">
                      {task.customCategoryLabel ||
                        CATEGORY_LABELS[task.category] ||
                        task.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(task.id)}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20 transition"
                  >
                    删除
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{SIZE_LABELS[task.size] || task.size || "未设置体量"}</span>
                  <span>难度 {task.difficulty || "-"}</span>
                  <span>EXP {task.exp}</span>
                  <span>🪙 {task.coinsReward}</span>
                  <span>{formatSanity(task.effect)}</span>
                  {task.isRepeatable && <span>🔁 可重复</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
