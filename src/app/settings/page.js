"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorld } from "../worldState";
import { useGameState } from "@/state/GameStateContext";
import { formatDateTime } from "@/components/WorldClock";
import {
  canAdvanceGameDay,
  getGameDayKey,
  getGameStartDate,
  getNow,
  getTodayKey,
  setGameDayKey,
  setGameStartDate,
} from "@/game/time";
import { DEFAULT_UI_SETTINGS, loadUiSettings, saveUiSettings } from "@/lib/uiSettings";
import { ECONOMY_SETTINGS_KEY, DEFAULT_COINS_PER_YUAN } from "@/game/config/economy";
import { HISTORY_STORAGE_KEY } from "@/game/history";

export default function SettingsPage() {
  const { now, todayKey, dayIndex, refreshTime, settings, updateCoinsPerYuan } = useWorld();
  const { addCoins, advanceWorldDay, movePlayer } = useGameState();
  const [gameStartDate, setGameStartDateState] = useState(null);
  const [gameDayKey, setGameDayKeyState] = useState("");
  const [coinsPerYuan, setCoinsPerYuan] = useState(settings?.coinsPerYuan ?? DEFAULT_COINS_PER_YUAN);
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI_SETTINGS);
  const [notice, setNotice] = useState("");
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    setGameStartDateState(getGameStartDate());
    setGameDayKeyState(getGameDayKey());
    setUiSettings(loadUiSettings());
    setDevMode(localStorage.getItem("devMode") === "true");
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "devMode") {
        setDevMode(event.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    setCoinsPerYuan(settings?.coinsPerYuan ?? DEFAULT_COINS_PER_YUAN);
  }, [settings]);

  function handleResetStartDate() {
    const confirmed = window.confirm("确定要将游戏开始日期重置为今天吗？这会让当前变为第 0 天。");
    if (!confirmed) return;
    const nextDate = setGameStartDate(getNow());
    setGameStartDateState(nextDate);
    refreshTime();
    setNotice("已将游戏开始日期重置为今天（第 0 天）");
    setTimeout(() => setNotice(""), 3000);
  }

  function handleSyncGameDay() {
    const now = getNow();
    if (!canAdvanceGameDay(now)) {
      setNotice("当前仍是同一天，无法推进游戏日。");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    const nextKey = setGameDayKey(getTodayKey(now));
    setGameDayKeyState(nextKey);
    setNotice("已同步到新的现实日期。");
    setTimeout(() => setNotice(""), 3000);
  }

  function handleCoinsPerYuanSave() {
    updateCoinsPerYuan(coinsPerYuan);
    setNotice("已更新金币换算设置。");
    setTimeout(() => setNotice(""), 3000);
  }

  function handleExportData() {
    const keys = [
      "lifeup.arcane.v4",
      HISTORY_STORAGE_KEY,
      ECONOMY_SETTINGS_KEY,
      "lifeup.gameStartDate.v1",
      "lifeup.gameDayKey.v1",
      "lifeup.uiSettings.v1",
    ];
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      data: keys.reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifeup-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImportData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed?.data || typeof parsed.data !== "object") {
          setNotice("导入失败：备份文件格式错误。");
          return;
        }
        const confirmed = window.confirm("导入会覆盖当前数据，确定继续吗？");
        if (!confirmed) return;
        Object.entries(parsed.data).forEach(([key, value]) => {
          if (typeof value === "string") {
            localStorage.setItem(key, value);
          } else if (value === null) {
            localStorage.removeItem(key);
          }
        });
        window.location.reload();
      } catch (error) {
        setNotice("导入失败：无法解析备份文件。");
      }
    };
    reader.readAsText(file);
  }

  function toggleSetting(key) {
    setUiSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveUiSettings(next);
      return next;
    });
  }

  function resetAll() {
    const confirmed = window.confirm("确定要清空所有本地数据吗？此操作不可撤销。");
    if (!confirmed) return;
    localStorage.clear();
    window.location.reload();
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
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="text-xs text-slate-500">当前游戏日 key</div>
          <div className="text-sm text-slate-200 mt-1">{gameDayKey || "--"}</div>
          <button
            type="button"
            onClick={handleSyncGameDay}
            className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-300 hover:text-emerald-100 transition"
          >
            同步到今天（仅现实日期变更后可用）
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div>
          <h2 className="text-sm font-medium text-slate-100">💰 经济与奖励设置</h2>
          <p className="text-xs text-slate-500 mt-1">仅影响显示与自我参考，不会影响现实账本。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <label className="text-xs text-slate-400" htmlFor="coins-per-yuan">
              金币换算（金币 ≈ 1 元）
            </label>
            <input
              id="coins-per-yuan"
              type="number"
              min={1}
              value={coinsPerYuan}
              onChange={(event) => setCoinsPerYuan(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <button
            type="button"
            onClick={handleCoinsPerYuanSave}
            className="rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            保存
          </button>
        </div>
        <div className="text-xs text-slate-500">
          当前换算：{settings?.coinsPerYuan ?? DEFAULT_COINS_PER_YUAN} 金币 ≈ 1 元
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div>
          <h2 className="text-sm font-medium text-slate-100">🧳 数据备份</h2>
          <p className="text-xs text-slate-500 mt-1">导出/导入本地数据，防止误删。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400 hover:text-emerald-200 transition"
          >
            导出数据
          </button>
          <label className="rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400 hover:text-emerald-200 transition cursor-pointer">
            导入数据
            <input type="file" accept="application/json" className="hidden" onChange={handleImportData} />
          </label>
        </div>
        <div className="text-xs text-slate-500">导入会覆盖当前数据，请谨慎操作。</div>
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

      {devMode && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 space-y-4 shadow-lg shadow-rose-950/30">
          <div>
            <h2 className="text-sm font-medium text-rose-100">🧪 开发者测试区</h2>
            <p className="text-xs text-rose-200/80 mt-1">
              仅 devMode=true 时显示，用于测试大富翁与建造逻辑。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <button
              type="button"
              onClick={() => addCoins(100, "dev_tool")}
              className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-rose-100 hover:bg-rose-500/30 transition"
            >
              +100 金币
            </button>
            <button
              type="button"
              onClick={() => addCoins(500, "dev_tool")}
              className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-rose-100 hover:bg-rose-500/30 transition"
            >
              +500 金币
            </button>
            <button
              type="button"
              onClick={() => advanceWorldDay()}
              className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-rose-100 hover:bg-rose-500/30 transition"
            >
              推进到下一天（测试用）
            </button>
            <button
              type="button"
              onClick={() => movePlayer(5)}
              className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-rose-100 hover:bg-rose-500/30 transition"
            >
              移动我前进 5 格（测试）
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-rose-300/50 bg-rose-500/30 px-3 py-2 text-rose-50 hover:bg-rose-500/40 transition md:col-span-2"
            >
              重置全部数据（清空 localStorage）
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
