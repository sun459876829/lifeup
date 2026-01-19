"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

function formatTime(value) {
  const total = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const TimerRing = forwardRef(function TimerRing(
  { onFinish, onTick, title = "奥术计时器" },
  ref
) {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStartedAt, setLastStartedAt] = useState(null);
  const [actualMinutes, setActualMinutes] = useState(0);
  const intervalRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      start(durationMinutes) {
        const parsedMinutes = Number(durationMinutes);
        const safeMinutes = Number.isFinite(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : 1;
        const nextDurationSeconds = Math.max(1, Math.round(safeMinutes * 60));
        setDurationSeconds(nextDurationSeconds);
        setRemainingSeconds(nextDurationSeconds);
        setIsRunning(true);
        setLastStartedAt(Date.now());
        setActualMinutes(0);
      },
      pause() {
        setRemainingSeconds((prevRemaining) => {
          if (!isRunning) return prevRemaining;
          const elapsed = Math.floor((Date.now() - (lastStartedAt || Date.now())) / 1000);
          return Math.max(prevRemaining - elapsed, 0);
        });
        setIsRunning(false);
        setLastStartedAt(null);
      },
      resume() {
        setIsRunning((prev) => {
          if (prev || remainingSeconds <= 0) return prev;
          setLastStartedAt(Date.now());
          return true;
        });
      },
      stop() {
        setIsRunning(false);
        setLastStartedAt(null);
        setRemainingSeconds(durationSeconds);
        setActualMinutes(0);
      },
    }),
    [durationSeconds, isRunning, lastStartedAt, remainingSeconds]
  );

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prevRemaining) => {
        if (!isRunning) return prevRemaining;
        const elapsed = Math.floor((Date.now() - (lastStartedAt || Date.now())) / 1000);
        if (elapsed <= 0) return prevRemaining;
        const nextRemaining = Math.max(prevRemaining - elapsed, 0);
        const elapsedSeconds = Math.max(durationSeconds - nextRemaining, 0);
        onTick?.({
          elapsedSeconds,
          remainingSeconds: nextRemaining,
          progress: durationSeconds ? elapsedSeconds / durationSeconds : 0,
        });

        if (nextRemaining === 0) {
          const minutesSpent = Math.max(1, Math.ceil(elapsedSeconds / 60));
          setActualMinutes(minutesSpent);
          setIsRunning(false);
          setLastStartedAt(null);
          onFinish?.({ actualMinutes: minutesSpent, actualSeconds: elapsedSeconds });
        } else {
          setLastStartedAt(Date.now());
        }

        return nextRemaining;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [durationSeconds, isRunning, lastStartedAt, onFinish, onTick]);

  const progress = useMemo(() => {
    if (!durationSeconds) return 0;
    return (durationSeconds - remainingSeconds) / durationSeconds;
  }, [durationSeconds, remainingSeconds]);

  const ringSize = 220;
  const ringStroke = 12;
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <div className="relative rounded-[32px] border border-violet-500/20 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-violet-950/80 p-6 shadow-[0_0_35px_rgba(139,92,246,0.35)] overflow-hidden">
      <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute -top-16 -left-12 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl animate-breath" />
      <div className="absolute -bottom-20 -right-8 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl animate-breath" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="text-xs uppercase tracking-[0.4em] text-violet-200/70">{title}</div>
        <div className="relative">
          <svg width={ringSize} height={ringSize} className="drop-shadow-[0_0_20px_rgba(167,139,250,0.45)]">
            <defs>
              <linearGradient id="arcaneGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="rgba(148,163,184,0.18)"
              strokeWidth={ringStroke}
              fill="none"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="url(#arcaneGradient)"
              strokeWidth={ringStroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-semibold text-slate-100">
              {formatTime(remainingSeconds || durationSeconds)}
            </div>
            <div className="mt-1 text-xs text-violet-200/70">进度 {Math.round(progress * 100)}%</div>
            {actualMinutes > 0 && (
              <div className="mt-2 text-[11px] text-emerald-300">已记录 {actualMinutes} 分钟</div>
            )}
          </div>
        </div>
        <div className="text-xs text-violet-200/70">
          {isRunning ? "咒术运转中" : "等待启动"}
        </div>
      </div>
      <style jsx>{`
        @keyframes breath {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.9;
          }
        }
        .animate-breath {
          animation: breath 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});

export default TimerRing;
