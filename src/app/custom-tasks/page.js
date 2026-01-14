"use client";

import { useMemo, useState } from "react";
import { useWorld } from "../worldState";
import { computeRewardsForTask, CUSTOM_TASK_SIZES } from "../gameConfig/customTaskRewards";

const CATEGORY_OPTIONS = [
  { label: "生活", value: "life" },
  { label: "购物", value: "other" },
  { label: "工作", value: "future" },
  { label: "学习", value: "course" },
  { label: "情绪", value: "other" },
  { label: "其他", value: "other" },
];

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5];

function formatSanity(effect) {
  if (!effect?.sanity) return "🧠 +0";
  const prefix = effect.sanity > 0 ? "+" : "";
  return `🧠 ${prefix}${effect.sanity}`;
}

function formatSizeLabel(sizeKey) {
  return CUSTOM_TASK_SIZES.find((item) => item.key === sizeKey)?.label || sizeKey;
}

export default function CustomTasksPage() {
  const { hydrated, tasks, registerTask, removeTask } = useWorld();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [size, setSize] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isRepeatable, setIsRepeatable] = useState(true);
  const [message, setMessage] = useState("");

  const rewardPreview = useMemo(() => {
    if (!size || !difficulty) return null;
    return computeRewardsForTask({ size, difficulty });
  }, [size, difficulty]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载自定义任务工坊…</div>
        </div>
      </div>
    );
  }

  const customTasks = tasks.filter((task) => task.isUserCreated);

  function handleCategoryChange(event) {
    const value = event.target.value;
    const selectedLabel = event.target.options[event.target.selectedIndex]?.text || "";
    setCategory(value);
    setCategoryLabel(selectedLabel && selectedLabel !== "请选择分类" ? selectedLabel : "");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setMessage("请先填写任务名称。");
      return;
    }
    if (!size || !difficulty) {
      setMessage("请选择任务体量和难度。");
      return;
    }

    const rewards = computeRewardsForTask({ size, difficulty });
    if (!rewards) {
      setMessage("奖励计算失败，请检查输入。");
      return;
    }

    const created = registerTask({
      title: title.trim(),
      category: category || "other",
      customCategory: categoryLabel || "其他",
      size,
      difficulty: Number(difficulty),
      isRepeatable,
      isUserCreated: true,
      exp: rewards.exp,
      coinsReward: rewards.coinsReward,
      effect: rewards.effect,
    });

    if (created) {
      setMessage(`✅ 已创建任务：${created.title}`);
      setTitle("");
      setCategory("");
      setCategoryLabel("");
      setSize("");
      setDifficulty("");
      setIsRepeatable(true);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🧩 自定义任务工坊
        </h1>
        <p className="text-sm text-slate-400">
          这里适合加：临时要去买东西、回消息、做一个小决定这种一小步任务。
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-slate-100">✨ 创建一个新任务</h2>
          <p className="text-xs text-slate-500">大任务可以拆成多个小任务来创建。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400">任务名称（必填）</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：去超市买牛奶"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">分类（可选）</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="">请选择分类</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={`${option.label}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">任务体量</label>
            <div className="grid grid-cols-3 gap-3">
              {CUSTOM_TASK_SIZES.map((option) => (
                <label
                  key={option.key}
                  className={`flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    size === option.key
                      ? "border-violet-500/60 bg-violet-500/20 text-violet-100"
                      : "border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={option.key}
                    checked={size === option.key}
                    onChange={() => setSize(option.key)}
                    className="hidden"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">难度</label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="">请选择难度</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="repeatable"
              type="checkbox"
              checked={isRepeatable}
              onChange={(event) => setIsRepeatable(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950"
            />
            <label htmlFor="repeatable" className="text-xs text-slate-400">
              是否可重复（默认开启）
            </label>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
            <div className="text-xs text-slate-400">预览奖励</div>
            {rewardPreview ? (
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span>EXP {rewardPreview.exp}</span>
                <span>🪙 {rewardPreview.coinsReward}</span>
                <span>{formatSanity(rewardPreview.effect)}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-500">请选择体量与难度后显示预览。</div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium px-3 py-2 transition"
          >
            创建任务
          </button>
        </form>

        {message && (
          <div className="rounded-lg border border-violet-500/40 bg-violet-500/20 px-3 py-2 text-sm text-violet-100">
            {message}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">🗂 我的自定义任务</h2>
        {customTasks.length === 0 ? (
          <div className="text-sm text-slate-500">还没有自定义任务，先创建一个吧。</div>
        ) : (
          <div className="space-y-3">
            {customTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{task.title}</div>
                    <div className="text-xs text-slate-500">
                      {task.customCategory || task.category} · {formatSizeLabel(task.size)} · 难度 {task.difficulty}
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                  >
                    删除
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>EXP {task.exp}</span>
                  <span>🪙 {task.coinsReward}</span>
                  <span>{formatSanity(task.effect)}</span>
                  <span>{task.isRepeatable ? "🔁 可重复" : "一次性"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
