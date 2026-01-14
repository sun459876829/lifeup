import "./globals.css";
import TopNavigation from "@/components/TopNavigation";
import { MagicWorldProvider } from "./magicWorldContext";

export const metadata = {
  title: "LifeUP · 游戏人生",
  description: "LifeUP SE 自我激励系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
        <MagicWorldProvider>
          <TopNavigation />
          <main className="max-w-5xl mx-auto px-4 py-6 pb-16 pt-20">
            {children}
          </main>
        </MagicWorldProvider>
      </body>
    </html>
  );
}
