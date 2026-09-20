export interface ISOWeekInfo {
  week: number
  year: number
  monday: Date
  sunday: Date
}

/**
 * Normalizes any Date or string into calendar date components [year, month (0-11), day].
 * If a string "YYYY-MM-DD" is provided, it extracts parts directly without timezone shift.
 */
function parseDateParts(value: Date | string): [number, number, number] {
  if (typeof value === 'string') {
    const clean = value.split('T')[0].trim()
    const parts = clean.split('-').map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return [parts[0], parts[1] - 1, parts[2]]
    }
  }
  const date = value instanceof Date ? value : new Date(value)
  return [date.getFullYear(), date.getMonth(), date.getDate()]
}

/**
 * Converts a Date to "YYYY-MM-DD" formatted string using local calendar date parts.
 * Never uses `.toISOString()` to prevent timezone rollbacks.
 */
export function toISODateString(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0].trim()
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns the ISO 8601 week number (1-53) for a given date or string.
 * Completely immune to timezone offsets and daylight saving transitions.
 */
export function getISOWeek(value: Date | string): number {
  const [y, m, d] = parseDateParts(value)
  // Work in pure UTC to avoid local timezone / DST offset issues
  const target = new Date(Date.UTC(y, m, d))
  // ISO day: 1 = Monday ... 7 = Sunday
  const day = target.getUTCDay() || 7
  // Set to nearest Thursday: current date + 4 - current day number
  target.setUTCDate(target.getUTCDate() + 4 - day)

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getCurrentISOWeek(): number {
  return getISOWeek(new Date())
}

/**
 * Returns the "YYYY-MM-DD" string for the Monday of a given ISO week.
 * Guaranteed to match backend Python `date.fromisocalendar(year, week, 1).isoformat()`.
 */
export function mondayOfISOWeekString(year: number, week: number): string {
  // Jan 4th is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const target = new Date(Date.UTC(year, 0, 4 - (day - 1) + (week - 1) * 7))
  const y = target.getUTCFullYear()
  const m = String(target.getUTCMonth() + 1).padStart(2, '0')
  const d = String(target.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns the "YYYY-MM-DD" string for the Sunday of a given ISO week.
 */
export function sundayOfISOWeekString(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const target = new Date(Date.UTC(year, 0, 4 - (day - 1) + (week - 1) * 7 + 6))
  const y = target.getUTCFullYear()
  const m = String(target.getUTCMonth() + 1).padStart(2, '0')
  const d = String(target.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns a local Date object representing the Monday of an ISO week.
 */
export function mondayOfISOWeek(year: number, week: number): Date {
  const [y, m, d] = mondayOfISOWeekString(year, week).split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0)
}

/**
 * Returns a local Date object representing the Sunday of an ISO week.
 */
export function sundayOfISOWeek(year: number, week: number): Date {
  const [y, m, d] = sundayOfISOWeekString(year, week).split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0)
}

export function isoWeekRange(year: number, week: number): { monday: Date; sunday: Date } {
  return { monday: mondayOfISOWeek(year, week), sunday: sundayOfISOWeek(year, week) }
}

export function getISOWeekInfo(date: Date | string): ISOWeekInfo {
  const week = getISOWeek(date)
  const [targetY, targetM, targetD] = parseDateParts(date)
  const target = new Date(Date.UTC(targetY, targetM, targetD))
  const day = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - day)
  const isoYear = target.getUTCFullYear()

  return {
    week,
    year: isoYear,
    monday: mondayOfISOWeek(isoYear, week),
    sunday: sundayOfISOWeek(isoYear, week),
  }
}

export function weekLabelFromNumber(week: number): string {
  return `CW${String(week).padStart(2, '0')}`
}

export function weekNumberFromLabel(label: string): number {
  return parseInt(label.replace('CW', ''), 10)
}

export function weekLabel(value: Date | string): string {
  return weekLabelFromNumber(getISOWeek(value))
}
