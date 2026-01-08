"use client";

import { useEffect, useMemo, useState } from "react";

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
export default function Page() {
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
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28 }}>LifeUP · SE 系统</h1>

      <div style={{ margin: "12px 0" }}>
        💰 金币：<b>{wallet.coins}</b>
      </div>

      {/* add task */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入一个任务"
          style={{ flex: 1, padding: 10 }}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button onClick={addTask}>新增</button>
      </div>

      {/* tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => (
          <li
            key={t.id}
            style={{
              padding: 10,
              border: "1px solid #eee",
              borderRadius: 10,
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                textDecoration: t.status === "done" ? "line-through" : "none",
                opacity: t.status === "done" ? 0.6 : 1,
              }}
            >
              {t.title}
            </span>
            {t.status !== "done" && (
              <button onClick={() => completeTask(t.id)}>完成</button>
            )}
          </li>
        ))}
      </ul>

      {/* shop */}
      <h3>🛒 商店</h3>
      <button onClick={() => redeem("休息30分钟券", 15)}>
        休息30分钟 · 15
      </button>{" "}
      <button onClick={() => redeem("奶茶券", 25)}>奶茶券 · 25</button>

      {/* gacha */}
      <h3 style={{ marginTop: 16 }}>🎰 抽奖</h3>
      <button onClick={drawGacha}>10 金币 抽一次</button>

      {/* claims */}
      <h3 style={{ marginTop: 16 }}>🎁 我的奖励</h3>
      {claims.map((c) => (
        <div key={c.id} style={{ opacity: c.used ? 0.5 : 1 }}>
          {c.name}（{c.from}）
        </div>
      ))}

      <div style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
        v0.3 · LifeUP SE · localStorage · 无登录
      </div>
    </main>
  );
}
