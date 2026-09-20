import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Factory,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe2,
  RefreshCw,
  Target,
} from 'lucide-react'
import { overviewApi } from '../api/overview'
import { useSettings } from '../hooks/useSettings'
import { isoWeekRange } from '../lib/isoDate'
import { formatDateRange } from '../lib/format'
import { CountryFlag } from '../components/CountryFlag'
import { RadialGauge } from '../components/RadialGauge'
import { getProjectStatus } from '../lib/projectStatusMap'
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
    return pWeek ? parseInt(pWeek, 10) : 34
  })

  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch overview data directly from DB via API
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

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* ── 1. Hero Header matching Reference Layout ──────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                  <Globe2 className="w-3.5 h-3.5" />
                  Manufacturing Overview
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SEBN Global Footprint
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-950">
                HCM-S CIM3 Global project overview
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Status of performance/launch across all SEBN plants
              </p>
            </div>

            {/* Controls Bar: OEE Target Indicator + Week Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* OEE Target Pill (as in reference image) */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-800 shadow-2xs">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold tracking-tight">OEE Target: 65%</span>
              </div>

              {/* Week Selector */}
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-2xs">
                <button
                  onClick={handlePrevWeek}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                  title="Previous Week"
                  aria-label="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 text-center min-w-[130px]">
                  <span className="text-xs font-bold text-slate-800 block">
                    Week {week}, {year}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    {weekDates}
                  </span>
                </div>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                  title="Next Week"
                  aria-label="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* CW34 demo button */}
              {week !== 34 && year === 2026 && (
                <button
                  onClick={() => changeWeek(34, 2026)}
                  className="px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-xl border border-primary/20 transition-colors"
                  title="Jump to latest populated week"
                >
                  CW34
                </button>
              )}

              <button
                onClick={() => fetchOverview(year, week)}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
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

          {/* ── 2. Real Totals & Metrics Summary Bar ──────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Real Global OEE Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Global Company OEE
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                  Target 80%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {isLoading
                    ? '...'
                    : data?.global_metrics.average_oee != null
                    ? `${data.global_metrics.average_oee}%`
                    : 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <strong>{data?.global_metrics.on_target_projects ?? 0}</strong> of{' '}
                  {data?.global_metrics.total_projects ?? 0} on target
                </span>
              </p>
            </div>

            {/* Real Total Output Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Weekly Output
                </span>
                <Factory className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {isLoading
                    ? '...'
                    : data?.global_metrics.total_output != null
                    ? Number(data.global_metrics.total_output).toLocaleString()
                    : 'N/A'}
                </span>
                <span className="text-xs text-slate-500 font-medium">units</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 truncate">
                Cumulative across all plant sets
              </p>
            </div>

            {/* Real Average Scrap Rate Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Avg Scrap Rate
                </span>
                <span className="text-[10px] font-semibold text-slate-500">Target &lt; 2%</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {isLoading
                    ? '...'
                    : data?.global_metrics.average_scrap_rate != null
                    ? `${data.global_metrics.average_scrap_rate}%`
                    : 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 truncate">
                Quality benchmark maintained
              </p>
            </div>

            {/* Real Total Downtime Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Downtime
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {isLoading
                    ? '...'
                    : data?.global_metrics.total_downtime != null
                    ? `${data.global_metrics.total_downtime}`
                    : 'N/A'}
                </span>
                <span className="text-xs text-slate-500 font-medium">hrs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 truncate">
                Recorded line stoppage duration
              </p>
            </div>
          </div>

          {/* ── 3. Interactive Filter Bar (Location tabs + Search) ─────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            {/* Location Filter Pills */}
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{loc === 'All' ? 'All Plants' : `${loc} Plant`}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects (e.g. MEB31, BMW)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-primary rounded-lg transition-colors outline-hidden text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* ── 4. Project Cards Grid (100% Real DB Data) ──────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="h-64 bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-slate-200 rounded-xs" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
                      <div className="h-3 bg-slate-200 rounded-sm w-1/2" />
                    </div>
                  </div>
                  <div className="w-32 h-20 bg-slate-100 rounded-xl mx-auto" />
                  <div className="h-4 bg-slate-200 rounded-sm w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No manufacturing projects matched your search criteria for week {week}.
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
            <div className="space-y-6">
              {filteredLocations.map((locGroup) => (
                <div key={locGroup.location} className="space-y-3">
                  {/* Subtle, unnoticeable country separator line with real totals */}
                  <div className="flex items-center gap-3 pt-2 text-slate-400">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {locGroup.location} Manufacturing Site
                    </span>
                    {locGroup.average_oee != null && (
                      <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                        (Avg OEE: <strong className="text-slate-600">{locGroup.average_oee}%</strong> • Output: <strong className="text-slate-600">{locGroup.total_output?.toLocaleString()}</strong>)
                      </span>
                    )}
                    <div className="flex-1 h-px bg-slate-200/70" />
                  </div>

                  {/* Project Cards in a 4-column responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {locGroup.projects.map((project) => {
                      const status = getProjectStatus(project.name, project.oee)

                      return (
                        <div
                          key={project.id}
                          onClick={() => handleCardClick(project)}
                          className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400/80 shadow-2xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 cursor-pointer flex flex-col justify-between group"
                        >
                          {/* Card Header: Real Flag from project.location + Real project.name + Real sets */}
                          <div className="flex items-start gap-3 mb-2">
                            <CountryFlag country={project.location} className="w-8 h-5.5 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {project.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                {project.location} • {project.sets && project.sets.length > 0 ? project.sets.join(', ') : `${project.sets_count} Sets`}
                              </p>
                            </div>
                          </div>

                          {/* Card Body: Semicircular Radial OEE Gauge displaying Real OEE */}
                          <div className="py-2 flex items-center justify-center">
                            <RadialGauge value={project.oee} target={65} />
                          </div>

                          {/* Card Footer: Only the status note (Successful launch or Ramp-up phase) */}
                          <div className="text-center pt-2 mt-auto border-t border-slate-100">
                            <span className={`text-xs font-bold ${status.statusColor}`}>
                              {status.statusNote}
                            </span>
                            {project.latest_highlight && (
                              <p
                                className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px] mx-auto font-medium"
                                title={project.latest_highlight}
                              >
                                {project.latest_highlight}
                              </p>
                            )}
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
