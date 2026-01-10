import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LifeUP · Arcane World",
  description: "你的个人暗黑魔法人生系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100`}
      >
        <main className="max-w-5xl mx-auto px-4 py-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
