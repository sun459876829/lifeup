"use client";

import { useEffect, useMemo, useState } from "react";

const TASKS_KEY = "lifeup.tasks.v1";
const CHECKIN_KEY = "lifeup.checkin.v1";

function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localMidnightFromKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function diffDays(dateKey1, dateKey2) {
  const t1 = localMidnightFromKey(dateKey1).getTime();
  const t2 = localMidnightFromKey(dateKey2).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((t2 - t1) / msPerDay);
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
  } catch {
    // ignore
  }
}

export default function Page() {
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [hydrated, setHydrated] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const [checkin, setCheckin] = useState({
    lastDateKey: null,
    streak: 0,
  });

  // 读取本地数据
  useEffect(() => {
    const loadedTasks = safeLoad(TASKS_KEY, []);
    const normalizedTasks = Array.isArray(loadedTasks)
      ? loadedTasks
          .filter((x) => x && typeof x.title === "string")
          .map((x) => ({
            id: typeof x.id === "string" ? x.id : crypto.randomUUID(),
            title: x.title,
            done: Boolean(x.done),
          }))
      : [];
    setTasks(normalizedTasks);

    const loadedCheckin = safeLoad(CHECKIN_KEY, {});
    setCheckin({
      lastDateKey: typeof loadedCheckin.lastDateKey === "string" ? loadedCheckin.lastDateKey : null,
      streak: Number.isFinite(loadedCheckin.streak) ? Math.max(0, Number(loadedCheckin.streak)) : 0,
    });

    setHydrated(true);
  }, []);

  // 写入本地数据
  useEffect(() => {
    if (!hydrated) return;
    safeSave(TASKS_KEY, tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    safeSave(CHECKIN_KEY, checkin);
  }, [checkin, hydrated]);

  const checkedInToday = hydrated && checkin.lastDateKey === todayKey;

  function doCheckin() {
    if (!hydrated) return;
    if (checkin.lastDateKey === todayKey) return;

    let nextStreak = 1;

    if (checkin.lastDateKey) {
      const delta = diffDays(checkin.lastDateKey, todayKey);
      nextStreak = delta === 1 ? checkin.streak + 1 : 1;
    }

    setCheckin({
      lastDateKey: todayKey,
      streak: nextStreak,
    });
  }

  const points = useMemo(() => {
    const taskPoints = tasks.filter((t) => t.done).length * 10;
    const checkinPoints = checkedInToday ? 5 : 0;
    return taskPoints + checkinPoints;
  }, [tasks, checkedInToday]);

  function addTask() {
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [{ id: crypto.randomUUID(), title: t, done: false }, ...prev]);
    setTitle("");
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>今天目标：完成 3 个任务</div>

      <h1 style={{ fontSize: 28, marginBottom: 6 }}>LifeUP（MVP）</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button
          onClick={doCheckin}
          disabled={!hydrated || checkedInToday}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #111",
            background: checkedInToday ? "#eee" : "#111",
            color: checkedInToday ? "#666" : "#fff",
            cursor: checkedInToday ? "not-allowed" : "pointer",
          }}
        >
          {checkedInToday ? "今日已签到" : "签到 +5"}
        </button>

        <div style={{ opacity: 0.8 }}>
          连续 {hydrated ? checkin.streak : "—"} 天
          <span style={{ marginLeft: 10, opacity: 0.7, fontSize: 12 }}>（今天：{todayKey}）</span>
        </div>
      </div>

      <div style={{ marginBottom: 16, opacity: 0.85 }}>
        积分：<b>{points}</b>（完成一个任务 +10；今日签到 +5）
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入一个任务，比如：背10个单词"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
        />
        <button
          onClick={addTask}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          新增
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {tasks.map((t) => (
          <li
            key={t.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 14,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
            <div
              style={{
                flex: 1,
                textDecoration: t.done ? "line-through" : "none",
                opacity: t.done ? 0.6 : 1,
              }}
            >
              {t.title}
            </div>
            <button
              onClick={() => removeTask(t.id)}
              style={{
                border: "1px solid #ddd",
                background: "transparent",
                padding: "6px 10px",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>
          先加一个任务试试。数据会保存在本地浏览器（localStorage）。
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        v0.2 · LifeUP MVP · 数据：localStorage（无登录 / 无数据库）
      </div>
    </main>
  );
}
