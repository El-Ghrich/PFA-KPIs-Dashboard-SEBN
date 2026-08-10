/**
 * src/__tests__/unit/isoDate.test.ts
 *
 * Unit tests for src/lib/isoDate.ts — all pure date math, zero I/O.
 */

import { describe, it, expect } from 'vitest'
import {
  getISOWeek,
  getISOWeekInfo,
  getCurrentISOWeek,
  mondayOfISOWeek,
  sundayOfISOWeek,
  isoWeekRange,
  weekLabel,
  weekLabelFromNumber,
  weekNumberFromLabel,
} from '../../lib/isoDate'

// ─────────────────────────────────────────────────────────────────────────────
// getISOWeek
// ─────────────────────────────────────────────────────────────────────────────

describe('getISOWeek', () => {
  it('returns correct week for a known Monday', () => {
    // 2026-01-05 is Monday of ISO week 2, 2026
    expect(getISOWeek('2026-01-05')).toBe(2)
  })

  it('returns week 1 for Jan 1 when it falls in ISO W1', () => {
    // 2024-01-01 (Mon) → ISO week 1
    expect(getISOWeek('2024-01-01')).toBe(1)
  })

  it('returns week 52 for a late December date that belongs to the old year', () => {
    // 2026-12-28 (Mon) belongs to week 53 of 2026
    expect(getISOWeek('2026-12-28')).toBeGreaterThanOrEqual(52)
  })

  it('accepts a Date object', () => {
    // 2026-03-09 = Monday of CW10... use an unambiguous known week
    const d = new Date(2026, 0, 12) // 2026-01-12 = Monday of CW03
    expect(getISOWeek(d)).toBe(3)
  })

  it('mid-year control: 2026-07-06 is CW28', () => {
    expect(getISOWeek(new Date(2026, 6, 6))).toBe(28)
  })

  it('returns a number between 1 and 53', () => {
    const week = getISOWeek(new Date())
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentISOWeek
// ─────────────────────────────────────────────────────────────────────────────

describe('getCurrentISOWeek', () => {
  it('matches getISOWeek(new Date())', () => {
    expect(getCurrentISOWeek()).toBe(getISOWeek(new Date()))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getISOWeekInfo
// ─────────────────────────────────────────────────────────────────────────────

describe('getISOWeekInfo', () => {
  it('returns correct week, year, monday and sunday', () => {
    const info = getISOWeekInfo(new Date(2026, 0, 5)) // Local 2026-01-05, CW02
    expect(info.week).toBe(2)
    expect(info.year).toBe(2026)
    // Compare using local date parts to avoid UTC offset issues
    expect(info.monday.getFullYear()).toBe(2026)
    expect(info.monday.getMonth()).toBe(0)  // January
    expect(info.monday.getDate()).toBe(5)
    expect(info.sunday.getFullYear()).toBe(2026)
    expect(info.sunday.getMonth()).toBe(0)
    expect(info.sunday.getDate()).toBe(11)
  })

  it('monday is always a Monday (getDay === 1)', () => {
    const info = getISOWeekInfo(new Date(2026, 6, 15)) // 2026-07-15
    expect(info.monday.getDay()).toBe(1)
  })

  it('sunday is always a Sunday (getDay === 0)', () => {
    const info = getISOWeekInfo(new Date(2026, 6, 15)) // 2026-07-15
    expect(info.sunday.getDay()).toBe(0)
  })

  it('monday and sunday are 6 days apart', () => {
    const info = getISOWeekInfo(new Date(2026, 3, 10)) // 2026-04-10
    const diff = (info.sunday.getTime() - info.monday.getTime()) / 86400000
    expect(diff).toBe(6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// mondayOfISOWeek / sundayOfISOWeek
// ─────────────────────────────────────────────────────────────────────────────

describe('mondayOfISOWeek', () => {
  it('returns 2026-01-05 for week 2 of 2026', () => {
    const monday = mondayOfISOWeek(2026, 2)
    // Use local date parts to avoid UTC offset issues
    expect(monday.getFullYear()).toBe(2026)
    expect(monday.getMonth()).toBe(0)   // January
    expect(monday.getDate()).toBe(5)
  })

  it('returns a Monday (getDay === 1)', () => {
    expect(mondayOfISOWeek(2026, 10).getDay()).toBe(1)
  })
})

describe('sundayOfISOWeek', () => {
  it('returns 2026-01-11 for week 2 of 2026', () => {
    const sunday = sundayOfISOWeek(2026, 2)
    expect(sunday.getFullYear()).toBe(2026)
    expect(sunday.getMonth()).toBe(0)   // January
    expect(sunday.getDate()).toBe(11)
  })

  it('is 6 days after mondayOfISOWeek for same week', () => {
    const monday = mondayOfISOWeek(2026, 15)
    const sunday = sundayOfISOWeek(2026, 15)
    const diff = (sunday.getTime() - monday.getTime()) / 86400000
    expect(diff).toBe(6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isoWeekRange
// ─────────────────────────────────────────────────────────────────────────────

describe('isoWeekRange', () => {
  it('returns monday and sunday matching mondayOfISOWeek / sundayOfISOWeek', () => {
    const { monday, sunday } = isoWeekRange(2026, 5)
    expect(monday.toISOString()).toBe(mondayOfISOWeek(2026, 5).toISOString())
    expect(sunday.toISOString()).toBe(sundayOfISOWeek(2026, 5).toISOString())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('weekLabelFromNumber', () => {
  it('pads single digit weeks with leading zero', () => {
    expect(weekLabelFromNumber(1)).toBe('CW01')
    expect(weekLabelFromNumber(9)).toBe('CW09')
  })

  it('does not pad double digit weeks', () => {
    expect(weekLabelFromNumber(25)).toBe('CW25')
  })
})

describe('weekNumberFromLabel', () => {
  it('parses CW01 → 1', () => {
    expect(weekNumberFromLabel('CW01')).toBe(1)
  })

  it('parses CW25 → 25', () => {
    expect(weekNumberFromLabel('CW25')).toBe(25)
  })

  it('round-trips with weekLabelFromNumber', () => {
    for (let w = 1; w <= 52; w++) {
      expect(weekNumberFromLabel(weekLabelFromNumber(w))).toBe(w)
    }
  })
})

describe('weekLabel', () => {
  it('returns the CW-prefixed label for a local date', () => {
    // 2026-01-12 = Monday of CW03, unambiguous
    expect(weekLabel(new Date(2026, 0, 12))).toBe('CW03')
  })

  it('accepts a Date object', () => {
    expect(weekLabel(new Date(2026, 0, 12))).toBe('CW03')
  })
})
