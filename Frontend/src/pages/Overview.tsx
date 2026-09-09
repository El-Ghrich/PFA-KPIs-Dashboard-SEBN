import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Factory,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Globe2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { overviewApi } from '../api/overview'
import { useSettings } from '../hooks/useSettings'
import { isoWeekRange } from '../lib/isoDate'
import { formatDateRange } from '../lib/format'
import type { OverviewResponse, ProjectOverviewCard } from '../types'

export default function Overview() {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize week & year from search params or default (Week 34 for 2026 data or current)
  const [year, setYear] = useState<number>(() => {
    const pYear = searchParams.get('year')
    return pYear ? parseInt(pYear, 10) : settings.defaultYear || 2026
  })

  const [week, setWeek] = useState<number>(() => {
    const pWeek = searchParams.get('week')
    // Default to 34 if 2026 (matching seeded weeks) or fallback to 34
    return pWeek ? parseInt(pWeek, 10) : 34
  })

  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch overview data
  const fetchOverview = useCallback(async (y: number, w: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await overviewApi.getOverview(y, w)
      setData(res)
    } catch (err) {
      console.error('Failed to fetch overview data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load company overview data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview(year, week)
  }, [fetchOverview, year, week])

  // Update searchParams when week/year change
  const changeWeek = (newWeek: number, newYear: number) => {
    setWeek(newWeek)
    setYear(newYear)
    setSearchParams({ week: String(newWeek), year: String(newYear) }, { replace: true })
  }

  const handlePrevWeek = () => {
    if (week > 1) {
      changeWeek(week - 1, year)
    } else {
      changeWeek(52, year - 1)
    }
  }

  const handleNextWeek = () => {
    if (week < 52) {
      changeWeek(week + 1, year)
    } else {
      changeWeek(1, year + 1)
    }
  }

  const handleCardClick = (project: ProjectOverviewCard) => {
    const params = new URLSearchParams({
      projectId: project.id,
      week: String(week),
      year: String(year),
      location: project.location,
    })
    navigate(`/dashboard?${params.toString()}`)
  }

  // Week range label
  const weekDates = useMemo(() => {
    try {
      const { monday, sunday } = isoWeekRange(year, week)
      return formatDateRange(monday, sunday)
    } catch {
      return ''
    }
  }, [year, week])

  // Extract distinct locations for filter tabs
  const locationOptions = useMemo(() => {
    if (!data?.locations) return ['All']
    return ['All', ...data.locations.map((l) => l.location)]
  }, [data?.locations])

  // Filter locations & projects
  const filteredLocations = useMemo(() => {
    if (!data?.locations) return []

    return data.locations
      .filter((loc) => selectedLocation === 'All' || loc.location === selectedLocation)
      .map((loc) => {
        if (!searchQuery.trim()) return loc
        const filteredProjects = loc.projects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sets.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        return {
          ...loc,
          projects: filteredProjects,
        }
      })
      .filter((loc) => loc.projects.length > 0)
  }, [data?.locations, selectedLocation, searchQuery])

  // Helpers for OEE color status
  const getOeeColor = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'text-on-surface-variant bg-surface-container'
    if (val >= 80.0) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (val >= 75.0) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-rose-700 bg-rose-50 border-rose-200'
  }

  const getOeeBadge = (val: number | null | undefined) => {
    if (val === null || val === undefined) return { label: 'No Data', variant: 'neutral' }
    if (val >= 80.0) return { label: 'Target Met', variant: 'success' }
    if (val >= 75.0) return { label: 'Near Target', variant: 'warning' }
    return { label: 'Needs Action', variant: 'danger' }
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-8">
          {/* ── 1. Hero Header & Quick Controls ────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2 border-b border-border-card">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                  <Globe2 className="w-3.5 h-3.5" />
                  SEBN Global Footprint
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
                  Live Operational Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                Manufacturing Overview
              </h1>
              <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
                Global plant performance, OEE scorecard, and operational metrics across all international production sites.
              </p>
            </div>

            {/* Week Selector Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-2 rounded-xl border border-border-card shadow-xs">
              <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 border border-border-card">
                <button
                  onClick={handlePrevWeek}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white rounded-md transition-all"
                  title="Previous Week"
                  aria-label="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 text-center min-w-[130px]">
                  <span className="text-xs font-bold text-on-surface block">
                    Week {week}, {year}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block font-medium">
                    {weekDates}
                  </span>
                </div>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white rounded-md transition-all"
                  title="Next Week"
                  aria-label="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jump to CW34 demo button if not on week 34 */}
              {week !== 34 && year === 2026 && (
                <button
                  onClick={() => changeWeek(34, 2026)}
                  className="px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg border border-primary/20 transition-colors"
                  title="Jump to latest populated week"
                >
                  CW34
                </button>
              )}

              <button
                onClick={() => fetchOverview(year, week)}
                disabled={isLoading}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Data"
                aria-label="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Error Notification if any ─────────────────────────────────────── */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button
                onClick={() => fetchOverview(year, week)}
                className="px-3 py-1 bg-white text-xs font-semibold rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── 2. Global Company KPI Summary Banner ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global OEE Card */}
            <div className="bg-white rounded-2xl p-5 border border-border-card shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Global Company OEE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-primary/10 text-primary">
                  Target 80%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-on-surface">
                  {isLoading ? '...' : data?.global_metrics.average_oee != null ? `${data.global_metrics.average_oee}%` : 'N/A'}
                </span>
                {data?.global_metrics.average_oee && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      data.global_metrics.average_oee >= 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {data.global_metrics.average_oee >= 80 ? 'Above Target' : 'Action Required'}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    (data?.global_metrics.average_oee ?? 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(data?.global_metrics.average_oee ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>
                  <strong>{data?.global_metrics.on_target_projects ?? 0}</strong> of {data?.global_metrics.total_projects ?? 0} projects meeting target
                </span>
              </p>
            </div>

            {/* Total Output Card */}
            <div className="bg-white rounded-2xl p-5 border border-border-card shadow-xs hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Total Weekly Output
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-on-surface">
                  {isLoading ? '...' : data?.global_metrics.total_output ? data.global_metrics.total_output.toLocaleString() : 'N/A'}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">units</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
                <span>Cumulative across all plant sets</span>
              </p>
            </div>

            {/* Average Scrap Rate Card */}
            <div className="bg-white rounded-2xl p-5 border border-border-card shadow-xs hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Avg Scrap Rate
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-surface-container text-on-surface-variant">
                  Target &lt; 2%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-on-surface">
                  {isLoading ? '...' : data?.global_metrics.average_scrap_rate != null ? `${data.global_metrics.average_scrap_rate}%` : 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Quality benchmark maintained</span>
              </p>
            </div>

            {/* Total Downtime Card */}
            <div className="bg-white rounded-2xl p-5 border border-border-card shadow-xs hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Total Downtime
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-on-surface">
                  {isLoading ? '...' : data?.global_metrics.total_downtime != null ? `${data.global_metrics.total_downtime}` : 'N/A'}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">hrs</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
                <span>Total recorded line stoppages</span>
              </p>
            </div>

            
          </div>

          {/* ── 3. Filter Bar (Location tabs + Search) ─────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-3.5 rounded-2xl items-center border border-border-card shadow-xs">
            {/* Location Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {locationOptions.map((loc) => {
                const isSelected = selectedLocation === loc
                const count =
                  loc === 'All'
                    ? data?.global_metrics.total_projects ?? 0
                    : data?.locations.find((l) => l.location === loc)?.projects_count ?? 0

                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{loc === 'All' ? 'All Plants' : `${loc} Plant`}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search projects (e.g. MEB31, BMW)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-surface-container/60 hover:bg-surface-container focus:bg-white border border-border-card focus:border-primary rounded-xl transition-colors outline-hidden text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* ── 4. Locations & Project Cards Grid ───────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="h-72 bg-white rounded-2xl border border-border-card p-6 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-5 bg-surface-container rounded-md w-1/3" />
                    <div className="h-4 bg-surface-container rounded-md w-1/2" />
                  </div>
                  <div className="h-12 bg-surface-container rounded-xl" />
                  <div className="h-16 bg-surface-container rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border-card p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface-variant mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-on-surface">No Projects Found</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                No manufacturing projects matched your search criteria for week {week}. Try resetting your filters.
              </p>
              <button
                onClick={() => {
                  setSelectedLocation('All')
                  setSearchQuery('')
                }}
                className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredLocations.map((locGroup) => (
                <div key={locGroup.location} className="space-y-4">
                  {/* Location Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-surface-container via-white to-surface-container/30 px-5 py-3.5 rounded-2xl border border-border-card">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-border-card shadow-xs flex items-center justify-center text-primary font-bold text-sm">
                        {locGroup.location.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-on-surface">{locGroup.location} Manufacturing Site</h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-border-card text-on-surface-variant">
                            {locGroup.projects.length} Active {locGroup.projects.length === 1 ? 'Project' : 'Projects'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Total Output: <strong>{locGroup.total_output?.toLocaleString() ?? 0} units</strong> this week
                        </p>
                      </div>
                    </div>

                    {/* Location OEE Badge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                          Plant Aggregate OEE
                        </span>
                        <span className="text-lg font-black text-on-surface">
                          {locGroup.average_oee != null ? `${locGroup.average_oee}%` : 'N/A'}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-xl text-xs font-bold border ${getOeeColor(
                          locGroup.average_oee
                        )}`}
                      >
                        {getOeeBadge(locGroup.average_oee).label}
                      </div>
                    </div>
                  </div>

                  {/* Project Cards in this Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {locGroup.projects.map((project) => {
                      const oeeBadge = getOeeBadge(project.oee)
                      const isTargetMet = project.oee != null && project.oee >= 80

                      return (
                        <div
                          key={project.id}
                          onClick={() => handleCardClick(project)}
                          className="bg-white rounded-2xl border border-border-card hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-300 p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                        >
                          {/* Accent Top Bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                              isTargetMet
                                ? 'bg-emerald-500'
                                : project.oee && project.oee >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />

                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {project.name}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ACTIVE
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
                                  <span className="font-medium">{project.sets_count} Sets:</span>
                                  <span className="truncate max-w-[200px] text-on-surface-variant/80">
                                    {project.sets.join(', ')}
                                  </span>
                                </p>
                              </div>

                              {/* OEE Status Pill */}
                              <div
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 ${getOeeColor(
                                  project.oee
                                )}`}
                              >
                                {oeeBadge.label}
                              </div>
                            </div>

                            {/* OEE Highlight Section */}
                            <div className="bg-surface-container/50 group-hover:bg-primary/5 rounded-xl p-3.5 border border-border-card group-hover:border-primary/20 transition-all mb-4">
                              <div className="flex items-baseline justify-between mb-1.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                  OEE Performance
                                </span>
                                {project.oee_diff != null && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                                      project.oee_diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {project.oee_diff >= 0 ? (
                                      <TrendingUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <TrendingDown className="w-3.5 h-3.5" />
                                    )}
                                    {project.oee_diff >= 0 ? `+${project.oee_diff}%` : `${project.oee_diff}%`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-on-surface">
                                  {project.oee != null ? `${project.oee}%` : 'N/A'}
                                </span>
                                <span className="text-xs text-on-surface-variant font-medium">
                                  target &gt;= 80%
                                </span>
                              </div>

                              {/* OEE Mini Progress Bar */}
                              <div className="w-full bg-border-card rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isTargetMet ? 'bg-emerald-500' : (project.oee ?? 0) >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(project.oee ?? 0, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Secondary Metrics Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                              <div className="bg-white p-2 rounded-xl border border-border-card">
                                <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                                  Output
                                </span>
                                <span className="text-xs font-bold text-on-surface block mt-0.5">
                                  {project.output != null ? project.output.toLocaleString() : 'N/A'}
                                </span>
                                <span className="text-[9px] text-on-surface-variant">units</span>
                              </div>

                              <div className="bg-white p-2 rounded-xl border border-border-card">
                                <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                                  Scrap Rate
                                </span>
                                <span
                                  className={`text-xs font-bold block mt-0.5 ${
                                    project.scrap_rate && project.scrap_rate > 2.0 ? 'text-amber-600' : 'text-on-surface'
                                  }`}
                                >
                                  {project.scrap_rate != null ? `${project.scrap_rate}%` : 'N/A'}
                                </span>
                                <span className="text-[9px] text-on-surface-variant">target &lt; 2%</span>
                              </div>

                              <div className="bg-white p-2 rounded-xl border border-border-card">
                                <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                                  Downtime
                                </span>
                                <span className="text-xs font-bold text-on-surface block mt-0.5">
                                  {project.downtime != null ? `${project.downtime}h` : 'N/A'}
                                </span>
                                <span className="text-[9px] text-on-surface-variant">hours</span>
                              </div>
                            </div>

                            {/* Weekly Highlight Snippet */}
                            {project.latest_highlight && (
                              <div
                                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border mb-3 ${
                                  project.highlight_status === 'GOOD'
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-800'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                                <span className="line-clamp-2 leading-relaxed">
                                  {project.latest_highlight}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Link */}
                          <div className="pt-3 border-t border-border-card flex items-center justify-between text-xs font-semibold text-primary group-hover:text-primary">
                            <span>Open Plant Dashboard</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
