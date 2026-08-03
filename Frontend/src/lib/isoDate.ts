export interface ISOWeekInfo {
  week: number
  year: number
  monday: Date
  sunday: Date
}

function toDate(value: Date | string): Date {
  return new Date(value instanceof Date ? value.getTime() : value)
}

export function getISOWeek(value: Date | string): number {
  const date = toDate(value)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((date.getDay() + 6) % 7))
  const firstJan = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7)
}

export function getCurrentISOWeek(): number {
  return getISOWeek(new Date())
}

export function getISOWeekInfo(date: Date): ISOWeekInfo {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayOffset = (d.getDay() + 6) % 7
  const thursday = new Date(d)
  thursday.setDate(d.getDate() + 3 - dayOffset)
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const jan4DayOffset = (jan4.getDay() + 6) % 7
  const jan4Monday = new Date(jan4)
  jan4Monday.setDate(jan4.getDate() - jan4DayOffset)
  const week = Math.ceil(((thursday.getTime() - jan4Monday.getTime()) / 86400000 + 1) / 7)
  const monday = new Date(d)
  monday.setDate(d.getDate() - dayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { week, year, monday, sunday }
}

export function mondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const jan4Monday = new Date(jan4)
  jan4Monday.setDate(jan4.getDate() - dayOffset)
  const monday = new Date(jan4Monday)
  monday.setDate(monday.getDate() + (week - 1) * 7)
  return monday
}

export function sundayOfISOWeek(year: number, week: number): Date {
  const monday = mondayOfISOWeek(year, week)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
}

export function isoWeekRange(year: number, week: number): { monday: Date; sunday: Date } {
  return { monday: mondayOfISOWeek(year, week), sunday: sundayOfISOWeek(year, week) }
}

export function weekLabelFromNumber(week: number): string {
  return `CW${String(week).padStart(2, '0')}`
}

export function weekNumberFromLabel(label: string): number {
  return parseInt(label.replace('CW', ''))
}

export function weekLabel(value: Date | string): string {
  return weekLabelFromNumber(getISOWeek(value))
}
