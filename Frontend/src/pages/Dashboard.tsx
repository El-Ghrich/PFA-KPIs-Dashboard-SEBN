import { useState, useEffect } from 'react'
import Header from '../components/Header'
import KpiCard from '../components/KpiCard'
import ProductionChart from '../components/ProductionChart'
import AlarmsTable from '../components/AlarmsTable'
import HighlightsPanel from '../components/HighlightsPanel'
import FilterBar from '../components/FilterBar'
import WeekNavigator from '../components/WeekNavigator'
import type { FilterState } from '../components/FilterBar'
import { projectsApi } from '../api/projects'
import { kpisApi } from '../api/kpis'
import { highlightsApi } from '../api/highlights'
import type { Project, KPIRecord, Highlight } from '../types'

function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr)
  const d = new Date(date)
  d.setDate(d.getDate() + 3 - ((date.getDay() + 6) % 7))
  const firstJan = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7)
}

function getCurrentISOWeek(): number {
  const now = new Date()
  const d = new Date(now)
  d.setDate(d.getDate() + 3 - ((now.getDay() + 6) % 7))
  const firstJan = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7)
}

function mondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const jan4Monday = new Date(jan4)
  jan4Monday.setDate(jan4.getDate() - dayOffset)
  const monday = new Date(jan4Monday)
  monday.setDate(monday.getDate() + (week - 1) * 7)
  return monday
}

interface WeekDataPoint {
  weekLabel: string
  output: number | null
  scrapRate: number | null
  oee: number | null
  downtime: number | null
}

function groupRecords(records: KPIRecord[]): WeekDataPoint[] {
  const weekMap = new Map<string, Map<string, number | null>>()
  for (const rec of records) {
    if (!rec.kpi_definition) continue
    const weekNum = getISOWeek(rec.record_date)
    const weekKey = `CW${String(weekNum).padStart(2, '0')}`
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map())
    weekMap.get(weekKey)!.set(rec.kpi_definition.name, rec.numeric_value)
  }

  return [...weekMap.entries()]
    .sort(([a], [b]) => {
      const na = parseInt(a.replace('CW', ''))
      const nb = parseInt(b.replace('CW', ''))
      if (na !== nb) return na - nb
      return a.localeCompare(b)
    })
    .map(([weekLabel, values]) => ({
      weekLabel,
      output: values.get('Output') ?? null,
      scrapRate: values.get('Scrap Rate') ?? null,
      oee: values.get('OEE') ?? null,
      downtime: values.get('Downtime') ?? null,
    }))
}

interface KpiDisplay {
  value: string
  unit: string
  diff: number
  diffDirection: 'up' | 'down'
}

function useBreakpoint(bp: number): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= bp)
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= bp)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [bp])
  return wide
}

const currentWeek = getCurrentISOWeek()

export default function Dashboard() {
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    location: 'All',
    projectId: '',
    year: 2026,
    week: currentWeek,
    compareWeek: currentWeek - 1,
    machine: 'All',
  })
  const [allWeekData, setAllWeekData] = useState<WeekDataPoint[]>([])
  const [kpiList, setKpiList] = useState<KpiDisplay[] | null>(null)
  const [compareDiffValues, setCompareDiffValues] = useState<(string | null)[]>([null, null, null, null])
  const [highlights, setHighlights] = useState<Highlight[]>([])

  const isDesktop = useBreakpoint(768)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    projectsApi.list(1, 100).then(res => {
      setProjects(res.items)
      const defaultProj = res.items.find(p => p.name === 'MEB21 HV') || res.items[0]
      if (defaultProj) {
        setAppliedFilters(prev => prev.projectId ? prev : { ...prev, projectId: defaultProj.id })
      }
    })
  }, [])

  useEffect(() => {
    if (!appliedFilters.projectId) return
    async function load() {
      setLoading(true)
      try {
        const [records, hl] = await Promise.all([
          kpisApi.getRecords(
            appliedFilters.projectId,
            'WEEKLY',
            appliedFilters.year,
          ),
          highlightsApi.list(appliedFilters.projectId, 'WEEKLY', appliedFilters.year),
        ])
        setHighlights(hl)
        const sorted = groupRecords(records)
        setAllWeekData(sorted)

        const byWeekNum = (w: WeekDataPoint) => parseInt(w.weekLabel.replace('CW', ''))

        const selected = sorted.find(w => byWeekNum(w) === appliedFilters.week)
          ?? sorted[sorted.length - 1]

        const compare = appliedFilters.compareWeek
          ? sorted.find(w => byWeekNum(w) === appliedFilters.compareWeek)
          : null

        if (selected) {
          const prev = compare ?? (sorted.length > 1 ? sorted[sorted.length - 2] : null)

          function calc(val: number | null, prevVal: number | null, unit: string, invert = false): KpiDisplay {
            const v = val ?? 0
            const p = prevVal ?? 0
            const rawDiff = invert ? p - v : v - p
            const dir = rawDiff >= 0 ? ('up' as const) : ('down' as const)
            return { value: String(v), unit, diff: rawDiff, diffDirection: dir }
          }

          const kpis = [
            calc(selected.output, prev?.output ?? null, 'units'),
            calc(selected.scrapRate, prev?.scrapRate ?? null, '%', true),
            calc(selected.oee, prev?.oee ?? null, '%'),
            calc(selected.downtime, prev?.downtime ?? null, 'hrs', true),
          ]
          setKpiList(kpis)

          function formatDiff(diff: number): string {
            const prefix = diff > 0 ? '+' : ''
            return `${prefix}${diff.toFixed(1)}`
          }
          setCompareDiffValues(kpis.map(k => formatDiff(k.diff)))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [appliedFilters])

  const chartWeekData = (() => {
    const count = isDesktop ? 8 : 4
    const selected = appliedFilters.week
    const byWeekNum = (w: WeekDataPoint) => parseInt(w.weekLabel.replace('CW', ''))
    const dataMap = new Map(allWeekData.map(w => [byWeekNum(w), w]))

    const result: WeekDataPoint[] = []
    for (let i = count - 1; i >= 0; i--) {
      const wn = selected - i
      if (wn < 1) continue
      const label = `CW${String(wn).padStart(2, '0')}`
      const existing = dataMap.get(wn)
      result.push(existing ?? { weekLabel: label, output: null, scrapRate: null, oee: null, downtime: null })
    }
    return result
  })()

  const chartWeekSet = new Set(chartWeekData.map(w => parseInt(w.weekLabel.replace('CW', ''))))
  const byDate = (a: Highlight, b: Highlight) => a.record_date.localeCompare(b.record_date)
  const inChartWeek = (h: Highlight) => chartWeekSet.has(getISOWeek(h.record_date))
  const goodHighlights = highlights.filter(h => h.status === 'GOOD' && inChartWeek(h)).sort(byDate)
  const badHighlights = highlights.filter(h => h.status === 'BAD' && inChartWeek(h)).sort(byDate)

  const projectName = projects.find(p => p.id === appliedFilters.projectId)?.name || ''

  const weekMonday = mondayOfISOWeek(appliedFilters.year, appliedFilters.week)
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)

  const formatDateRange = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const yearOpts: Intl.DateTimeFormatOptions = { year: 'numeric' }
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)} ${end.toLocaleDateString('en-US', yearOpts)}`
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('en-US', { hour12: false })
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Chicago',
    }).toUpperCase().replace(',', ' · CST')
  }

  const labels = ['Output', 'Scrap Rate', 'OEE', 'Downtime']

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-8 py-8">
          <Header
            title="HCM-S Weekly Highlights"
            subtitle="Overview of performance and key highlights for the selected week and project"
            currentTime={formatTime(now)}
            currentDate={formatDate(now)}
          />

          <FilterBar
            projects={projects}
            defaultFilters={appliedFilters}
            onApply={setAppliedFilters}
            onWeekChange={(w, y) => setAppliedFilters(prev => ({ ...prev, week: w, year: y }))}
          />

          <div className="flex items-center justify-between mb-4 ml-1">
            <div className="text-[15px] text-on-surface-variant/70 flex items-center gap-0">
              <span className="font-semibold text-on-surface">{projectName}</span>
              <span className="mx-1.5 text-on-surface-variant/30">-</span>
              <span>{appliedFilters.machine}</span>
              <span className="mx-1.5 text-on-surface-variant/30">-</span>
              <span>{formatDateRange(weekMonday, weekSunday)}</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="mx-1.5 text-[15px] text-on-surface-variant/90">compare with:</p>
              
              <WeekNavigator
                week={appliedFilters.compareWeek ?? currentWeek - 1}
                year={appliedFilters.year}
                onChange={(w, y) => setAppliedFilters(prev => ({ ...prev, compareWeek: w, year: y }))}
                showToday={true}
                compare={true}
                mainWeek={appliedFilters.week}
                label=""
              />
              <button className="px-4 py-[9px] rounded-lg border border-border-card text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-on-surface-variant text-[14px] font-medium">
              Loading dashboard data...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {kpiList && kpiList.map((kpi, i) => (
                  <KpiCard
                    key={labels[i]}
                    label={labels[i]}
                    value={kpi.value}
                    unit={kpi.unit}
                    diffValue={compareDiffValues[i]}
                    compareDirection={kpi.diffDirection}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <div className="lg:col-span-2 min-w-0">
                  <ProductionChart
                    weekLabels={chartWeekData.map(w => w.weekLabel)}
                    outputData={chartWeekData.map(w => w.output)}
                    oeeData={chartWeekData.map(w => w.oee)}
                  />
                </div>
                <HighlightsPanel good={goodHighlights} bad={badHighlights} />
              </div>

              <AlarmsTable />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
