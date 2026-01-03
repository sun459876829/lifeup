
"use client";


import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lifeup_tasks_v1";

export default function Page() {
  const CHECKIN_KEY = "lifeup_checkin_v1";
const TODAY = new Date().toDateString();

  const [tasks, setTasks] = useState([]);
  const [checkin, setCheckin] = useState({ lastDate: "", streak: 0 });

  const [title, setTitle] = useState("");

  // 读取本地数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKIN_KEY);
      if (raw) setCheckin(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkin));
    } catch {}
  }, [checkin]);
    
  // 写入本地数据
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);
  function doCheckin() {
    if (checkin.lastDate === TODAY) return;
  
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isStreak = checkin.lastDate === yesterday;
  
    setCheckin({
      lastDate: TODAY,
      streak: isStreak ? checkin.streak + 1 : 1,
    });
  
    // 签到加 5 分
    setTasks((prev) => [...prev]);
  }
  
  const points = useMemo(() => {
    const taskPoints = tasks.filter((t) => t.done).length * 10;
    const checkinPoints = checkin.streak > 0 ? 5 : 0;
    return taskPoints + checkinPoints;
  }, [tasks, checkin]);
  

  function addTask() {
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [
      { id: crypto.randomUUID(), title: t, done: false },
      ...prev,
    ]);
    setTitle("");
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (

    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
  今天目标：完成 3 个任务
</div>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>LifeUP（MVP）</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
  <button
    onClick={doCheckin}
    disabled={checkin.lastDate === TODAY}
    style={{
      padding: "6px 12px",
      borderRadius: 8,
      border: "1px solid #111",
      background: checkin.lastDate === TODAY ? "#eee" : "#111",
      color: checkin.lastDate === TODAY ? "#666" : "#fff",
      cursor: "pointer",
    }}
  >
    {checkin.lastDate === TODAY ? "今日已签到" : "签到 +5"}
  </button>
  <div style={{ opacity: 0.8 }}>连续 {checkin.streak} 天</div>
</div>

      <div style={{ marginBottom: 16, opacity: 0.85 }}>
        积分：<b>{points}</b>（完成一个任务 +10）
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
    </main>
  );
}
