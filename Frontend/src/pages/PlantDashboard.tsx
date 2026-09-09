import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import type { FilterState, Project } from '../types'

export default function PlantDashboard() {
  const { settings } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<FilterState>(() => {
    const base = buildDefaultFilters([], settings)
    const paramProjId = searchParams.get('projectId')
    const paramWeek = searchParams.get('week') ? parseInt(searchParams.get('week')!, 10) : null
    const paramYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null
    const paramSetId = searchParams.get('setId')
    const paramLocation = searchParams.get('location')

    return {
      ...base,
      ...(paramLocation ? { location: paramLocation } : {}),
      ...(paramProjId ? { projectId: paramProjId } : {}),
      ...(paramWeek ? { week: paramWeek, compareWeek: paramWeek > 1 ? paramWeek - 1 : null } : {}),
      ...(paramYear ? { year: paramYear } : {}),
      ...(paramSetId ? { setId: paramSetId } : {}),
    }
  })

  const [projects, setProjects] = useState<Project[]>([])
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

  // Resolve project and set when projects are loaded or query parameters change
  useEffect(() => {
    if (projects.length === 0) return

    const paramProjId = searchParams.get('projectId')
    const targetProj = (paramProjId ? projects.find(p => p.id === paramProjId) : null)
      || (filters.projectId ? projects.find(p => p.id === filters.projectId) : null)
      || projects.find(p => p.name === settings.defaultProjectName)
      || projects[0]

    if (!targetProj) return

    const sets = targetProj.sets ?? []
    const paramSetId = searchParams.get('setId')
    const defaultSet = (paramSetId ? sets.find(s => s.id === paramSetId) : null)
      || (filters.setId ? sets.find(s => s.id === filters.setId) : null)
      || sets.find(s => s.name.toLowerCase() === 'set 1' || s.name === '1')
      || sets[0]

    setFilters(prev => {
      const nextProjId = targetProj.id
      const nextSetId = defaultSet?.id || ''
      const nextLoc = targetProj.location || prev.location || 'All'

      if (prev.projectId === nextProjId && prev.setId === nextSetId && prev.location === nextLoc) {
        return prev
      }

      return {
        ...prev,
        projectId: nextProjId,
        setId: nextSetId,
        location: nextLoc,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, searchParams, settings.defaultProjectName])

  const updateFiltersAndParams = useCallback((newFiltersOrUpdater: FilterState | ((prev: FilterState) => FilterState)) => {
    setFilters(prev => {
      const updated = typeof newFiltersOrUpdater === 'function' ? newFiltersOrUpdater(prev) : newFiltersOrUpdater
      const params: Record<string, string> = {
        projectId: updated.projectId,
        week: String(updated.week),
        year: String(updated.year),
      }
      if (updated.setId) params.setId = updated.setId
      if (updated.location && updated.location !== 'All') params.location = updated.location
      setSearchParams(params, { replace: true })
      return updated
    })
  }, [setSearchParams])

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

  const currentProject = projects.find(p => p.id === filters.projectId)
  const projectName = currentProject?.name || ''
  const currentSetName = currentProject?.sets?.find((s: { id: string; name: string }) => s.id === filters.setId)?.name

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
          {/* Back Navigation to Overview */}
          <div className="mb-4">
            <Link
              to={`/?week=${filters.week}&year=${filters.year}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-border-card text-on-surface-variant hover:text-primary hover:border-primary/40 shadow-xs transition-all duration-200 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>← Back to Company Overview</span>
            </Link>
          </div>

          <DashboardHeader
            title="HCM-S Weekly Highlights"
            subtitle="Detailed plant performance, trends, and operational highlights for the selected project"
          />

          <FilterBar
            projects={projects}
            filters={filters}
            onChange={updateFiltersAndParams}
            onWeekChange={(w, y) => updateFiltersAndParams(prev => ({ ...prev, week: w, year: y }))}
          />

          <DashboardToolbar
            projectName={projectName}
            setName={currentSetName}
            year={filters.year}
            week={filters.week}
            compareWeek={filters.compareWeek}
            onCompareWeekChange={(w, y) => updateFiltersAndParams(prev => ({ ...prev, compareWeek: w, year: y }))}
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
              {kpiList && <KpiGrid kpis={kpiList} diffValues={compareDiffValues} targets={settings.kpiTargets} />}
              <TrendSection weekData={chartWeekData} good={good} bad={bad} />
              <KeyTakeawaysSection projectId={filters.projectId} projectName={projectName} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
