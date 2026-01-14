"use client";

import { useState } from "react";
import { useMagicWorld } from "../magicWorldContext";
import { PROJECTS, getProjectName } from "@/lib/state";

// 商店奖励（简化版，只显示休息券和奶茶券）
const SHOP_REWARDS = [
  { id: "rest", name: "😴 休息券", price: 50, description: "给自己一个完全放松的休息日" },
  { id: "milktea", name: "🧋 奶茶券", price: 20, description: "奖励自己一杯好喝的奶茶" },
];

const TASK_TYPES = [
  { value: "oneoff", label: "一次性", emoji: "✓" },
  { value: "repeat", label: "可重复", emoji: "🔄" },
  { value: "project", label: "项目推进", emoji: "📜" },
];

// 灵感任务模板池
const INSPIRATION_POOLS = {
  study: [
    { title: "背 10 个单词", minutes: 10 },
    { title: "读 5 页书", minutes: 15 },
    { title: "写 5 行英文日记", minutes: 10 },
    { title: "看一个英语视频 5 分钟", minutes: 5 },
    { title: "复习昨天的笔记", minutes: 10 },
    { title: "做一道练习题", minutes: 15 },
  ],
  body: [
    { title: "做 10 个深蹲", minutes: 3 },
    { title: "拉伸 5 分钟", minutes: 5 },
    { title: "走路 10 分钟", minutes: 10 },
    { title: "做 20 个俯卧撑", minutes: 5 },
    { title: "做 1 分钟平板支撑", minutes: 1 },
    { title: "原地踏步 5 分钟", minutes: 5 },
  ],
  life: [
    { title: "丢一袋垃圾", minutes: 3 },
    { title: "整理桌子 5 分钟", minutes: 5 },
    { title: "把水杯洗了", minutes: 2 },
    { title: "叠一下衣服", minutes: 5 },
    { title: "给植物浇水", minutes: 3 },
    { title: "清理一个抽屉", minutes: 10 },
  ],
  social: [
    { title: "给一个朋友发一条消息", minutes: 5 },
    { title: "回复一条积压很久的信息", minutes: 5 },
    { title: "给家人打个电话", minutes: 10 },
    { title: "给朋友点个赞或评论", minutes: 3 },
  ],
};

const INSPIRATION_CATEGORIES = [
  { value: "study", label: "学习", emoji: "📚" },
  { value: "body", label: "健身", emoji: "💪" },
  { value: "life", label: "生活整理", emoji: "🏠" },
  { value: "social", label: "社交", emoji: "💬" },
];

export default function TasksPage() {
  const { hydrated, tasks, wallet, claims, addTask, completeTask, redeem, drawGacha } =
    useMagicWorld();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("oneoff");
  const [projectId, setProjectId] = useState("");
  const [estMinutes, setEstMinutes] = useState("");
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [message, setMessage] = useState("");
  const [inspirationCategory, setInspirationCategory] = useState("study");

  function handleAddTask() {
    if (!taskTitle.trim()) return;

    const taskData = {
      title: taskTitle.trim(),
      type: taskType,
      projectId: taskType === "project" ? projectId : undefined,
      estMinutes: estMinutes ? parseInt(estMinutes) : undefined,
    };

    addTask(taskData);
    setMessage(`✨ 已添加任务：「${taskTitle.trim()}」`);
    setTaskTitle("");
    setEstMinutes("");
    if (taskType === "project") {
      setProjectId("");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  function handleCompleteTask(taskId) {
    const result = completeTask(taskId);
    if (result) {
      const { rewardCoins, rewardXp, levelUps } = result;
      let msg = `✨ 完成任务，获得 ${rewardCoins}🪙 + ${rewardXp}XP`;
      if (levelUps && levelUps.length > 0) {
        msg += `，升级到 Lv.${levelUps[levelUps.length - 1]}！`;
      }
      setMessage(msg);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handlePurchaseReward(reward) {
    const result = redeem(reward.name, reward.price);
    if (result.success) {
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(""), result.success ? 2000 : 3000);
  }

  function handleLottery() {
    const result = drawGacha();
    if (result) {
      setMessage(result.message);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handleGenerateInspiration() {
    // 如果没有选择类别，随机一个
    const category = inspirationCategory || Object.keys(INSPIRATION_POOLS)[Math.floor(Math.random() * Object.keys(INSPIRATION_POOLS).length)];
    const pool = INSPIRATION_POOLS[category];
    
    if (!pool || pool.length === 0) return;

    // 随机选择一个任务模板
    const template = pool[Math.floor(Math.random() * pool.length)];

    // 生成任务
    const taskData = {
      title: template.title,
      type: "oneoff",
      estMinutes: template.minutes,
    };

    addTask(taskData);
    const categoryLabel = INSPIRATION_CATEGORIES.find((c) => c.value === category)?.label || category;
    setMessage(`✨ 已生成灵感任务：「${template.title}」（${categoryLabel}）`);
    setTimeout(() => setMessage(""), 2000);
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Arcane World
          </div>
          <div className="text-lg text-slate-100">正在加载任务大厅…</div>
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");

  function getTaskTypeLabel(task) {
    if (!task.type) return "一次性"; // 兼容旧数据
    const typeInfo = TASK_TYPES.find((t) => t.value === task.type);
    return typeInfo ? typeInfo.label : task.type;
  }

  function getTaskTypeEmoji(task) {
    if (!task.type) return "✓";
    const typeInfo = TASK_TYPES.find((t) => t.value === task.type);
    return typeInfo ? typeInfo.emoji : "✓";
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          📜 任务大厅 · LifeUP SE
        </h1>
        <p className="text-sm text-slate-400">
          这里是现实任务 → 魔法奖励的地方。完成日常任务获得金币，用金币兑换奖励或抽奖。
        </p>
      </header>

      {/* 灵感任务区域 */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌟</span>
            <div>
              <div className="text-sm font-medium text-slate-200">灵感任务</div>
              <div className="text-xs text-slate-400 mt-0.5">随机生成一个小任务</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={inspirationCategory}
              onChange={(e) => setInspirationCategory(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200"
            >
              {INSPIRATION_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateInspiration}
              className="shrink-0 rounded-lg bg-purple-500 hover:bg-purple-400 active:scale-95 text-sm font-medium px-4 py-2 transition text-white"
            >
              来一个
            </button>
          </div>
        </div>
      </div>

      {/* 主卡片：金币 + 添加任务 + 任务列表 */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 space-y-6">
        {/* 当前金币显示 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="text-sm text-slate-400">当前金币</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-300">{wallet}🪙</span>
          </div>
        </div>

        {/* 添加任务输入框 */}
        <div className="space-y-3">
          <div className="text-sm text-slate-400">添加新任务</div>
          
          {/* 任务类型选择 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">任务类型：</span>
            {TASK_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setTaskType(type.value);
                  if (type.value !== "project") {
                    setProjectId("");
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  taskType === type.value
                    ? "bg-violet-500/20 text-violet-200 border border-violet-500/40"
                    : "bg-slate-900/70 text-slate-400 border border-slate-700 hover:border-slate-600"
                }`}
              >
                {type.emoji} {type.label}
              </button>
            ))}
          </div>

          {/* 项目选择（仅项目型任务显示） */}
          {taskType === "project" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">所属项目：</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200"
              >
                <option value="">选择项目</option>
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 任务标题和预估时长 */}
          <div className="flex gap-2">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="比如：看曲曲课 5 分钟 / 丢一袋垃圾 / 背 5 个单词…"
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <input
              type="number"
              value={estMinutes}
              onChange={(e) => setEstMinutes(e.target.value)}
              placeholder="时长(分)"
              className="w-24 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <button
              onClick={handleAddTask}
              disabled={taskType === "project" && !projectId}
              className="shrink-0 rounded-lg bg-violet-500 hover:bg-violet-400 active:scale-95 text-sm font-medium px-6 py-2.5 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              新增
            </button>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="space-y-2">
          <div className="text-sm text-slate-400 mb-3">任务列表</div>
          {todoTasks.length === 0 && doneTasks.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/50">
              <div className="text-slate-500 text-sm mb-1">还没有任务</div>
              <div className="text-xs text-slate-600">
                给自己加一个 3–10 分钟就可以完成的小任务吧
              </div>
            </div>
          ) : (
            <>
              {/* 待办任务 */}
              {todoTasks.length > 0 && (
                <div className="space-y-2">
                  {todoTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-700 bg-slate-950/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-200 text-sm font-medium">
                              {task.title}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {getTaskTypeEmoji(task)} {getTaskTypeLabel(task)}
                            </span>
                            {task.projectId && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                {getProjectName(task.projectId)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {task.estMinutes && (
                              <span>⏱ {task.estMinutes} 分钟</span>
                            )}
                            <span className="text-yellow-300">
                              +{task.rewardCoins || 5}🪙
                            </span>
                            <span className="text-violet-300">
                              +{task.rewardXp || 5}XP
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-sm font-medium px-4 py-2 transition text-white"
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 已完成任务（折叠区） */}
              {doneTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowDoneTasks(!showDoneTasks)}
                    className="text-xs text-slate-500 hover:text-slate-300 mb-2 flex items-center gap-1"
                  >
                    {showDoneTasks ? "▼" : "▶"} 已完成任务 ({doneTasks.length})
                  </button>
                  {showDoneTasks && (
                    <div className="space-y-2 mt-2">
                      {doneTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 opacity-60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-sm line-through">
                              {task.title}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">
                              {getTaskTypeEmoji(task)} {getTaskTypeLabel(task)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className="rounded-lg bg-violet-500/20 border border-violet-500/40 p-3 text-sm text-violet-100">
          {message}
        </div>
      )}

      {/* 商店和抽奖 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 商店 */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛒</span>
            <h2 className="text-sm font-medium text-slate-100">商店</h2>
          </div>
          <div className="space-y-2">
            {SHOP_REWARDS.map((reward) => {
              const canAfford = wallet >= reward.price;
              return (
                <button
                  key={reward.id}
                  onClick={() => handlePurchaseReward(reward)}
                  disabled={!canAfford}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    canAfford
                      ? "border-slate-700 bg-slate-950/50 hover:border-violet-400/60 hover:bg-violet-500/10"
                      : "border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{reward.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{reward.description}</div>
                    </div>
                    <div className="text-sm font-bold text-yellow-300">{reward.price}🪙</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            消耗金币兑换奖励
          </div>
        </div>

        {/* 抽奖机 */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎰</span>
            <h2 className="text-sm font-medium text-slate-100">抽奖机</h2>
          </div>
          <button
            onClick={handleLottery}
            disabled={wallet < 10}
            className={`w-full rounded-lg border p-4 text-center transition ${
              wallet >= 10
                ? "border-violet-500/60 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200"
                : "border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed text-slate-500"
            }`}
          >
            <div className="text-lg font-bold mb-1">消耗 10🪙 抽一次</div>
            <div className="text-xs text-slate-400">
              随机获得：休息券 / 奶茶券 / 美甲基金等
            </div>
          </button>
        </div>
      </div>

      {/* 我的奖励 */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-100">我的奖励</h2>
        {!claims || claims.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/50">
            <div className="text-slate-500 text-sm mb-1">还没有奖励</div>
            <div className="text-xs text-slate-600">
              完成任务、在商店兑换或抽奖即可获得奖励
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {claims
              .slice()
              .reverse()
              .map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{claim.emoji || "🎁"}</span>
                    <div>
                      <div className="text-sm text-slate-200">{claim.name}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(claim.ts).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {claim.type === "shop" ? "商店兑换" : "抽奖获得"}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
