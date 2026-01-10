const gems = ["月光蓝宝", "星砂紫晶", "曙光翡翠", "暮影红曜"];

export default function TreasurePage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          藏宝图 & 宝石
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">藏宝图 & 宝石</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          跟随藏宝图探索每一块区域，收集稀有宝石，为你的旅程增添幸运。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">探索进度</h2>
          <div className="mt-4 space-y-4">
            {[
              { name: "雾影森林", value: "70%" },
              { name: "幽蓝海湾", value: "45%" },
              { name: "星陨山谷", value: "30%" },
            ].map((area) => (
              <div key={area.name}>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{area.name}</span>
                  <span>{area.value}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500"
                    style={{ width: area.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">宝石收藏</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-200">
            {gems.map((gem) => (
              <div
                key={gem}
                className="rounded-xl border border-violet-400/20 bg-slate-900/60 p-4 text-center"
              >
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 shadow-lg shadow-violet-500/40" />
                <p>{gem}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
