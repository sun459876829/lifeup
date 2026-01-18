"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useWorld } from "../worldState";
import { calculateReward } from "../../game/config";

const CATEGORY_OPTIONS = [
  { value: "study", label: "学习", kind: "study" },
  { value: "money", label: "工作赚钱", kind: "money" },
  { value: "life", label: "生活整理", kind: "life" },
  { value: "body", label: "运动身体", kind: "body" },
  { value: "social", label: "社交", kind: "social" },
  { value: "misc", label: "其他", kind: "misc" },
];

const DIFFICULTY_OPTIONS = [
  { value: 1, label: "1 · 超轻松" },
  { value: 2, label: "2 · 普通" },
  { value: 3, label: "3 · 有点难" },
  { value: 4, label: "4 · 挑战" },
  { value: 5, label: "5 · 史诗任务" },
];

function resolveCategoryKind(category) {
  return CATEGORY_OPTIONS.find((option) => option.value === category)?.kind || "misc";
}

export default function CustomTasksPage() {
  const { hydrated, registerTask } = useWorld();
  const titleRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    category: "",
    difficulty: "",
    minutes: "30",
    notes: "",
  });
  const [feedback, setFeedback] = useState(null);

  const rewardPreview = useMemo(() => {
    const minutesValue = Number(form.minutes);
    const difficultyValue = Number(form.difficulty);
    if (!minutesValue || !difficultyValue) return null;
    return calculateReward({
      difficulty: difficultyValue,
      minutes: minutesValue,
      kind: resolveCategoryKind(form.category),
      comboCount: 1,
    });
  }, [form.category, form.difficulty, form.minutes]);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setFeedback({ type: "error", text: "请先填写任务标题。" });
      return;
    }
    if (!form.category) {
      setFeedback({ type: "error", text: "请选择任务分类。" });
      return;
    }

    const minutesValue = Number(form.minutes);
    const difficultyValue = Number(form.difficulty);

    if (!minutesValue || minutesValue < 5 || minutesValue > 180) {
      setFeedback({ type: "error", text: "时长建议填写 5～180 分钟。" });
      return;
    }
    if (!difficultyValue || difficultyValue < 1 || difficultyValue > 5) {
      setFeedback({ type: "error", text: "请选择任务难度。" });
      return;
    }

    const preview = calculateReward({
      difficulty: difficultyValue,
      minutes: minutesValue,
      kind: resolveCategoryKind(form.category),
      comboCount: 1,
    });

    const created = registerTask({
      title,
      category: form.category,
      notes: form.notes.trim(),
      difficulty: difficultyValue,
      minutes: minutesValue,
      kind: resolveCategoryKind(form.category),
      exp: preview.exp,
      coinsReward: preview.coins,
      rewardPreview: { coins: preview.coins, exp: preview.exp },
      isRepeatable: true,
      isUserCreated: true,
    });

    if (created) {
      setFeedback({
        type: "success",
        text: `创建成功：${created.title}`,
        reward: preview,
      });
      setForm({
        title: "",
        category: "",
        difficulty: "",
        minutes: "30",
        notes: "",
      });
    }
  }

  function handleCreateAnother() {
    setFeedback(null);
    titleRef.current?.focus();
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载自定义任务…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🧩 自定义任务
        </h1>
        <p className="text-sm text-slate-400">
          在这里可以为现实生活中的事情创建新任务，选难度、时长，系统自动计算奖励。
        </p>
      </header>

      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-100"
              : "bg-rose-500/20 border-rose-500/40 text-rose-100"
          }`}
        >
          <div className="font-medium">{feedback.text}</div>
          {feedback.type === "success" && feedback.reward && (
            <div className="mt-2 text-xs text-emerald-200">
              奖励预览：{feedback.reward.coins} coin，{feedback.reward.exp} EXP（当前连击可能进一步提高）
            </div>
          )}
          {feedback.type === "success" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateAnother}
                className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
              >
                再创建一个
              </button>
              <Link
                href="/tasks"
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200"
              >
                返回任务列表
              </Link>
            </div>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs text-slate-400" htmlFor="task-title">
                标题（必填）
              </label>
              <input
                id="task-title"
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="例如：整理桌面 30 分钟"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-slate-400" htmlFor="task-category">
                  分类
                </label>
                <select
                  id="task-category"
                  value={form.category}
                  onChange={(event) => handleChange("category", event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  required
                >
                  <option value="">请选择分类</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400" htmlFor="task-minutes">
                  预估时长（分钟）
                </label>
                <input
                  id="task-minutes"
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  value={form.minutes}
                  onChange={(event) => handleChange("minutes", event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-slate-400" htmlFor="task-difficulty">
                  难度（1～5）
                </label>
                <select
                  id="task-difficulty"
                  value={form.difficulty}
                  onChange={(event) => handleChange("difficulty", event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  required
                >
                  <option value="">选择难度</option>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400" htmlFor="task-notes">
                  备注（可选）
                </label>
                <textarea
                  id="task-notes"
                  value={form.notes}
                  onChange={(event) => handleChange("notes", event.target.value)}
                  placeholder="补充说明、注意事项…"
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium py-2 transition"
            >
              创建任务
            </button>
          </form>

          <aside className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 h-fit">
            <div className="text-xs text-slate-400">预计奖励预览</div>
            {rewardPreview ? (
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <div className="text-base font-semibold">
                  {rewardPreview.coins} coin · {rewardPreview.exp} EXP
                </div>
                <div className="text-xs text-slate-400">当前连击可能进一步提高。</div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">选择难度与时长后显示预估奖励。</div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
