export function rollDice(): { value: number; breakdown?: any } {
  const value = Math.floor(Math.random() * 6) + 1;
  return {
    value,
    breakdown: undefined,
  };
}
