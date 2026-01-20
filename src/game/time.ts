let gameStart: Date | null = null;

export function getNow(): Date {
  return new Date();
}

export function getGameStartDate(): Date {
  if (!gameStart) {
    gameStart = new Date();
  }
  return gameStart;
}

export function setGameStartDate(date: Date) {
  gameStart = date;
}
