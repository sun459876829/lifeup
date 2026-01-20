"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { safeLoad, safeSave } from "@/lib/storage";

const STORAGE_KEY = "lifeup.focusTimer.v1";
const DEFAULT_TOTAL_SECONDS = 25 * 60;

function formatSeconds(value) {
  const total = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function hydrateTimerState(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      totalSeconds: DEFAULT_TOTAL_SECONDS,
      remainingSeconds: DEFAULT_TOTAL_SECONDS,
      isRunning: false,
      lastStartedAt: null,
    };
  }
  const totalSeconds = Number(raw.totalSeconds) || DEFAULT_TOTAL_SECONDS;
  const remainingSeconds = Number(raw.remainingSeconds);
  return {
    totalSeconds,
    remainingSeconds: Number.isFinite(remainingSeconds)
      ? Math.max(0, Math.min(remainingSeconds, totalSeconds))
      : totalSeconds,
    isRunning: Boolean(raw.isRunning),
    lastStartedAt: raw.lastStartedAt || null,
  };
}

export default function FocusTimer() {
  const [timer, setTimer] = useState(() =>
    hydrateTimerState({
      totalSeconds: DEFAULT_TOTAL_SECONDS,
      remainingSeconds: DEFAULT_TOTAL_SECONDS,
      isRunning: false,
      lastStartedAt: null,
    })
  );
  const [message, setMessage] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const stored = safeLoad(STORAGE_KEY, null);
    if (stored) {
      setTimer(hydrateTimerState(stored));
    }
  }, []);

  useEffect(() => {
    safeSave(STORAGE_KEY, timer);
  }, [timer]);

  useEffect(() => {
    if (!timer.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (!prev.isRunning) return prev;
        const lastStartedAt = prev.lastStartedAt || Date.now();
        const elapsed = Math.floor((Date.now() - lastStartedAt) / 1000);
        if (elapsed <= 0) return prev;
        const nextRemaining = Math.max(prev.remainingSeconds - elapsed, 0);
        if (nextRemaining === 0) {
          setMessage("✅ 本轮专注结束！");
          return {
            ...prev,
            remainingSeconds: 0,
            isRunning: false,
            lastStartedAt: null,
          };
        }
        return {
          ...prev,
          remainingSeconds: nextRemaining,
          lastStartedAt: Date.now(),
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isRunning]);

  const progress = useMemo(() => {
    if (!timer.totalSeconds) return 0;
    return Math.round(((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100);
  }, [timer.remainingSeconds, timer.totalSeconds]);

  function handleStart() {
    setMessage("");
    setTimer((prev) => {
      if (prev.isRunning) return prev;
      const nextRemaining = prev.remainingSeconds > 0 ? prev.remainingSeconds : prev.totalSeconds;
      return {
        ...prev,
        remainingSeconds: nextRemaining,
        isRunning: true,
        lastStartedAt: Date.now(),
      };
    });
  }

  function handlePause() {
    setTimer((prev) => {
      if (!prev.isRunning) return prev;
      const lastStartedAt = prev.lastStartedAt || Date.now();
      const elapsed = Math.floor((Date.now() - lastStartedAt) / 1000);
      const nextRemaining = Math.max(prev.remainingSeconds - elapsed, 0);
      return {
        ...prev,
        remainingSeconds: nextRemaining,
        isRunning: false,
        lastStartedAt: null,
      };
    });
  }

  function handleReset() {
    setMessage("");
    setTimer((prev) => ({
      ...prev,
      remainingSeconds: prev.totalSeconds,
      isRunning: false,
      lastStartedAt: null,
    }));
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 tracking-[0.2em] uppercase">专注计时器</div>
          <div className="mt-2 text-3xl font-semibold text-slate-100">
            {formatSeconds(timer.remainingSeconds)}
          </div>
          <div className="mt-1 text-xs text-slate-500">默认 25 分钟 · 进度 {progress}%</div>
        </div>
        <div className="h-14 w-14 rounded-full border border-slate-700 flex items-center justify-center text-sm text-slate-300">
          {progress}%
        </div>
      </div>
      {message && <div className="mt-3 text-xs text-emerald-300">{message}</div>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs font-medium py-2 transition"
        >
          开始
        </button>
        <button
          type="button"
          onClick={handlePause}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 transition"
        >
          暂停
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-medium py-2 transition"
        >
          重置
        </button>
      </div>
    </div>
  );
}
