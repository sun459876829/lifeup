"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页", emoji: "🏠" },
  { href: "/tasks", label: "任务", emoji: "📜" },
  { href: "/treasure", label: "远征", emoji: "🗺️" },
  { href: "/shop", label: "商店", emoji: "🛒" },
  { href: "/inventory", label: "背包", emoji: "🎒" },
  { href: "/ideas", label: "想法", emoji: "💡" },
  { href: "/history", label: "历史", emoji: "🕒" },
  { href: "/settings", label: "设置", emoji: "⚙️" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-violet-500/20 text-violet-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
