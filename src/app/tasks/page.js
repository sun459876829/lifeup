"use client";

import { useEffect, useState } from "react";

/** ============ localStorage keys ============ */
const TASKS_KEY = "lifeup.tasks.v2";
const WALLET_KEY = "lifeup.wallet.v1";
const LEDGER_KEY = "lifeup.ledger.v1";
const CLAIMS_KEY = "lifeup.claims.v1";
const DAILY_KEY = "lifeup.daily.v1";

/** ============ utils ============ */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** ============ main ============ */
export default function TasksPage() {
  const [hydrated, setHydrated] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const [wallet, setWallet] = useState({ coins: 0 });
  const [ledger, setLedger] = useState([]);
  const [claims, setClaims] = useState([]);
  const [daily, setDaily] = useState({ date: "", bonusGiven: false });

  /** ===== load ===== */
  useEffect(() => {
    setTasks(safeLoad(TASKS_KEY, []));
    setWallet(safeLoad(WALLET_KEY, { coins: 0 }));
    setLedger(safeLoad(LEDGER_KEY, []));
    setClaims(safeLoad(CLAIMS_KEY, []));
    setDaily(safeLoad(DAILY_KEY, { date: "", bonusGiven: false }));
    setHydrated(true);
  }, []);

  /** ===== save ===== */
  useEffect(() => {
    if (!hydrated) return;
    safeSave(TASKS_KEY, tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    safeSave(WALLET_KEY, wallet);
    safeSave(LEDGER_KEY, ledger);
    safeSave(CLAIMS_KEY, claims);
    safeSave(DAILY_KEY, daily);
  }, [wallet, ledger, claims, daily, hydrated]);

  /** ===== helpers ===== */
  function earn(amount, reason) {
    setWallet((w) => ({ coins: w.coins + amount }));
    setLedger((l) => [
      {
        id: crypto.randomUUID(),
        type: "earn",
        amount,
        reason,
        at: Date.now(),
      },
      ...l,
    ]);
  }

  function spend(amount, reason) {
    if (wallet.coins < amount) return false;
    setWallet((w) => ({ coins: w.coins - amount }));
    setLedger((l) => [
      {
        id: crypto.randomUUID(),
        type: "spend",
        amount,
        reason,
        at: Date.now(),
      },
      ...l,
    ]);
    return true;
  }

  /** ===== tasks ===== */
  function addTask() {
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        title: t,
        status: "todo",
        difficulty: "M",
        estMinutes: 10,
      },
      ...prev,
    ]);
    setTitle("");
  }

  function completeTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    );

    // 完成奖励（完成给多）
    earn(6, "complete_task");

    // 每日首次完成任务 +2
    const today = todayKey();
    if (daily.date !== today || !daily.bonusGiven) {
      earn(2, "daily_first_complete");
      setDaily({ date: today, bonusGiven: true });
    }
  }

  /** ===== shop ===== */
  function redeem(name, cost) {
    if (!spend(cost, "redeem")) return;
    setClaims((c) => [
      {
        id: crypto.randomUUID(),
        name,
        used: false,
        from: "shop",
      },
      ...c,
    ]);
  }

  /** ===== gacha ===== */
  function drawGacha() {
    if (!spend(10, "gacha")) return;

    const r = Math.random();
    let reward = "休息10分钟券";
    if (r > 0.95) reward = "美甲基金券";
    else if (r > 0.7) reward = "奶茶券";

    setClaims((c) => [
      {
        id: crypto.randomUUID(),
        name: reward,
        used: false,
        from: "gacha",
      },
      ...c,
    ]);
  }

  /** ===== ui ===== */
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
          LifeUP · Arcane World
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">
          LifeUP · SE 系统
        </h1>
        <p className="text-sm text-slate-400">
          任务、金币、奖励与抽奖中心，记录你的每日冒险。
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-[0_0_40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              金库
            </div>
            <div className="mt-2 text-lg font-semibold text-amber-200">
              💰 {wallet.coins} 金币
            </div>
          </div>
          <div className="text-xs text-slate-500">
            完成任务可获得金币，抽奖与商店会消耗金币。
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
        <div className="text-sm font-semibold text-slate-200">新增任务</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入一个任务"
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button
            onClick={addTask}
            className="rounded-xl bg-violet-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            新增
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-slate-200">任务列表</div>
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4"
            >
              <span
                className={`text-sm ${
                  t.status === "done"
                    ? "text-slate-500 line-through"
                    : "text-slate-100"
                }`}
              >
                {t.title}
              </span>
              {t.status !== "done" && (
                <button
                  onClick={() => completeTask(t.id)}
                  className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/20"
                >
                  完成
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
        <div className="text-sm font-semibold text-slate-200">🛒 商店</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={() => redeem("休息30分钟券", 15)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400/60 hover:text-violet-200"
          >
            休息30分钟 · 15
          </button>
          <button
            onClick={() => redeem("奶茶券", 25)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400/60 hover:text-violet-200"
          >
            奶茶券 · 25
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
        <div className="text-sm font-semibold text-slate-200">🎰 抽奖</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={drawGacha}
            className="rounded-xl bg-amber-500/80 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-400"
          >
            10 金币 抽一次
          </button>
          <span className="text-xs text-slate-500">
            奖励含休息券 / 奶茶券 / 美甲基金券
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
        <div className="text-sm font-semibold text-slate-200">🎁 我的奖励</div>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {claims.length === 0 && (
            <div className="text-slate-500">暂无奖励，先完成任务吧。</div>
          )}
          {claims.map((c) => (
            <div
              key={c.id}
              className={c.used ? "opacity-50" : "opacity-100"}
            >
              {c.name}（{c.from}）
            </div>
          ))}
        </div>
      </section>

      <div className="text-xs text-slate-500">
        v0.3 · LifeUP SE · localStorage · 无登录
      </div>
    </div>
  );
}
