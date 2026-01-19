"use client";

import { useMemo, useRef, useState } from "react";
import TimerRing from "@/components/TimerRing";

function formatElapsed(value) {
  const total = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function TimerPage() {
  const timerRef = useRef(null);
  const [taskTitle, setTaskTitle] = useState("荒野专注任务");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualMinutes, setActualMinutes] = useState(0);
  const [status, setStatus] = useState("准备就绪");

  const elapsedLabel = useMemo(() => formatElapsed(elapsedSeconds), [elapsedSeconds]);

  function handleStart() {
    timerRef.current?.start(25);
    setElapsedSeconds(0);
    setActualMinutes(0);
    setStatus("计时进行中");
  }

  function handlePause() {
    timerRef.current?.pause();
    setStatus("已暂停");
  }

  function handleResume() {
    timerRef.current?.resume();
    setStatus("计时进行中");
  }

  function handleStop() {
    timerRef.current?.stop();
    setElapsedSeconds(0);
    setActualMinutes(0);
    setStatus("已结束");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <div className="text-xs tracking-[0.35em] uppercase text-violet-200/60">Arcane Timer</div>
          <h1 className="text-3xl font-semibold text-slate-100">魔法计时仪</h1>
          <p className="text-sm text-slate-400">聚焦你的任务节奏，记录实际投入时间。</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <TimerRing
            ref={timerRef}
            title="荒野魔法时钟"
            onTick={({ elapsedSeconds: nextElapsed }) => setElapsedSeconds(nextElapsed)}
            onFinish={({ actualMinutes: minutes }) => {
              setActualMinutes(minutes);
              setStatus("计时完成");
            }}
          />

          <div className="rounded-2xl border border-violet-500/20 bg-slate-950/70 p-6 shadow-[0_0_25px_rgba(124,58,237,0.25)] space-y-4">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-violet-200/70">当前任务</div>
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                className="w-full rounded-lg border border-violet-500/20 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-400">状态</div>
              <div className="text-lg text-violet-200">{status}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-400">已用时间</div>
              <div className="text-2xl font-semibold text-slate-100">{elapsedLabel}</div>
            </div>
            <div className="text-xs text-emerald-300">
              实际记录 {actualMinutes > 0 ? `${actualMinutes} 分钟` : "等待完成"}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-lg bg-violet-500/90 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-500"
              >
                开始计时
              </button>
              <button
                type="button"
                onClick={handlePause}
                className="rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                暂停
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="rounded-lg bg-emerald-500/90 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500"
              >
                继续
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="rounded-lg bg-rose-500/90 py-2 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-500"
              >
                结束
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
