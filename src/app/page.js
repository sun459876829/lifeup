"use client";

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
        LifeUP · Arcane World
      </div>
      <h1 className="text-2xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
        个人魔法世界 · 总览
      </h1>
      <p className="text-sm text-slate-400">
        这里以后会是你的「魔力等级 / 金币 / 宝石 / 藏宝图 / 今日状态」总览面板。
        目前先把这个页面当成大本营，详细的任务系统在 /tasks 里。
      </p>
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-[0_0_40px_rgba(15,23,42,0.6)]">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Arcane World
        </div>
        <div className="mt-3 text-sm text-slate-300">
          这里将展示你的魔法资产与今日情报。现在先去任务大厅积累金币和奖励吧。
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
          <span className="h-2 w-2 rounded-full bg-violet-300" />
          任务大厅入口：/tasks
        </div>
      </div>
    </div>
  );
}
