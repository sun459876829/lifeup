export default function ProfilePage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          角色面板
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">我的身份</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          你的角色信息将在这里成长与更新，记录每一次冒险的痕迹。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">我的身份：小魔女</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>元素亲和：星辉 / 梦境</p>
            <p>称号：夜空守望者</p>
            <p>伙伴：影子猫 · Lumo</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-violet-100">角色立绘</h2>
          <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/60 text-sm text-slate-400">
            未来放置人物立绘或 3D 形象
          </div>
        </div>
      </div>
    </section>
  );
}
