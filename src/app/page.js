"use client";

export default function HomeDebugPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #2c1642 0, #050608 55%, #020308 100%)",
        color: "#f5f5f5",
        padding: "48px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 28, letterSpacing: 2 }}>🔮 LifeUP · 调试占位页</h1>
      <p style={{ maxWidth: 520, lineHeight: 1.7, textAlign: "center", opacity: 0.85 }}>
        当前版本正在排查前端运行错误。这个页面只是一个临时的安全占位页面，用来确认
        「本地开发」和「Vercel 部署」都能正常打开。
      </p>
      <p style={{ fontSize: 14, opacity: 0.6 }}>
        当这个页面可以在 Vercel 上正常显示时，就说明前端不再直接崩溃了，
        后续可以再逐步接回魔法世界、大富翁系统等复杂功能。
      </p>
    </main>
  );
}
