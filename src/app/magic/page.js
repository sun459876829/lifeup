const skills = [
  {
    name: "月影护盾",
    level: "Lv. 3",
    detail: "减少疲劳消耗 15%",
  },
  {
    name: "星辉洞察",
    level: "Lv. 2",
    detail: "专注度提升 +20 分钟",
  },
  {
    name: "幻境整理术",
    level: "Lv. 4",
    detail: "整理任务效率提升",
  },
];

export default function MagicPage() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          魔法技能
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">魔法书</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          记录你的魔法技能与成长状态，未来可在此升级、组合与解锁新法术。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{skill.name}</h2>
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">
                {skill.level}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">{skill.detail}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
