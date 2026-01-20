import "./globals.css";

export const metadata = {
  title: "LifeUP · 调试版",
  description: "临时调试：先保证能正常打开页面",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#050608",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
