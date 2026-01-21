"use client";

import React from "react";
import { WorldProvider } from "@/app/worldState";
import { GameStateProvider } from "@/state/GameStateContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorldProvider>
      <GameStateProvider>{children}</GameStateProvider>
    </WorldProvider>
  );
}
