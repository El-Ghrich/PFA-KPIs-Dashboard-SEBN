import { KPI_LABELS } from '../../lib/constants'
import { getISOWeek, weekLabel, weekLabelFromNumber, weekNumberFromLabel } from '../../lib/isoDate'
import type { Highlight, KPIRecord } from '../../types'

export interface WeekDataPoint {
  weekLabel: string
  output: number | null
  scrapRate: number | null
  oee: number | null
  insertion1: number | null
  insertion2: number | null
  insertion3: number | null
}

export interface KpiDisplay {
  value: string
  unit: string
  diff: number
  diffDirection: 'up' | 'down'
}

export function groupRecords(records: KPIRecord[]): WeekDataPoint[] {
  const weekMap = new Map<string, Map<string, number | null>>()
  for (const rec of records) {
    if (!rec.kpi_definition) continue
    const weekKey = weekLabel(rec.record_date)
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map())
    weekMap.get(weekKey)!.set(rec.kpi_definition.name, rec.numeric_value)
  }

  return [...weekMap.entries()]
    .sort(([a], [b]) => {
      const na = weekNumberFromLabel(a)
      const nb = weekNumberFromLabel(b)
      if (na !== nb) return na - nb
      return a.localeCompare(b)
    })
    .map(([label, values]) => ({
      weekLabel: label,
      output: values.get(KPI_LABELS[0]) ?? null,
      scrapRate: values.get(KPI_LABELS[1]) ?? null,
      oee: values.get(KPI_LABELS[2]) ?? null,
      insertion1: values.get(KPI_LABELS[3]) ?? null,
      insertion2: values.get(KPI_LABELS[4]) ?? null,
      insertion3: values.get(KPI_LABELS[5]) ?? null,
    }))
}

export function computeKpis(
  weekData: WeekDataPoint[],
  week: number,
  compareWeek: number | null,
): { kpiList: KpiDisplay[] | null; compareDiffValues: (string | null)[] } {
  const selected = weekData.find(w => weekNumberFromLabel(w.weekLabel) === week) ?? weekData[weekData.length - 1]

  if (!selected) {
    return { kpiList: null, compareDiffValues: [null, null, null, null, null, null] }
  }

  const compare = compareWeek ? weekData.find(w => weekNumberFromLabel(w.weekLabel) === compareWeek) : null
  const prev = compare ?? (weekData.length > 1 ? weekData[weekData.length - 2] : null)

  function calc(val: number | null, prevVal: number | null, unit: string, invert = false): KpiDisplay {
    const v = val ?? 0
    const p = prevVal ?? 0
    const rawDiff = invert ? p - v : v - p
    return {
      value: String(v),
      unit,
      diff: rawDiff,
      diffDirection: rawDiff >= 0 ? 'up' : 'down',
    }
  }

  const kpis = [
    calc(selected.output, prev?.output ?? null, 'units'),
    calc(selected.scrapRate, prev?.scrapRate ?? null, '%', true),
    calc(selected.oee, prev?.oee ?? null, '%'),
    calc(selected.insertion1, prev?.insertion1 ?? null, '%'),
    calc(selected.insertion2, prev?.insertion2 ?? null, '%'),
    calc(selected.insertion3, prev?.insertion3 ?? null, '%'),
  ]

  return { kpiList: kpis, compareDiffValues: kpis.map(k => formatDiff(k.diff)) }
}

function formatDiff(diff: number): string {
  const prefix = diff > 0 ? '+' : ''
  return `${prefix}${diff.toFixed(1)}`
}

export function buildChartWeekData(allWeekData: WeekDataPoint[], selectedWeek: number, count: number): WeekDataPoint[] {
  const dataMap = new Map(allWeekData.map(w => [weekNumberFromLabel(w.weekLabel), w]))

  const result: WeekDataPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const wn = selectedWeek - i
    if (wn < 1) continue
    result.push(dataMap.get(wn) ?? { weekLabel: weekLabelFromNumber(wn), output: null, scrapRate: null, oee: null, insertion1: null, insertion2: null, insertion3: null })
  }
  return result
}

export function splitHighlights(
  highlights: Highlight[],
  chartWeekData: WeekDataPoint[],
): { good: Highlight[]; bad: Highlight[] } {
  const chartWeekSet = new Set(chartWeekData.map(w => weekNumberFromLabel(w.weekLabel)))
  const byDate = (a: Highlight, b: Highlight) => a.record_date.localeCompare(b.record_date)
  const inChartWeek = (h: Highlight) => chartWeekSet.has(getISOWeek(h.record_date))

  return {
    good: highlights.filter(h => h.status === 'GOOD' && inChartWeek(h)).sort(byDate),
    bad: highlights.filter(h => h.status === 'BAD' && inChartWeek(h)).sort(byDate),
  }
}
