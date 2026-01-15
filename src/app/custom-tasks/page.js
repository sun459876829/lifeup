"use client";

import { useMemo, useState } from "react";
import { useWorld } from "../worldState";
import { computeRewardsForTask, TASK_SIZE_OPTIONS } from "../gameConfig/taskRewards";

const CATEGORY_OPTIONS = [
  { value: "life", label: "生活" },
  { value: "other", label: "购物" },
  { value: "course", label: "学习" },
  { value: "future", label: "工作" },
  { value: "other", label: "情绪" },
  { value: "other", label: "其他" },
];

const SIZE_LABELS = TASK_SIZE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatSanity(effect) {
  if (!effect?.sanity) return "🧠 0";
  return `🧠 ${effect.sanity > 0 ? "+" : ""}${effect.sanity}`;
}

export default function CustomTasksPage() {
  const { hydrated, tasks, registerTask, removeTask } = useWorld();
  const [form, setForm] = useState({
    title: "",
    category: "",
    size: "",
    difficulty: "",
    isRepeatable: true,
  });
  const [message, setMessage] = useState("");

  const preview = useMemo(
    () =>
      computeRewardsForTask({
        size: form.size,
        difficulty: form.difficulty,
        category: form.category || "other",
        isUserCreated: true,
      }),
    [form.size, form.difficulty, form.category]
  );

  const customTasks = useMemo(
    () => tasks.filter((task) => task.isUserCreated),
    [tasks]
  );

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setMessage("请先填写任务名称");
      return;
    }
    if (!form.size || !form.difficulty) {
      setMessage("请选择任务体量与难度");
      return;
    }

    const reward = computeRewardsForTask({
      size: form.size,
      difficulty: form.difficulty,
      category: form.category || "other",
      isUserCreated: true,
    });

    const created = registerTask({
      title: form.title.trim(),
      category: form.category || "other",
      isRepeatable: form.isRepeatable,
      exp: reward.exp,
      coinsReward: reward.coinsReward,
      effect: reward.effect,
      isUserCreated: true,
      size: form.size,
      difficulty: Number(form.difficulty),
    });

    if (created) {
      setMessage(`已创建任务：${created.title}`);
      setForm({
        title: "",
        category: "",
        size: "",
        difficulty: "",
        isRepeatable: true,
      });
    }
  }

  function handleDelete(taskId) {
    removeTask(taskId);
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载任务工坊…</div>
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
        <h2 className="text-sm font-medium text-slate-100">📝 创建任务</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs text-slate-400" htmlFor="task-title">
              任务名称（必填）
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="例如：去买水果 / 回重要消息"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-400" htmlFor="task-category">
                分类（可选）
              </label>
              <select
                id="task-category"
                value={form.category}
                onChange={(event) => handleChange("category", event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
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
              <span className="text-xs text-slate-400">任务体量</span>
              <div className="flex flex-wrap gap-2">
                {TASK_SIZE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`px-3 py-1.5 rounded-full text-xs border transition cursor-pointer ${
                      form.size === option.value
                        ? "bg-violet-500/30 border-violet-400 text-violet-100"
                        : "bg-slate-900/70 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="task-size"
                      value={option.value}
                      checked={form.size === option.value}
                      onChange={(event) => handleChange("size", event.target.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-400" htmlFor="task-difficulty">
                难度（1~5）
              </label>
              <select
                id="task-difficulty"
                value={form.difficulty}
                onChange={(event) => handleChange("difficulty", event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                <option value="">选择难度</option>
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400">是否可重复</span>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isRepeatable}
                  onChange={(event) => handleChange("isRepeatable", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
                />
                默认可重复
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-xs text-slate-400">预览奖励</div>
            {form.size && form.difficulty ? (
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-200">
                <span>预计 EXP {preview.exp}</span>
                <span>预计金币 {preview.coinsReward}</span>
                <span>预计精神 {formatSanity(preview.effect)}</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">选择体量与难度后显示预估奖励。</div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium py-2 transition"
          >
            创建任务
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-100">📌 我的自定义任务</h2>
        {customTasks.length === 0 ? (
          <div className="text-sm text-slate-500">暂时还没有自定义任务。</div>
        ) : (
          <div className="space-y-3">
            {customTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{task.title}</div>
                    <div className="text-xs text-slate-500">
                      {task.category || "其他"} · {SIZE_LABELS[task.size] || "-"} · 难度 {task.difficulty || "-"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="text-xs text-rose-300 hover:text-rose-200"
                  >
                    删除
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
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
