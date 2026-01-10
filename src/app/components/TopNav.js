"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/tasks", label: "任务" },
  { href: "/magic", label: "魔法" },
  { href: "/treasure", label: "藏宝图" },
  { href: "/shop", label: "商店" },
  { href: "/inventory", label: "背包" },
  { href: "/profile", label: "档案" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold tracking-wide text-violet-100">
          LifeUP · Arcane World
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-3 py-1 transition ${
                  isActive
                    ? "border-violet-300/80 bg-violet-500/20 text-violet-100 shadow-sm shadow-violet-500/30"
                    : "border-transparent text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
