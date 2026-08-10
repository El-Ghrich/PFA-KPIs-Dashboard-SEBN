/**
 * src/__tests__/unit/transformers.test.ts
 *
 * Unit tests for src/features/dashboard/transformers.ts
 * All pure functions — no rendering, no I/O.
 */

import { describe, it, expect } from 'vitest'
import {
  groupRecords,
  computeKpis,
  buildChartWeekData,
  splitHighlights,
} from '../../features/dashboard/transformers'
import {
  RECORD_CW01_OUTPUT,
  RECORD_CW02_OUTPUT,
  RECORD_CW02_SCRAP,
  MOCK_HIGHLIGHT_GOOD,
  MOCK_HIGHLIGHT_BAD,
  makeRecord,
  MOCK_KPI_OEE,
} from '../mocks/data'

// ─────────────────────────────────────────────────────────────────────────────
// groupRecords
// ─────────────────────────────────────────────────────────────────────────────

describe('groupRecords', () => {
  it('returns empty array for empty input', () => {
    expect(groupRecords([])).toEqual([])
  })

  it('skips records without kpi_definition', () => {
    const bare = { ...RECORD_CW02_OUTPUT, kpi_definition: null }
    expect(groupRecords([bare])).toEqual([])
  })

  it('groups single week correctly', () => {
    const result = groupRecords([RECORD_CW02_OUTPUT, RECORD_CW02_SCRAP])
    expect(result).toHaveLength(1)
    expect(result[0].weekLabel).toBe('CW02')
    expect(result[0].output).toBe(9500)
    expect(result[0].scrapRate).toBe(2.5)
    // Fields not provided default to null
    expect(result[0].oee).toBeNull()
  })

  it('groups multiple weeks and sorts by week number ascending', () => {
    const result = groupRecords([RECORD_CW02_OUTPUT, RECORD_CW01_OUTPUT])
    expect(result).toHaveLength(2)
    expect(result[0].weekLabel).toBe('CW01')
    expect(result[1].weekLabel).toBe('CW02')
    expect(result[0].output).toBe(8000)
    expect(result[1].output).toBe(9500)
  })

  it('uses null for weeks with no value for a KPI', () => {
    const result = groupRecords([RECORD_CW01_OUTPUT]) // only output, no scrap
    expect(result[0].scrapRate).toBeNull()
    expect(result[0].oee).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// computeKpis
// ─────────────────────────────────────────────────────────────────────────────

describe('computeKpis', () => {
  it('returns null kpiList when weekData is empty', () => {
    const { kpiList } = computeKpis([], 2, null)
    expect(kpiList).toBeNull()
  })

  it('returns kpiList for a single data point with no prev', () => {
    const weekData = groupRecords([RECORD_CW02_OUTPUT])
    const { kpiList } = computeKpis(weekData, 2, null)
    expect(kpiList).not.toBeNull()
    expect(kpiList![0].value).toBe('9500') // output
    expect(kpiList![0].unit).toBe('units')
  })

  it('calculates correct positive diff for output (higher is better)', () => {
    const weekData = groupRecords([RECORD_CW01_OUTPUT, RECORD_CW02_OUTPUT])
    const { kpiList } = computeKpis(weekData, 2, null)
    // CW02 output = 9500, CW01 output = 8000 → diff = +1500
    expect(kpiList![0].diff).toBe(1500)
    expect(kpiList![0].diffDirection).toBe('up')
  })

  it('inverts diff for scrap rate (lower is better)', () => {
    // CW01 scrap = 3.0, CW02 scrap = 2.5 — going DOWN is GOOD → diff should be positive
    const rec01 = makeRecord({ kpi_definition: RECORD_CW02_SCRAP.kpi_definition!, numeric_value: 3.0, record_date: '2025-12-29' })
    const weekData = groupRecords([rec01, RECORD_CW02_SCRAP])
    const { kpiList } = computeKpis(weekData, 2, null)
    // scrap index is 1
    expect(kpiList![1].diff).toBeGreaterThan(0) // inverted: 3.0 - 2.5 = 0.5 → positive = good
    expect(kpiList![1].diffDirection).toBe('up')
  })

  it('uses compareWeek when provided', () => {
    const weekData = groupRecords([RECORD_CW01_OUTPUT, RECORD_CW02_OUTPUT])
    // Compare CW02 against CW01 explicitly
    const { kpiList } = computeKpis(weekData, 2, 1)
    expect(kpiList![0].diff).toBe(1500)
  })

  it('returns compareDiffValues as formatted strings', () => {
    const weekData = groupRecords([RECORD_CW01_OUTPUT, RECORD_CW02_OUTPUT])
    const { compareDiffValues } = computeKpis(weekData, 2, null)
    expect(compareDiffValues[0]).toBe('+1500.0')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildChartWeekData
// ─────────────────────────────────────────────────────────────────────────────

describe('buildChartWeekData', () => {
  it('returns an array of exactly `count` weeks when all data present', () => {
    const weekData = groupRecords([RECORD_CW01_OUTPUT, RECORD_CW02_OUTPUT])
    const result = buildChartWeekData(weekData, 2, 2)
    expect(result).toHaveLength(2)
    expect(result[0].weekLabel).toBe('CW01')
    expect(result[1].weekLabel).toBe('CW02')
  })

  it('fills null-valued week for missing weeks', () => {
    const weekData = groupRecords([RECORD_CW02_OUTPUT]) // only CW02 exists
    const result = buildChartWeekData(weekData, 2, 2) // want CW01 and CW02
    // CW01 will be filled with nulls
    const cw01 = result.find((w) => w.weekLabel === 'CW01')
    expect(cw01).toBeDefined()
    expect(cw01!.output).toBeNull()
  })

  it('skips week numbers below 1', () => {
    const weekData = groupRecords([RECORD_CW01_OUTPUT])
    // selectedWeek=1, count=3 → would try weeks -1, 0, 1 but skips negatives
    const result = buildChartWeekData(weekData, 1, 3)
    const weekNumbers = result.map((w) => parseInt(w.weekLabel.replace('CW', '')))
    expect(weekNumbers.every((n) => n >= 1)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// splitHighlights
// ─────────────────────────────────────────────────────────────────────────────

describe('splitHighlights', () => {
  const weekData = groupRecords([RECORD_CW02_OUTPUT]) // contains CW02

  it('separates GOOD and BAD highlights correctly', () => {
    const { good, bad } = splitHighlights(
      [MOCK_HIGHLIGHT_GOOD, MOCK_HIGHLIGHT_BAD],
      weekData,
    )
    expect(good).toHaveLength(1)
    expect(bad).toHaveLength(1)
    expect(good[0].status).toBe('GOOD')
    expect(bad[0].status).toBe('BAD')
  })

  it('excludes highlights outside the chart week window', () => {
    const outsideHighlight = {
      ...MOCK_HIGHLIGHT_GOOD,
      record_date: '2025-12-29', // CW01 — not in CW02 chart
    }
    const { good } = splitHighlights([outsideHighlight], weekData)
    expect(good).toHaveLength(0)
  })

  it('returns empty arrays when no highlights provided', () => {
    const { good, bad } = splitHighlights([], weekData)
    expect(good).toEqual([])
    expect(bad).toEqual([])
  })

  it('sorts highlights by record_date ascending within each group', () => {
    const earlier = { ...MOCK_HIGHLIGHT_GOOD, id: 'h1', record_date: '2026-01-05' }
    const later = { ...MOCK_HIGHLIGHT_GOOD, id: 'h2', record_date: '2026-01-07' }
    const { good } = splitHighlights([later, earlier], weekData)
    expect(good[0].record_date).toBe('2026-01-05')
    expect(good[1].record_date).toBe('2026-01-07')
  })
})
