import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import FilterBar from '../components/FilterBar'
import { projectsApi } from '../api/projects'
import { EmptyState } from '../components/ui/EmptyState'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { BREAKPOINT_DESKTOP, CHART_WEEKS_DESKTOP, CHART_WEEKS_MOBILE, DEFAULT_PROJECT_NAME } from '../lib/constants'
import { DashboardHeader } from '../features/dashboard/DashboardHeader'
import { DashboardToolbar } from '../features/dashboard/DashboardToolbar'
import { KpiGrid } from '../features/dashboard/KpiGrid'
import { TrendSection } from '../features/dashboard/TrendSection'
import { buildDefaultFilters } from '../features/dashboard/filters'
import { useDashboardData } from '../features/dashboard/useDashboardData'
import { buildChartWeekData, computeKpis, groupRecords, splitHighlights } from '../features/dashboard/transformers'
import type { FilterState } from '../types'

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultFilters([]))
  const isDesktop = useBreakpoint(BREAKPOINT_DESKTOP)

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(1, 100),
  })
  const projects = projectsQuery.data?.items ?? []

  useEffect(() => {
    if (filters.projectId || projects.length === 0) return
    const defaultProj = projects.find(p => p.name === DEFAULT_PROJECT_NAME) || projects[0]
    setFilters(prev => (prev.projectId ? prev : { ...prev, projectId: defaultProj.id }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectId, projects])

  const { data, isLoading } = useDashboardData(filters)

  const allWeekData = useMemo(() => groupRecords(data?.records ?? []), [data?.records])

  const chartWeekData = useMemo(
    () => buildChartWeekData(allWeekData, filters.week, isDesktop ? CHART_WEEKS_DESKTOP : CHART_WEEKS_MOBILE),
    [allWeekData, filters.week, isDesktop],
  )

  const { kpiList, compareDiffValues } = useMemo(
    () => computeKpis(allWeekData, filters.week, filters.compareWeek),
    [allWeekData, filters.week, filters.compareWeek],
  )

  const { good, bad } = useMemo(
    () => splitHighlights(data?.highlights ?? [], chartWeekData),
    [data?.highlights, chartWeekData],
  )

  const projectName = projects.find(p => p.id === filters.projectId)?.name || ''

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-8 py-8">
          <DashboardHeader
            title="HCM-S Weekly Highlights"
            subtitle="Overview of performance and key highlights for the selected week and project"
          />

          <FilterBar
            projects={projects}
            filters={filters}
            onChange={setFilters}
            onWeekChange={(w, y) => setFilters(prev => ({ ...prev, week: w, year: y }))}
          />

          <DashboardToolbar
            projectName={projectName}
            machine={filters.machine}
            year={filters.year}
            week={filters.week}
            compareWeek={filters.compareWeek}
            onCompareWeekChange={(w, y) => setFilters(prev => ({ ...prev, compareWeek: w, year: y }))}
          />

          {isLoading || !filters.projectId ? (
            <EmptyState className="h-64" message="Loading dashboard data..." />
          ) : (
            <>
              {kpiList && <KpiGrid kpis={kpiList} diffValues={compareDiffValues} />}
              <TrendSection weekData={chartWeekData} good={good} bad={bad} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
