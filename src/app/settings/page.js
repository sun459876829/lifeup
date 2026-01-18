"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorld } from "../worldState";
import { formatDateTime } from "@/components/WorldClock";
import { getGameStartDate, getNow, setGameStartDate } from "@/game/time";
import { DEFAULT_UI_SETTINGS, loadUiSettings, saveUiSettings } from "@/lib/uiSettings";

export default function SettingsPage() {
  const { now, todayKey, dayIndex, refreshTime } = useWorld();
  const [gameStartDate, setGameStartDateState] = useState(null);
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI_SETTINGS);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setGameStartDateState(getGameStartDate());
    setUiSettings(loadUiSettings());
  }, []);

  function handleResetStartDate() {
    const confirmed = window.confirm("确定要将游戏开始日期重置为今天吗？这会让当前变为第 0 天。");
    if (!confirmed) return;
    const nextDate = setGameStartDate(getNow());
    setGameStartDateState(nextDate);
    refreshTime();
    setNotice("已将游戏开始日期重置为今天（第 0 天）");
    setTimeout(() => setNotice(""), 3000);
  }

  function toggleSetting(key) {
    setUiSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveUiSettings(next);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <h1 className="mt-1 text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
            ⚙️ 魔法控制台 · 设置
          </h1>
          <p className="mt-1 text-sm text-slate-400">调整世界时间与界面偏好，让节奏更适合你。</p>
        </div>
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 hover:border-violet-400 hover:text-violet-200 transition"
        >
          ← 返回首页
        </Link>
      </header>

      {notice && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div>
          <h2 className="text-sm font-medium text-slate-100">⏳ 时间相关设置</h2>
          <p className="text-xs text-slate-500 mt-1">世界时间完全依赖真实日期，不支持手动刷天。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs text-slate-500">当前现实时间</div>
            <div className="text-sm text-slate-200 mt-1">{formatDateTime(now)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs text-slate-500">todayKey</div>
            <div className="text-sm text-slate-200 mt-1">{todayKey}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs text-slate-500">当前游戏日</div>
            <div className="text-sm text-slate-200 mt-1">第 {dayIndex} 天</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-xs text-slate-500">游戏开始日期</div>
          <div className="text-sm text-slate-200 mt-1">
            {gameStartDate ? formatDateTime(gameStartDate) : "--"}
          </div>
          <button
            type="button"
            onClick={handleResetStartDate}
            className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:border-rose-300 hover:text-rose-100 transition"
          >
            重置游戏开始日期为今天
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div>
          <h2 className="text-sm font-medium text-slate-100">🪄 界面显示选项</h2>
          <p className="text-xs text-slate-500 mt-1">按需隐藏信息，让首页更清爽。</p>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div>
              <div className="text-sm text-slate-200">显示玩家状态卡</div>
              <div className="text-xs text-slate-500">生命/精神/饱食度的高阶统计面板</div>
            </div>
            <input
              type="checkbox"
              checked={uiSettings.showStatsPanel}
              onChange={() => toggleSetting("showStatsPanel")}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div>
              <div className="text-sm text-slate-200">显示专注计时器</div>
              <div className="text-xs text-slate-500">首页右侧的番茄钟卡片</div>
            </div>
            <input
              type="checkbox"
              checked={uiSettings.showFocusTimer}
              onChange={() => toggleSetting("showFocusTimer")}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
