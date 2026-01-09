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
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function formatTime(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** ============ main ============ */
export default function Page() {
  const [hydrated, setHydrated] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const [wallet, setWallet] = useState({ coins: 0 });
  const [ledger, setLedger] = useState([]);
  const [claims, setClaims] = useState([]);
  const [daily, setDaily] = useState({ date: "", bonusGiven: false });
  const [lastGachaReward, setLastGachaReward] = useState(null);

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
    if (amount <= 0) return;
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
    if (wallet.coins < amount) {
      window.alert("金币不够哦，先完成一个小任务试试～");
      return false;
    }
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
        status: "todo", // todo / done
      },
      ...prev,
    ]);
    setTitle("");
  }

  function completeTask(id) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id && t.status !== "done" ? { ...t, status: "done" } : t
      )
    );

    // 完成奖励（完成给多）
    earn(6, "完成任务");

    // 每日首次完成任务 +2
    const today = todayKey();
    if (daily.date !== today || !daily.bonusGiven) {
      earn(2, "今日首次完成任务奖励");
      setDaily({ date: today, bonusGiven: true });
    }
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  /** ===== shop ===== */
  function redeem(name, cost) {
    if (!spend(cost, `兑换：${name}`)) return;
    setClaims((c) => [
      {
        id: crypto.randomUUID(),
        name,
        used: false,
        from: "shop",
      },
      ...c,
    ]);
    window.alert(`兑换成功：${name} ✅`);
  }

  /** ===== gacha ===== */
  function drawGacha() {
    if (!spend(10, "扭蛋抽奖")) return;

    const r = Math.random();
    let reward = "休息10分钟券 🍵";
    if (r > 0.97) reward = "美甲基金券 💅（自己定个金额）";
    else if (r > 0.8) reward = "奶茶券 🧋";

    setClaims((c) => [
      {
        id: crypto.randomUUID(),
        name: reward,
        used: false,
        from: "gacha",
      },
      ...c,
    ]);
    setLastGachaReward(reward);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-sm opacity-70 animate-pulse">
          LifeUP 加载中…
        </div>
      </main>
    );
  }

  const todoTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const recentLedger = ledger.slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 space-y-6">
        {/* header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <span>🎮 LifeUP · 游戏人生</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              做一点点小事，拿一点点金币，把人生当成一局游戏在玩。
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 px-3 py-1">
              <span className="text-lg">🪙</span>
              <span className="text-sm font-semibold text-yellow-300">
                {wallet.coins}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              今日首次完成任务奖励：
              {daily.date === todayKey() && daily.bonusGiven ? (
                <span className="text-emerald-300 ml-1">已领取 +2</span>
              ) : (
                <span className="text-slate-300 ml-1">未领取</span>
              )}
            </div>
          </div>
        </header>

        {/* input / quick tips */}
        <section className="space-y-3">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入一个超小任务，比如：拿快递 / 丢垃圾 / 写一句笔记"
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button
              onClick={addTask}
              className="shrink-0 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-sm font-medium px-3 py-2 transition"
            >
              新增
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            建议只加
            <span className="text-slate-200 mx-1">1-5 分钟</span>
            的超小任务：越小越容易启动。
          </p>
        </section>

        {/* tasks */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1">
              <span>✅ 任务列表</span>
              <span className="text-[10px] text-slate-500">
                （完成一个 +6 金币，今日第一次额外 +2）
              </span>
            </h2>
            <span className="text-[11px] text-slate-500">
              未完成 {todoTasks.length} · 已完成 {doneTasks.length}
            </span>
          </div>

          {tasks.length === 0 && (
            <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl px-3 py-3">
              现在列表是空的，可以先加三个超简单的任务，比如：
              <span className="text-slate-300">
                「洗一个杯子」「丢一袋垃圾」「写一句 Eddie 要说的话」。
              </span>
            </div>
          )}

          <ul className="space-y-2">
            {todoTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="text-sm text-slate-100">{t.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => completeTask(t.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-slate-900 font-medium transition active:scale-95"
                  >
                    完成 +6
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}

            {doneTasks.length > 0 && (
              <li className="mt-1">
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer select-none">
                    已完成的任务（{doneTasks.length}）
                  </summary>
                  <ul className="mt-1 space-y-1">
                    {doneTasks.map((t) => (
                      <li
                        key={t.id}
                        className="text-[11px] text-slate-500 line-through px-2"
                      >
                        · {t.title}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            )}
          </ul>
        </section>

        {/* shop & gacha */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* shop */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-1">
              <span>🛒 商店</span>
              <span className="text-[10px] text-slate-500">
                用金币换自己想要的小奖励
              </span>
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-800/70 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">
                    休息30分钟券 🛋
                  </div>
                  <div className="text-[11px] text-slate-400">
                    完全允许摆烂，休息不扣分。
                  </div>
                </div>
                <button
                  onClick={() => redeem("休息30分钟券 🛋", 15)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold transition active:scale-95"
                >
                  15 🪙
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-800/70 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">
                    奶茶券 🧋
                  </div>
                  <div className="text-[11px] text-slate-400">
                    给自己一点真正的物理奖励。
                  </div>
                </div>
                <button
                  onClick={() => redeem("奶茶券 🧋", 25)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-pink-400 hover:bg-pink-300 text-slate-900 font-semibold transition active:scale-95"
                >
                  25 🪙
                </button>
              </div>
            </div>
          </div>

          {/* gacha */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-1">
              <span>🎰 扭蛋机</span>
              <span className="text-[10px] text-slate-500">
                10 金币一抽，完全看脸
              </span>
            </h2>
            <button
              onClick={drawGacha}
              className="w-full mt-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold py-2.5 shadow hover:brightness-110 active:scale-95 transition"
            >
              抽一次 · 10 🪙
            </button>
            <p className="text-[11px] text-slate-400">
              掉落示例：奶茶券 🧋、休息券 🛋、美甲基金券 💅。
            </p>
            {lastGachaReward && (
              <div className="mt-1 text-[11px] text-slate-200">
                最近抽到：<span className="font-semibold">{lastGachaReward}</span>
              </div>
            )}
          </div>
        </section>

        {/* rewards & ledger */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* claims */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
            <h2 className="text-sm font-semibold flex items-center gap-1">
              <span>🎁 我的奖励</span>
            </h2>
            {claims.length === 0 && (
              <div className="text-[11px] text-slate-500">
                还没有奖励，可以先抽一发扭蛋或者兑换一张休息券。
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {claims.map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] rounded-full bg-slate-800 px-2.5 py-1 text-slate-100"
                >
                  {c.name}
                  <span className="ml-1 text-slate-400 text-[10px]">
                    {c.from === "shop" ? "商店" : "扭蛋"}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* ledger */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
            <h2 className="text-sm font-semibold flex items-center gap-1">
              <span>📜 最近记录</span>
            </h2>
            {recentLedger.length === 0 && (
              <div className="text-[11px] text-slate-500">
                还没有记录，等你完成第一个小任务。
              </div>
            )}
            <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
              {recentLedger.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {r.type === "earn" ? "➕" : "➖"} {r.reason}
                  </span>
                  <span className="text-slate-400">
                    {r.type === "earn" ? "+" : "-"}
                    {r.amount} · {formatTime(r.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* footer */}
        <footer className="pt-1 border-t border-slate-800/60 mt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>v0.4 · LifeUP SE · 本地存储 · 无登录</span>
            <span>建议：当成小玩具就好，不用逼自己。</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
