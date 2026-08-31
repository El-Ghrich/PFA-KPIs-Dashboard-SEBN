import { useCallback, useEffect, useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar'
import { projectsApi } from '../api/projects'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { BREAKPOINT_DESKTOP } from '../lib/constants'
import { DashboardHeader } from '../features/dashboard/DashboardHeader'
import { DashboardToolbar } from '../features/dashboard/DashboardToolbar'
import { KpiGrid } from '../features/dashboard/KpiGrid'
import { TrendSection } from '../features/dashboard/TrendSection'
import { KeyTakeawaysSection } from '../features/dashboard/KeyTakeawaysSection'
import { buildDefaultFilters } from '../features/dashboard/filters'
import { useDashboardData } from '../features/dashboard/useDashboardData'
import { buildChartWeekData, computeKpis, groupRecords, splitHighlights } from '../features/dashboard/transformers'
import { useSettings } from '../hooks/useSettings'
import type { FilterState } from '../types'

export default function Dashboard() {
  const { settings } = useSettings()
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultFilters([], settings))
  const [projects, setProjects] = useState<any[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<Error | null>(null)
  const isDesktop = useBreakpoint(BREAKPOINT_DESKTOP)

  // Fetch projects function
  const fetchProjects = useCallback(async () => {
    setIsProjectsLoading(true)
    setProjectsError(null)
    try {
      const result = await projectsApi.list(1, 100)
      setProjects(result.items || [])
    } catch (error) {
      setProjectsError(error as Error)
    } finally {
      setIsProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (filters.projectId || projects.length === 0) return
    const defaultProj = projects.find(p => p.name === settings.defaultProjectName) || projects[0]
    setFilters(prev => (prev.projectId ? prev : { ...prev, projectId: defaultProj.id }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectId, projects, settings.defaultProjectName])

  const { data, isLoading, isError, error, refetch } = useDashboardData(filters)

  const allWeekData = useMemo(() => groupRecords(data?.records ?? []), [data?.records])

  const chartWeekData = useMemo(
    () => buildChartWeekData(allWeekData, filters.week, isDesktop ? settings.chartWeeksDesktop : settings.chartWeeksMobile),
    [allWeekData, filters.week, isDesktop, settings.chartWeeksDesktop, settings.chartWeeksMobile],
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

  if (isProjectsLoading) {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
            <EmptyState className="h-64" message="Loading projects..." />
          </div>
        </div>
      </main>
    )
  }

  if (projectsError) {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
            <ErrorState
              error={projectsError}
              onRetry={fetchProjects}
              isRetrying={isProjectsLoading}
            />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
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
            setName={projects.find(p => p.id === filters.projectId)?.sets?.find((s: { id: string; name: string }) => s.id === filters.setId)?.name}
            year={filters.year}
            week={filters.week}
            compareWeek={filters.compareWeek}
            onCompareWeekChange={(w, y) => setFilters(prev => ({ ...prev, compareWeek: w, year: y }))}
          />

          {isError ? (
            <ErrorState
              error={error}
              onRetry={refetch}
              compact
              className="mt-4"
            />
          ) : isLoading || !filters.projectId ? (
            <EmptyState className="h-64" message="Loading dashboard data..." />
          ) : (
            <>
              {kpiList && <KpiGrid kpis={kpiList} diffValues={compareDiffValues} />}
              <TrendSection weekData={chartWeekData} good={good} bad={bad} />
              <KeyTakeawaysSection projectId={filters.projectId} projectName={projectName} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}