"use client";

import React from "react";

function formatDateTime(date: Date) {
  try {
    return date.toLocaleString();
  } catch {
    return "";
  }
}

export default function WorldClock() {
  return (
    <div className="text-xs text-gray-500">{formatDateTime(new Date())}</div>
  );
}
