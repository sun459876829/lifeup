export default function Home() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          魔法主页 · Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-white">魔法世界总览</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          欢迎回到你的魔法世界。这里是你的人生 RPG 仪表盘，记录修行进度、每日使命与神秘收藏。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-violet-500/10">
          <h2 className="text-lg font-semibold text-violet-100">等级与金币</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                当前等级
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">Lv. 07</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-2/3 rounded-full bg-violet-500" />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                魔法金币
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">1,280</p>
              <p className="mt-2 text-xs text-slate-400">
                今日可获得：+240
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">魔法纪要</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              今日主线任务已开启，等待你踏上冒险。
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              魔法能量恢复中，建议安排一场休息仪式。
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              本周宝石收集度达成 60%。
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
