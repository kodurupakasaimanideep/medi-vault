/**
 * streakHelper.js — Unified, Per-User Streak Tracking Engine
 *
 * Tracks daily health habits (Yoga, Hydration, Medicine compliance, Login)
 * with strict per-user UID isolation, timezone safety, and seamless syncing across
 * Dashboard, Yoga, Drinking Water, and Health Calendar.
 */

const getTodayKey = () => new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
};

const getUserId = (user) => {
  if (!user) return 'guest';
  return user.id || user.uid || 'guest';
};

/**
 * Get current streak object for a specific user
 * @param {object} user - User object with id or uid
 * @returns {{ count: number, activeToday: boolean, lastActiveDate: string, history: object }}
 */
export function getStreak(user) {
  const uid = getUserId(user);
  const streakKey = `medivault_streak_${uid}`;
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  let data = null;
  try {
    const raw = localStorage.getItem(streakKey);
    if (raw) data = JSON.parse(raw);
  } catch {
    data = null;
  }

  // Fallback to legacy yoga streaks if unified streak not yet created
  if (!data) {
    const legacyCount = parseInt(
      localStorage.getItem(`yoga_streaks_${uid}`) ||
      localStorage.getItem(`yoga_day_streaks_${uid}`) ||
      '0',
      10
    );
    const legacyLastDate = localStorage.getItem(`yoga_last_streak_date_${uid}`) || '';
    
    // Convert legacy date to YYYY-MM-DD if in toDateString format
    let normalizedLastDate = '';
    if (legacyLastDate) {
      const parsed = new Date(legacyLastDate);
      if (!isNaN(parsed.getTime())) {
        normalizedLastDate = parsed.toLocaleDateString('en-CA');
      }
    }

    data = {
      count: legacyCount,
      lastActiveDate: normalizedLastDate,
      history: normalizedLastDate ? { [normalizedLastDate]: true } : {}
    };
  }

  const lastActiveDate = data.lastActiveDate || '';
  const activeToday = lastActiveDate === todayKey;

  // Verify streak validity based on consecutive calendar days:
  let validCount = data.count || 0;
  if (lastActiveDate && lastActiveDate !== todayKey && lastActiveDate !== yesterdayKey) {
    // Missed at least one full day -> streak is broken
    validCount = 0;
  }

  return {
    count: validCount,
    activeToday,
    lastActiveDate,
    history: data.history || {}
  };
}

/**
 * Record a daily health activity for the current user and update their streak.
 * @param {object} user - User object
 * @param {string} activityType - 'yoga' | 'water' | 'tablet' | 'daily_visit'
 * @returns {{ count: number, isNewStreakDay: boolean }}
 */
export function recordDailyActivity(user, activityType = 'daily_visit') {
  const uid = getUserId(user);
  const streakKey = `medivault_streak_${uid}`;
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();

  const current = getStreak(user);
  let newCount = current.count;
  let isNewStreakDay = false;

  const updatedHistory = { ...(current.history || {}) };
  updatedHistory[todayKey] = {
    ...(typeof updatedHistory[todayKey] === 'object' ? updatedHistory[todayKey] : {}),
    [activityType]: true,
    timestamp: Date.now()
  };

  if (current.lastActiveDate === todayKey) {
    // Already active today — preserve current streak
    newCount = Math.max(1, current.count);
  } else if (current.lastActiveDate === yesterdayKey) {
    // Was active yesterday — increment streak for today!
    newCount = current.count + 1;
    isNewStreakDay = true;
  } else {
    // First time or missed day — start new streak at 1
    newCount = 1;
    isNewStreakDay = true;
  }

  const streakData = {
    count: newCount,
    lastActiveDate: todayKey,
    history: updatedHistory,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(streakKey, JSON.stringify(streakData));
    // Synchronize legacy keys for backward compatibility with existing views
    localStorage.setItem(`yoga_streaks_${uid}`, newCount.toString());
    localStorage.setItem(`yoga_day_streaks_${uid}`, newCount.toString());
    localStorage.setItem(`yoga_last_streak_date_${uid}`, new Date().toDateString());
  } catch (e) {
    console.error('[Streak] Error saving streak data:', e);
  }

  // Dispatch event so all open views (Dashboard, Yoga, Calendar) update simultaneously
  window.dispatchEvent(
    new CustomEvent('medivault_streak_updated', {
      detail: { uid, count: newCount, activityType, isNewStreakDay }
    })
  );

  return { count: newCount, isNewStreakDay };
}

/**
 * Get visual array of the last N days with activity completion flags
 */
export function getRecentStreakDays(user, daysCount = 7) {
  const streak = getStreak(user);
  const history = streak.history || {};
  const today = new Date();
  const days = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = d.toLocaleDateString('en-CA');
    const isCompleted = !!history[dateKey];
    days.push({
      dateKey,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isCompleted,
      isToday: i === 0
    });
  }

  return days;
}
