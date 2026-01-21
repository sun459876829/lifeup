import type { NextPage } from "next";

const HomePage: NextPage = () => {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        background:
          "radial-gradient(circle at top, #1b1030 0, #050608 55%, #020308 100%)",
        color: "#f5f5f5",
      }}
    >
      <h1 style={{ fontSize: 28 }}>🎲 LifeUP · pages 路由调试占位页</h1>
      <p style={{ maxWidth: 520, textAlign: "center", opacity: 0.9 }}>
        当前正在完全禁用 src/app 目录，只使用 pages 路由。
      </p>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        如果你在 Vercel 预览地址看到这页，说明本次首页没有错误。
      </p>
    </main>
  );
};

export default HomePage;
