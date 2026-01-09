import "./globals.css";

export const metadata = {
  title: "LifeUP · 游戏人生",
  description: "LifeUP SE 自我激励系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-950">
        {children}
      </body>
    </html>
  );
}
