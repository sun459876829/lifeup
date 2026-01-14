"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/tasks", label: "任务" },
  { href: "/custom-tasks", label: "自定义任务" },
  { href: "/treasure", label: "藏宝图" },
  { href: "/shop", label: "商店" },
  { href: "/inventory", label: "背包" },
  { href: "/profile", label: "档案" },
];

export default function TopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左边：标题区 */}
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">
              LifeUP · Arcane Wilderness
            </div>
            <div className="text-xs text-slate-300 mt-0.5">饥荒魔法人生 · 荒野生存日志</div>
          </div>

          {/* 右边：导航按钮 */}
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    isActive
                      ? "bg-violet-500/20 text-violet-200 border border-violet-500/40"
                      : "bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-700/70 hover:border-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
