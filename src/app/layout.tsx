import "./globals.css";

export const metadata = {
  title: "LifeUP · 调试版",
  description: "临时调试：先保证能正常打开首页",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          padding: 0,
          background:
            "radial-gradient(circle at top, #1b1030 0, #050608 55%, #020308 100%)",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
