"use client";

import { useMemo, useState } from "react";
import { useWorld } from "../worldState";

const CATEGORY_OPTIONS = ["认知", "清理", "体力", "社交", "工作", "娱乐", "其他"];

export default function NotesPage() {
  const {
    hydrated,
    notes,
    addNote,
    deleteNote,
    markNoteConverted,
    registerTask,
  } = useWorld();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("认知");

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId),
    [activeNoteId, notes]
  );

  function handleAddIdea() {
    const created = addNote(input, { kind: "IDEA" });
    if (!created) {
      setMessage("请输入一个想法。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    setInput("");
    setMessage("💡 想法已暂存。");
    setTimeout(() => setMessage(""), 2000);
  }

  function handleConvertNote() {
    if (!activeNote) return;
    const createdTask = registerTask({
      title: activeNote.text,
      category: selectedCategory,
      isRepeatable: true,
      isUserCreated: true,
    });
    if (createdTask) {
      markNoteConverted(activeNote.id, createdTask.id);
      setActiveNoteId(null);
      setMessage("✅ 已转成任务并加入清单。");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载感想记录…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          📝 感想与创意停车场
        </h1>
        <p className="text-sm text-slate-400">
          灵感先放这，不打断当前节奏，需要时再一键转成任务。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 space-y-4">
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

      <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 space-y-4">
        <div className="text-sm font-medium text-slate-100">想法池</div>
        {notes.filter((note) => note.kind === "IDEA").length === 0 ? (
          <div className="text-sm text-slate-500">暂时没有想法，随时可以添加。</div>
        ) : (
          <div className="space-y-3">
            {notes
              .filter((note) => note.kind === "IDEA")
              .map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2"
                >
                  <div className="text-sm text-slate-100">{note.text}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(note.createdAt).toLocaleString("zh-CN")}
                  </div>
                  {note.convertedAt ? (
                    <div className="text-xs text-emerald-300">已转成任务</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveNoteId(note.id)}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                      >
                        转成任务
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300"
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

      <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 space-y-4">
        <div className="text-sm font-medium text-slate-100">任务感想</div>
        {notes.filter((note) => note.kind === "REFLECTION").length === 0 ? (
          <div className="text-sm text-slate-500">还没有记录感想，完成任务后可以添加一句话。</div>
        ) : (
          <div className="space-y-4 text-sm text-slate-200 border-l border-slate-800 pl-4">
            {notes
              .filter((note) => note.kind === "REFLECTION")
              .map((note) => (
                <div
                  key={note.id}
                  className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                >
                  <span className="absolute -left-6 top-4 h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <div>{note.text}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(note.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {activeNote && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
          <div className="text-sm font-medium text-emerald-100">转换成任务</div>
          <div className="text-xs text-emerald-200">{activeNote.text}</div>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-lg border border-emerald-400/30 bg-slate-900/60 px-3 py-2 text-sm text-emerald-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleConvertNote}
              className="rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              确认转换
            </button>
            <button
              type="button"
              onClick={() => setActiveNoteId(null)}
              className="rounded-lg border border-emerald-400/30 bg-slate-900/60 px-4 py-2 text-sm text-emerald-100"
            >
              取消
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
