import { TIMEZONE } from './constants'

const MONTH_DAY: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

export function formatDateRange(start: Date, end: Date, includeYear = false): string {
  const range = `${start.toLocaleDateString('en-US', MONTH_DAY)} - ${end.toLocaleDateString('en-US', MONTH_DAY)}`
  if (!includeYear) return range
  return `${range} ${end.toLocaleDateString('en-US', { year: 'numeric' })}`
}

export function formatTodayDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE,
    })
    .toUpperCase()
    .replace(',', ' · CST')
}
