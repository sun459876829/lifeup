const DEFAULT_STREAK = {
  count: 0,
  lastDay: null,
};

export function normalizeTaskStreak(streak) {
  if (!streak || typeof streak !== "object") {
    return { ...DEFAULT_STREAK };
  }
  const count = Number.isFinite(streak.count) ? Math.max(0, Math.floor(streak.count)) : 0;
  const lastDay = Number.isFinite(streak.lastDay) ? streak.lastDay : null;
  return {
    count,
    lastDay,
  };
}

export function isStreakActive(streak) {
  return (streak?.count || 0) >= 3;
}

export function updateTaskStreak(task, dayIndex) {
  const currentStreak = normalizeTaskStreak(task?.streak);
  let nextCount = 1;

  if (currentStreak.lastDay === dayIndex) {
    nextCount = Math.max(currentStreak.count || 0, 1);
  } else if (currentStreak.lastDay === dayIndex - 1) {
    nextCount = (currentStreak.count || 0) + 1;
  }

  const nextStreak = {
    count: nextCount,
    lastDay: dayIndex,
  };

  return {
    streak: nextStreak,
    streakActive: isStreakActive(nextStreak),
  };
}

export function resetMissedTaskStreak(task, previousDay) {
  const currentStreak = normalizeTaskStreak(task?.streak);
  if (currentStreak.lastDay === previousDay) {
    return {
      ...task,
      streak: currentStreak,
      streakActive: task?.streakActive ?? isStreakActive(currentStreak),
    };
  }
  return {
    ...task,
    streak: { ...DEFAULT_STREAK },
    streakActive: false,
  };
}

export function getStreakRewardMultiplier(streakActive) {
  return streakActive ? 1.2 : 1;
}
