"use client";

import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message ?? "未知错误" };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Global ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#fdd", background: "#220000" }}>
          <h2>⚠️ 系统遇到一个错误</h2>
          <p style={{ fontSize: 14, opacity: 0.8 }}>
            刷新页面或稍后再试。如果仍然反复出错，请检查最近修改的功能。
          </p>
          {this.state.message && (
            <pre
              style={{
                marginTop: 12,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                opacity: 0.6,
              }}
            >
              {this.state.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
