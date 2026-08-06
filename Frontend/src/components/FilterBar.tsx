import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Dropdown } from './ui/Dropdown'
import WeekNavigator from './WeekNavigator'
import { buildDefaultFilters } from '../features/dashboard/filters'
import { LOCATIONS, YEARS } from '../lib/constants'
import type { FilterState, Project } from '../types'
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react'

interface FilterBarProps {
  projects: Project[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  onWeekChange: (week: number, year: number) => void
}

export default function FilterBar({ projects, filters, onChange, onWeekChange }: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredProjects = filters.location === 'All'
    ? projects
    : projects.filter(p => p.location === filters.location)

  const selectedProject = projects.find(p => p.id === filters.projectId)
  const projectSets = selectedProject?.sets ?? []
  const setOptions = [
    { value: 'All', label: 'All Sets' },
    ...projectSets.map(s => ({ value: s.id, label: s.name }))
  ]

  useEffect(() => {
    if (filteredProjects.length === 0) return
    if (filteredProjects.some(p => p.id === filters.projectId)) return
    onChange({ ...filters, projectId: filteredProjects[0].id, setId: 'All' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.location, filters.projectId])

  useEffect(() => {
    if (filters.setId !== 'All' && !projectSets.some(s => s.id === filters.setId)) {
      onChange({ ...filters, setId: 'All' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectId])

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial })
  }

  function handleReset() {
    onChange(buildDefaultFilters(projects))
    setMobileOpen(false)
  }

  return (
    <Card className="mb-4">

      {/* ── Mobile header row ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        {/* Left: Filters toggle */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-on-surface min-w-0"
        >
          <SlidersHorizontal className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate">Filters</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-on-surface-variant/60 flex-shrink-0 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Right: compact week navigator — always visible on mobile */}
        <WeekNavigator
          week={filters.week}
          year={filters.year}
          onChange={onWeekChange}
          showToday={false}
          compact
        />
      </div>

      {/* ── Expandable filters panel ────────────────────────── */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} sm:block`}>
        <div className="sm:hidden mt-3 mb-3 border-t border-border-card" />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

          {/* Dropdown grid */}
          <div className="grid grid-cols-2 sm:flex sm:items-end gap-3 sm:flex-wrap">
            <Dropdown
              label="Location"
              value={filters.location}
              options={LOCATIONS.map(l => ({ value: l, label: l }))}
              onChange={location => update({ location })}
            />
            <Dropdown
              label="Project"
              value={filters.projectId}
              options={filteredProjects.map(p => ({ value: p.id, label: p.name }))}
              onChange={projectId => update({ projectId })}
            />
            <Dropdown
              label="Year"
              value={String(filters.year)}
              options={YEARS.map(y => ({ value: y, label: y }))}
              onChange={year => update({ year: Number(year) })}
            />
            <Dropdown
              label="Set"
              value={filters.setId}
              options={setOptions}
              onChange={setId => update({ setId })}
            />
          </div>

          {/* Week navigator (desktop) + Reset */}
          <div className="flex items-end gap-3">
            {/* Week nav: desktop only (mobile uses the compact one in the header) */}
            <div className="hidden sm:flex flex-col gap-0.5">
              <label className="text-xs font-medium text-gray-500">Week</label>
              <WeekNavigator
                week={filters.week}
                year={filters.year}
                onChange={onWeekChange}
                showToday
              />
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-[9px] rounded-lg border border-border-card text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
