import { useState, useEffect } from 'react'
import Header from '../components/Header'
import KpiCard from '../components/KpiCard'
import ProductionChart from '../components/ProductionChart'
import AlarmsTable from '../components/AlarmsTable'
import FilterBar from '../components/FilterBar'
import WeekNavigator from '../components/WeekNavigator'
import type { FilterState } from '../components/FilterBar'
import { projectsApi } from '../api/projects'
import { kpisApi } from '../api/kpis'
import type { Project, KPIRecord } from '../types'

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
    compareWeek: currentWeek -1,
  })
  const [allWeekData, setAllWeekData] = useState<WeekDataPoint[]>([])
  const [kpiList, setKpiList] = useState<KpiDisplay[] | null>(null)
  const [compareWeekLabel, setCompareWeekLabel] = useState<string | null>(null)
  const [compareDiffValues, setCompareDiffValues] = useState<(string | null)[]>([null, null, null, null])

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
        const records = await kpisApi.getRecords(
          appliedFilters.projectId,
          'WEEKLY',
          appliedFilters.year,
        )
        const sorted = groupRecords(records)
        setAllWeekData(sorted)

        const byWeekNum = (w: WeekDataPoint) => parseInt(w.weekLabel.replace('CW', ''))

        const selected = sorted.find(w => byWeekNum(w) === appliedFilters.week)
          ?? sorted[sorted.length - 1]

        const compare = appliedFilters.compareWeek
          ? sorted.find(w => byWeekNum(w) === appliedFilters.compareWeek)
          : null

        const cwLabel = appliedFilters.compareWeek
          ? `vs CW${String(appliedFilters.compareWeek).padStart(2, '0')}`
          : null
        setCompareWeekLabel(cwLabel)

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

  const chartWeekData = isDesktop ? allWeekData : allWeekData.slice(-4)

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
      <Header
        title="HCM-S Weekly Highlights"
        subtitle="Overview of performance and key highlights for the selected week and project"
        currentTime={formatTime(now)}
        currentDate={formatDate(now)}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <FilterBar
          projects={projects}
          defaultFilters={appliedFilters}
          onApply={setAppliedFilters}
        />

        <div className="flex items-center gap-3 flex-wrap mb-6">
          <WeekNavigator
            week={appliedFilters.week}
            year={appliedFilters.year}
            onChange={(w, y) => setAppliedFilters(prev => ({ ...prev, week: w, year: y }))}
            showToday
          />
          <WeekNavigator
            week={appliedFilters.compareWeek ?? getCurrentISOWeek() - 1}
            year={appliedFilters.year}
            onChange={(w, y) => setAppliedFilters(prev => ({ ...prev, compareWeek: w, year: y }))}
            showToday={false}
            label="compare to"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant text-[15px] font-medium">
            Loading dashboard data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpiList && kpiList.map((kpi, i) => (
                <KpiCard
                  key={labels[i]}
                  label={labels[i]}
                  value={kpi.value}
                  unit={kpi.unit}
                  diffValue={compareDiffValues[i]}
                  compareWeekLabel={compareWeekLabel}
                  compareDirection={kpi.diffDirection}
                />
              ))}
            </div>

            <div className="mb-6">
              <ProductionChart
                weekLabels={chartWeekData.map(w => w.weekLabel)}
                outputData={chartWeekData.map(w => w.output)}
                oeeData={chartWeekData.map(w => w.oee)}
              />
            </div>

            <AlarmsTable />
          </>
        )}
      </div>
    </main>
  )
}
