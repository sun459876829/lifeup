const items = [
  {
    name: "休息券",
    detail: "恢复魔力 30 分钟",
    price: "40 金币",
  },
  {
    name: "自我奖励",
    detail: "解锁一场小确幸",
    price: "60 金币",
  },
  {
    name: "灵感扭蛋",
    detail: "随机获得神秘道具",
    price: "80 金币",
  },
];

export default function ShopPage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          商店 / 扭蛋
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">商店</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          用魔法金币兑换补给，或者试试扭蛋带来的惊喜奖励。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-lg font-semibold text-white">{item.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-violet-200">{item.price}</span>
              <span className="rounded-full border border-violet-400/40 px-3 py-1 text-xs text-violet-200">
                兑换
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
