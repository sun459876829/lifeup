const items = [
  "晨光药剂",
  "专注羽毛",
  "灵感晶石",
  "守护卷轴",
  "静心香薰",
  "旅行徽章",
];

export default function InventoryPage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          背包
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">背包</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          这里收藏你的道具与奖励，未来可用于提升技能或兑换魔法体验。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500" />
            <h2 className="text-base font-semibold text-white">{item}</h2>
            <p className="mt-2 text-xs text-slate-400">
              物品说明占位，等待注入魔法。
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
