"use client";

import { useMemo, useState } from "react";
import { useGameState } from "@/state/GameStateContext";

const CATEGORY_OPTIONS = [
  "learning",
  "cleaning",
  "work",
  "health",
  "context",
  "english",
  "explore",
  "other",
];

const DIFFICULTY_OPTIONS = ["tiny", "small", "medium", "large", "huge"];

const DIFFICULTY_MINUTES = {
  tiny: 5,
  small: 10,
  medium: 20,
  large: 40,
  huge: 60,
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function IdeasPage() {
  const {
    hydrated,
    parkedIdeas,
    addParkedIdea,
    deleteParkedIdea,
    markIdeaConverted,
    registerTaskTemplates,
    spawnTaskInstance,
  } = useGameState();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [activeIdeaId, setActiveIdeaId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("learning");
  const [selectedDifficulty, setSelectedDifficulty] = useState("small");

  const activeIdea = useMemo(
    () => parkedIdeas.find((idea) => idea.id === activeIdeaId),
    [activeIdeaId, parkedIdeas]
  );

  function handleAddIdea() {
    const idea = addParkedIdea(input);
    if (!idea) {
      setMessage("请输入一个想法。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    setInput("");
    setMessage("💡 想法已暂存。");
    setTimeout(() => setMessage(""), 2000);
  }

  function handleDeleteIdea(ideaId) {
    deleteParkedIdea(ideaId);
    setMessage("已删除该想法。");
    setTimeout(() => setMessage(""), 2000);
  }

  function handleConvertIdea() {
    if (!activeIdea) return;
    const templateId = `idea_${newId()}`;
    const minutes = DIFFICULTY_MINUTES[selectedDifficulty] || 10;
    const template = {
      id: templateId,
      title: activeIdea.text,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      repeatable: true,
      estimatedMinutes: minutes,
      description: "来自想法停车场",
    };
    registerTaskTemplates({ [templateId]: template });
    spawnTaskInstance(templateId);
    markIdeaConverted(activeIdea.id, templateId);
    setActiveIdeaId(null);
    setMessage("✅ 已转成任务并加入当前任务。");
    setTimeout(() => setMessage(""), 2000);
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载想法停车场…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          💡 想法停车场
        </h1>
        <p className="text-sm text-slate-400">
          灵感先放这，不打断当前节奏。需要时再一键转成任务。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <div className="text-sm font-medium text-slate-100">暂存一个想法</div>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="写下突然冒出的想法…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="button"
            onClick={handleAddIdea}
            className="rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2"
          >
            暂存想法
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        <div className="text-sm font-medium text-slate-100">已暂存的想法</div>
        {parkedIdeas.length === 0 ? (
          <div className="text-sm text-slate-500">暂时没有想法，随时可以添加。</div>
        ) : (
          <div className="space-y-3">
            {parkedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2"
              >
                <div className="text-sm text-slate-100">{idea.text}</div>
                <div className="text-xs text-slate-500">
                  {new Date(idea.createdAt).toLocaleString("zh-CN")}
                </div>
                {idea.convertedAt ? (
                  <div className="text-xs text-emerald-300">已转成任务</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveIdeaId(idea.id)}
                      className="rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-xs font-medium px-3 py-1.5"
                    >
                      转成任务
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {activeIdea && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 space-y-4">
          <div className="text-sm font-medium text-violet-100">将想法转成任务</div>
          <div className="text-xs text-violet-200">{activeIdea.text}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-xs text-slate-300">
              分类
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              难度
              <select
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConvertIdea}
              className="rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2"
            >
              创建并开始任务
            </button>
            <button
              type="button"
              onClick={() => setActiveIdeaId(null)}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300"
            >
              取消
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
