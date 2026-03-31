export interface HolidayDecoration {
  emoji: string;
  name: string;
  greeting: string;
  /** CSS color used for the overlay radial-gradient background */
  bgColor: string;
}

/** Meeus/Jones/Butcher algorithm for Easter Sunday */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Returns true if `date` is within [start, end] inclusive (month 1-indexed) */
function inRange(
  date: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const from = new Date(y, startMonth - 1, startDay).getTime();
  const to = new Date(y, endMonth - 1, endDay).getTime();
  const cur = new Date(y, m - 1, d).getTime();
  return cur >= from && cur <= to;
}

/** Returns true if `date` is within `daysBefore` days before and `daysAfter` days after `anchor` */
function aroundDate(
  date: Date,
  anchor: Date,
  daysBefore: number,
  daysAfter: number,
): boolean {
  const cur = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const from = anchor.getTime() - daysBefore * 86400000;
  const to = anchor.getTime() + daysAfter * 86400000;
  return cur >= from && cur <= to;
}

/**
 * Returns the holiday decoration for the given date, or null if no holiday.
 * Priority is applied top-to-bottom.
 */
export function getCurrentHoliday(now?: Date): HolidayDecoration | null {
  const date = now ?? new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // New Year's Eve / New Year (Dec 30 – Jan 2)
  if (inRange(date, 12, 30, 12, 31) || inRange(date, 1, 1, 1, 2)) {
    return { emoji: '🎉', name: 'New Year', greeting: 'Happy New Year!', bgColor: '#6a0dad' };
  }

  // Epiphany / Three Kings (Jan 5–6)
  if (month === 1 && day >= 5 && day <= 6) {
    return { emoji: '⭐', name: 'Epiphany', greeting: 'Happy Epiphany!', bgColor: '#1a237e' };
  }

  // Valentine's Day (Feb 12–14)
  if (month === 2 && day >= 12 && day <= 14) {
    return { emoji: '💝', name: "Valentine's Day", greeting: "Happy Valentine's Day!", bgColor: '#c2185b' };
  }

  // St. Patrick's Day (Mar 15–17)
  if (month === 3 && day >= 15 && day <= 17) {
    return { emoji: '🍀', name: "St. Patrick's Day", greeting: "Happy St. Patrick's Day!", bgColor: '#1b5e20' };
  }

  // Easter (Palm Sunday – Easter Monday)
  const easter = getEasterDate(year);
  if (aroundDate(date, easter, 7, 1)) {
    return { emoji: '🐣', name: 'Easter', greeting: 'Happy Easter!', bgColor: '#6a1b9a' };
  }

  // April Fools (Apr 1)
  if (month === 4 && day === 1) {
    return { emoji: '🃏', name: 'April Fools', greeting: 'April Fools! 😄', bgColor: '#e65100' };
  }

  // International Workers' Day (May 1)
  if (month === 5 && day === 1) {
    return { emoji: '✊', name: "Workers' Day", greeting: "Happy Workers' Day!", bgColor: '#b71c1c' };
  }

  // Halloween (Oct 28–31)
  if (month === 10 && day >= 28 && day <= 31) {
    return { emoji: '🎃', name: 'Halloween', greeting: 'Happy Halloween!', bgColor: '#e65100' };
  }

  // Day of the Dead (Nov 1–2)
  if (month === 11 && day >= 1 && day <= 2) {
    return { emoji: '💀', name: 'Day of the Dead', greeting: 'Happy Day of the Dead!', bgColor: '#4a148c' };
  }

  // Thanksgiving – 4th Thursday of November (Thu + 3 days window)
  const thanksgiving = getThanksgiving(year);
  if (aroundDate(date, thanksgiving, 0, 3)) {
    return { emoji: '🦃', name: 'Thanksgiving', greeting: 'Happy Thanksgiving!', bgColor: '#bf360c' };
  }

  // Christmas season (Dec 1 – Dec 26)
  if (month === 12 && day >= 1 && day <= 26) {
    return { emoji: '🎄', name: 'Christmas', greeting: 'Merry Christmas!', bgColor: '#1b5e20' };
  }

  return null;
}

/** Returns the 4th Thursday of November for the given year */
function getThanksgiving(year: number): Date {
  const nov1 = new Date(year, 10, 1); // November 1
  const dayOfWeek = nov1.getDay(); // 0=Sun, 4=Thu
  const firstThursday = dayOfWeek <= 4 ? 1 + (4 - dayOfWeek) : 1 + (11 - dayOfWeek);
  return new Date(year, 10, firstThursday + 21); // +3 weeks = 4th Thursday
}
