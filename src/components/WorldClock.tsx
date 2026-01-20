"use client";

import React from "react";

export function formatDateTime(value: Date | number | string): string {
  const d =
    value instanceof Date
      ? value
      : typeof value === "number"
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function WorldClock() {
  return (
    <div className="text-xs text-gray-500">{formatDateTime(new Date())}</div>
  );
}
