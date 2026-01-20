"use client";

import React, { createContext, useContext, useState } from "react";

type GameState = {
  coins: number;
  exp: number;
  inventory: Record<string, number>;
};

type GameStateContextValue = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>({
    coins: 0,
    exp: 0,
    inventory: {},
  });

  return (
    <GameStateContext.Provider value={{ state, setState }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error("useGameState must be used within GameStateProvider");
  }
  return ctx;
}
