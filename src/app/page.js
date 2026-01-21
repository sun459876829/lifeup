"use client";

import Link from "next/link";
import { useMemo } from "react";
import MagicWorldClock from "@/components/MagicWorldClock";
import DailyOverviewCards from "@/components/DailyOverviewCards";
import MonopolyBoard from "@/components/MonopolyBoard";
import TreasureMapProgress from "@/components/TreasureMapProgress";
import { useWorld } from "./worldState";
import { useGameState } from "@/state/GameStateContext";
import { getTodayKey } from "@/game/time";

const QUICK_LINKS = [
  { href: "/tasks", label: "任务大厅", emoji: "📜" },
  { href: "/attributes", label: "属性面板", emoji: "🧬" },
  { href: "/shop", label: "商店", emoji: "🛒" },
  { href: "/achievements", label: "成就", emoji: "🏆" },
  { href: "/timer", label: "番茄钟", emoji: "⏳" },
  { href: "/notes", label: "感想", emoji: "📝" },
  { href: "/settings", label: "设置", emoji: "⚙️" },
];

export default function HomePage() {
  const { now, world, tasks, completedTasks, timerSessions } = useWorld();
  const { exp, coins, player } = useGameState();

  const nowDate = now ? new Date(now) : new Date();
  const level = Math.max(1, Math.floor((exp || 0) / 100) + 1);
  const todayKey = getTodayKey();

  const dailyStats = useMemo(() => {
    const currentDay = world?.day ?? 0;
    const todayCompleted = (completedTasks || []).filter((task) => task.day === currentDay);
    const expToday = todayCompleted.reduce((sum, task) => sum + (task.exp || 0), 0);
    const coinsToday = todayCompleted.reduce((sum, task) => sum + (task.coins || 0), 0);
    const pomodoroCount = (timerSessions || []).filter(
      (session) => session?.endedAt && getTodayKey(session.endedAt) === todayKey
    ).length;
    const completedDays = new Set((completedTasks || []).map((task) => task.day));
    let streak = 0;
    let cursor = currentDay;
    while (completedDays.has(cursor)) {
      streak += 1;
      cursor -= 1;
    }

    return {
      todoCount: (tasks || []).filter((task) => task.status !== "done").length,
      doneCount: todayCompleted.length,
      expToday: Math.max(0, Math.round(expToday)),
      coinsToday: Math.max(0, Math.round(coinsToday)),
      pomodoroCount,
      streakDays: streak,
    };
  }, [completedTasks, tasks, timerSessions, todayKey, world?.day]);

  return (
    <main className="min-h-screen space-y-10 pb-8">
      <section className="space-y-3">
        <div className="text-xs uppercase tracking-[0.35em] text-slate-500">LifeUP · Arcane</div>
        <h1 className="text-3xl font-semibold text-slate-50">🔮 人生养成任务仪表盘</h1>
        <p className="text-sm text-slate-400">
          一眼掌握当前时间、日常任务进度与成长路径。金币 {coins ?? 0}，等级 {level}。
        </p>
      </section>

      <MagicWorldClock
        now={nowDate}
        gameDay={(world?.day ?? 0) + 1}
        level={level}
        exp={exp || 0}
        stageLabel={`第 ${(world?.day ?? 0) + 1} 天 · Lv.${level}`}
      />

      <DailyOverviewCards
        todoCount={dailyStats.todoCount}
        doneCount={dailyStats.doneCount}
        expToday={dailyStats.expToday}
        coinsToday={dailyStats.coinsToday}
        pomodoroCount={dailyStats.pomodoroCount}
        streakDays={dailyStats.streakDays}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonopolyBoard position={player?.position ?? 0} />
        <TreasureMapProgress level={level} />
      </section>

      <section className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 shadow-lg">
        <div className="text-sm font-medium text-slate-100">✨ 快速入口</div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-200"
            >
              <span>{link.emoji}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
