"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WorldClock from "@/components/WorldClock";
import FocusTimer from "@/components/FocusTimer";
import { useWorld } from "./worldState";
import { useGameState } from "@/state/GameStateContext";
import { COIN_TO_RMB, STAT_LIMITS } from "../game/config";
import { DEFAULT_UI_SETTINGS, loadUiSettings, UI_SETTINGS_KEY } from "../lib/uiSettings";
import { resolveDifficultyValue } from "../lib/loadTasks";
import { RESOURCES } from "@/game/config/resources";
import { ITEMS } from "@/game/config/items";

const STAT_META = [
  { key: "life", label: "生命", emoji: "❤️", color: "from-rose-400 to-red-500", max: STAT_LIMITS.life },
  { key: "sanity", label: "精神", emoji: "🧠", color: "from-violet-400 to-fuchsia-400", max: STAT_LIMITS.sanity },
  { key: "hunger", label: "饱食", emoji: "🍞", color: "from-amber-400 to-orange-400", max: STAT_LIMITS.hunger },
];

const HISTORY_LABELS = {
  task_complete: "完成任务",
  reward_spend: "支出奖励",
  ticket_use: "使用券",
  coins_adjust: "金币调整",
  exp_adjust: "经验调整",
  coins_change: "金币变动",
  history_undo: "撤销记录",
};

function formatTileEventRewards(result) {
  if (!result) return "暂无额外奖励";
  const parts = [];
  if (result.coinsDelta) {
    parts.push(`金币 +${result.coinsDelta}`);
  }
  if (result.expDelta) {
    parts.push(`EXP +${result.expDelta}`);
  }
  if (result.resourceChanges) {
    Object.entries(result.resourceChanges).forEach(([id, amount]) => {
      if (!amount) return;
      const meta = RESOURCES[id];
      parts.push(`${meta?.name || id} x${amount}`);
    });
  }
  if (result.inventoryChanges) {
    Object.entries(result.inventoryChanges).forEach(([id, amount]) => {
      if (!amount) return;
      parts.push(`${ITEMS?.[id]?.name || id} x${amount}`);
    });
  }
  return parts.length > 0 ? parts.join("，") : "暂无额外奖励";
}

export default function Page() {
  const {
    hydrated,
    stats,
    world,
    currency,
    burst,
    tasks,
    completedTasks,
    history,
    undoLastAction,
    taskConfig,
  } = useWorld();
  const {
    hydrated: survivalHydrated,
    dailyDrop,
    claimDailyDrop,
    tasks: survivalTasks,
    board,
    player,
    npc,
    tileEvents,
    spawnTaskInstance,
    worldTime,
    advanceWorldDay,
    coins: survivalCoins,
    exp: survivalExp,
    buildState,
  } = useGameState();
  const [message, setMessage] = useState("");
  const [uiSettings, setUiSettings] = useState(DEFAULT_UI_SETTINGS);
  const coinRmb = (currency.coins * COIN_TO_RMB).toFixed(1);

  useEffect(() => {
    setUiSettings(loadUiSettings());
    const handleStorage = (event) => {
      if (event.key === UI_SETTINGS_KEY) {
        setUiSettings(loadUiSettings());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const recentHistory = useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    return [...list]
      .sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0))
      .slice(0, 5);
  }, [history]);

  const recentTileEvents = useMemo(() => {
    const list = Array.isArray(tileEvents) ? tileEvents : [];
    return list.slice(0, 3);
  }, [tileEvents]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane Wilderness
          </div>
          <div className="text-lg text-slate-100">正在加载荒野世界…</div>
        </div>
      </div>
    );
  }

  function handleUndo() {
    const result = undoLastAction();
    if (result?.ok) {
      setMessage("已撤销上一条操作");
    } else {
      setMessage(result?.error || "没有可撤销的记录");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  function handleClaimDailyDrop() {
    const ok = claimDailyDrop();
    if (ok) {
      setMessage("🌊 今日漂流物已打捞完毕！");
    } else {
      setMessage("今日漂流物已打捞完毕或尚未刷新。");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  function handleAdvanceWorldDay() {
    const lastAdvanceAt = worldTime?.lastAdvanceAt;
    const now = Date.now();
    const minIntervalMs = 6 * 60 * 60 * 1000;
    if (lastAdvanceAt && now - lastAdvanceAt < minIntervalMs) {
      setMessage("距离上次推进还不到 6 小时，先好好生活一会儿吧～");
      setTimeout(() => setMessage(""), 2500);
      return;
    }
    advanceWorldDay();
    setMessage("⏳ 世界已推进到下一天。");
    setTimeout(() => setMessage(""), 2000);
  }

  const contextTemplates = useMemo(() => {
    const list = Object.values(survivalTasks?.templates || {}).filter(
      (template) => template.category === "context"
    );
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [survivalTasks?.templates]);

  function handleQuickContext(template) {
    const instance = spawnTaskInstance(template.id);
    if (!instance) {
      setMessage("该任务已在进行中或达到上限。");
    } else {
      setMessage(`🚶 已开始「${template.title}」`);
    }
    setTimeout(() => setMessage(""), 2000);
  }

  const todoTasks = tasks.filter((task) => task.status === "todo").slice(0, 5);
  const recentCompletions = completedTasks.slice(0, 4);
  const canAdvanceWorld =
    !worldTime?.lastAdvanceAt || Date.now() - worldTime.lastAdvanceAt >= 6 * 60 * 60 * 1000;
  const currentTile = board?.tiles?.[player?.position ?? 0];
  const tileCount = board?.tiles?.length || 0;
  const playerPercent = tileCount ? Math.min(100, (player?.position / tileCount) * 100) : 0;
  const npcPercent = tileCount ? Math.min(100, (npc?.position / tileCount) * 100) : 0;

  const placedSummary = useMemo(() => {
    const list = buildState?.placedStructures || [];
    const counts = list.reduce((acc, item) => {
      acc[item.itemId] = (acc[item.itemId] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return "还没有布置营地物件，去制作看看吧。";
    }
    const summary = entries
      .map(([itemId, count]) => `${ITEMS[itemId]?.name || itemId}×${count}`)
      .join("、");
    return `你已经布置了：${summary}。你的营地越来越温暖了～`;
  }, [buildState]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="text-[11px] tracking-[0.3em] uppercase text-slate-500">
          LifeUP · Arcane Wilderness
        </div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          人生 · 饥荒魔法版 LifeUP
        </h1>
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-indigo-900/40 p-4 shadow-lg shadow-slate-950/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="text-xs text-slate-500">世界时间</div>
              <div className="text-sm text-slate-200 mt-1">
                第 {worldTime?.currentDay ?? 1} 天 · 第 {(player?.laps ?? 0) + 1} 圈
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="text-xs text-slate-500">当前位置</div>
              <div className="text-sm text-slate-200 mt-1">
                {currentTile?.name || "未知区域"} · 第 {(player?.position ?? 0) + 1} 格
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="text-xs text-slate-500">生存资源</div>
              <div className="text-sm text-slate-200 mt-1">
                🪙 {survivalCoins} · ✨ EXP {survivalExp}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          {placedSummary}
        </div>
        <p className="text-sm text-slate-400 max-w-2xl">
          管理饱食、精神与生命，穿行现实日循环，用任务与事件雕刻你的荒野命运。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      <section
        className={`grid gap-4 ${uiSettings.showFocusTimer ? "lg:grid-cols-2" : "grid-cols-1"}`}
      >
        <WorldClock />
        {uiSettings.showFocusTimer && <FocusTimer />}
      </section>

      <section
        className={`grid grid-cols-1 gap-4 ${uiSettings.showStatsPanel ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}
      >
        {uiSettings.showStatsPanel && (
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4 shadow-lg shadow-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-100">🧭 玩家状态卡</h2>
              {burst?.comboCount > 1 && (
                <div className="text-xs text-emerald-300">连击 x{burst.comboCount}</div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAT_META.map((stat) => {
                const value = stats[stat.key];
                const percent = Math.min(100, Math.round((value / stat.max) * 100));
                return (
                  <div key={stat.key} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-300">
                        {stat.emoji} {stat.label}
                      </div>
                      <div className="text-lg font-semibold text-slate-100">
                        {value}/{stat.max}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stat.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-900/10 p-6 space-y-4 shadow-lg shadow-amber-900/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">当前魔力币</div>
              <div className="text-2xl font-semibold text-amber-300">{currency.coins}🪙</div>
              <div className="text-xs text-slate-500 mt-1">约等于 ¥{coinRmb}</div>
            </div>
            <Link
              href="/shop"
              className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:border-amber-300 hover:text-amber-100 transition"
            >
              去兑换
            </Link>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">今日随机事件</div>
            {world.randomEvent ? (
              <div className="mt-1">
                <div className="text-sm text-slate-200">{world.randomEvent.name}</div>
                <div className="text-xs text-slate-400 mt-1">{world.randomEvent.description}</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-2">今天还没有事件，晚点刷新看看。</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-100">🌊 今日漂流物</div>
            <div className="text-xs text-slate-500 mt-1">每天推进世界时间后，都会刷新漂流物奖励。</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClaimDailyDrop}
              disabled={!survivalHydrated || !dailyDrop || dailyDrop.claimed}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                survivalHydrated && dailyDrop && !dailyDrop.claimed
                  ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {!survivalHydrated
                ? "加载中"
                : dailyDrop
                  ? dailyDrop.claimed
                    ? "今日已打捞"
                    : "打捞漂流物"
                  : "尚未刷新"}
            </button>
            <div className="flex flex-col items-end text-xs text-slate-500">
              <button
                onClick={handleAdvanceWorldDay}
                aria-disabled={!canAdvanceWorld}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  canAdvanceWorld
                    ? "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    : "border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed"
                }`}
              >
                推进到下一天
              </button>
              <span className="mt-1">
                多数情况只需完成任务推进棋子，无需频繁手动推进。
              </span>
            </div>
          </div>
        </div>
        {survivalHydrated && dailyDrop ? (
          <div className="space-y-2 text-xs text-slate-400">
            <div>第 {dailyDrop.day} 天掉落：</div>
            <div className="flex flex-wrap gap-2">
              {dailyDrop.drops.map((drop, index) => {
                const key = `${drop.type}-${drop.id || "coins"}-${index}`;
                const label =
                  drop.type === "coins"
                    ? `🪙 金币 x${drop.amount}`
                    : drop.type === "resource"
                      ? `${RESOURCES[drop.id]?.name || drop.id} x${drop.amount}`
                      : `${ITEMS[drop.id]?.name || drop.id} x${drop.amount}`;
                return (
                  <span
                    key={key}
                    className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-slate-300"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            {survivalHydrated ? "等待下一次世界推进。" : "正在同步漂流物…"}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">状态有点糊？试试换个场景</h2>
            <div className="text-xs text-slate-500 mt-1">快速切换场景，给精神状态一点加成。</div>
          </div>
          <Link href="/tasks" className="text-xs text-violet-300 hover:text-violet-200 transition">
            更多情境任务 →
          </Link>
        </div>
        {contextTemplates.length === 0 ? (
          <div className="text-sm text-slate-500">暂无情境切换任务。</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {contextTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-2"
              >
                <div className="text-sm font-medium text-slate-100">{template.title}</div>
                <div className="text-xs text-slate-500">预计 {template.estimatedMinutes} 分钟</div>
                <button
                  type="button"
                  onClick={() => handleQuickContext(template)}
                  className="w-full rounded-lg bg-violet-500/80 hover:bg-violet-500 text-xs font-medium text-white py-2"
                >
                  一键开始
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-100">🗂 今日任务区</h2>
              <Link
                href="/tasks"
                className="text-xs text-violet-300 hover:text-violet-200 transition"
              >
                去任务大厅 →
              </Link>
            </div>
            {todoTasks.length === 0 ? (
              <div className="text-sm text-slate-500">
                暂时没有待办任务，去任务大厅领取一个新任务吧。
              </div>
            ) : (
              <div className="space-y-3">
                {todoTasks.map((task) => {
                  const template = task.templateId ? taskConfig?.[task.templateId] : null;
                  const difficultyValue = resolveDifficultyValue(
                    template?.difficulty || task.difficulty
                  );
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                    >
                      <div className="text-sm text-slate-200">{template?.name || task.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {template?.category || task.category} · 难度 {difficultyValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
            <h2 className="text-sm font-medium text-slate-100">✅ 今日进展</h2>
            {recentCompletions.length === 0 ? (
              <div className="text-sm text-slate-500">今天还没有完成任务。</div>
            ) : (
              <div className="space-y-2">
                {recentCompletions.map((entry) => {
                  const template = entry.templateId ? taskConfig?.[entry.templateId] : null;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <div className="text-sm text-slate-200">{template?.name || entry.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {entry.completedAt ? new Date(entry.completedAt).toLocaleString("zh-CN") : "完成"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href="/history"
              className="inline-flex items-center text-xs text-slate-400 hover:text-violet-200 transition"
            >
              查看全部历史 →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/30 via-slate-900/80 to-slate-950/90 p-6 space-y-4 shadow-lg shadow-slate-950/30">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-100">🎲 大富翁情报</div>
            <div className="text-xs text-slate-500">棋盘追踪</div>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-slate-400">你的位置 vs 影子旅伴</div>
            <div className="relative h-9 rounded-full border border-slate-700 bg-slate-950/70">
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-emerald-400 shadow shadow-emerald-500/40"
                style={{ left: `${playerPercent}%` }}
              />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-violet-400 shadow shadow-violet-500/40"
                style={{ left: `${npcPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>起点</span>
              <span>{tileCount} 格</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                你
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                影子旅伴
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-slate-400">最近 3 条格子事件</div>
            {recentTileEvents.length === 0 ? (
              <div className="text-xs text-slate-500">还没有触发棋盘事件，掷骰子前进看看。</div>
            ) : (
              <div className="space-y-2">
                {recentTileEvents.map((event) => (
                  <div
                    key={`${event.timestamp}-${event.tileId}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200 space-y-1"
                  >
                    <div className="text-slate-300">{event.result?.description}</div>
                    <div className="text-slate-500">奖励：{formatTileEventRewards(event.result)}</div>
                    {event.result?.rare && <div className="text-amber-300">✨ 稀有事件</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-100">🕒 最近历史 & 撤销</div>
            <div className="text-xs text-slate-500 mt-1">误点完成任务或误用券时，可以在这里撤销。</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/history"
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:border-violet-400 hover:text-violet-200 transition"
            >
              查看历史记录
            </Link>
            <button
              onClick={handleUndo}
              className="rounded-lg bg-rose-500/80 hover:bg-rose-500 px-4 py-2 text-sm font-medium text-white transition"
            >
              撤销上一步
            </button>
          </div>
        </div>

        {recentHistory.length === 0 ? (
          <div className="text-sm text-slate-500">暂无历史记录，完成任务或使用券后会出现在这里。</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentHistory.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="text-sm text-slate-200">
                  {HISTORY_LABELS[entry.type || entry.kind] || "操作记录"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {(entry.timestamp || entry.createdAt)
                    ? new Date(entry.timestamp || entry.createdAt).toLocaleString("zh-CN")
                    : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/80 via-slate-950/90 to-indigo-950/60 p-4 shadow-lg shadow-slate-950/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Link
            href="/craft"
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center text-violet-100 hover:border-violet-400 hover:bg-violet-500/20 transition"
          >
            🛠️ 制作 / 建造
          </Link>
          <Link
            href="/inventory"
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-center text-slate-200 hover:border-slate-500 hover:text-white transition"
          >
            🎒 背包
          </Link>
          <Link
            href="/history"
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-center text-slate-200 hover:border-slate-500 hover:text-white transition"
          >
            🕒 历史 / 撤销
          </Link>
          <Link
            href="/ideas"
            className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-center text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/20 transition"
          >
            💡 想法停车场
          </Link>
        </div>
      </section>
    </div>
  );
}
