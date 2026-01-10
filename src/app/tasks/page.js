export default function TasksPage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          任务大厅
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">任务大厅</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          今日的挑战与冒险清单在此集结，挑选一项主线使命或完成几条小任务。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">主任务</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-violet-400/20 bg-slate-900/60 p-4">
              <p className="font-semibold text-white">星辉计划 · 深度专注</p>
              <p className="mt-2 text-xs text-slate-400">
                预计 90 分钟 · 完成后获得 120 魔法金币
              </p>
            </div>
            <div className="rounded-xl border border-violet-400/20 bg-slate-900/60 p-4">
              <p className="font-semibold text-white">神秘卷轴整理</p>
              <p className="mt-2 text-xs text-slate-400">
                预计 45 分钟 · 解锁知识经验值
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">小任务</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              召唤水元素：喝满一杯水
            </li>
            <li className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              点亮书页：阅读 10 分钟
            </li>
            <li className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              星光拉伸：舒展肩颈 5 分钟
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
