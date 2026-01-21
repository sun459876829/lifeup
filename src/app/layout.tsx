import "./globals.css";
import AppProviders from "@/components/AppProviders";
import TopNavigation from "@/components/TopNavigation";

export const metadata = {
  title: "LifeUP · Arcane Dashboard",
  description: "人生养成任务游戏化仪表盘",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50">
        <AppProviders>
          <div className="min-h-screen">
            <TopNavigation />
            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
