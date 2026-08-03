import { useEffect } from 'react'
import { Card } from './ui/Card'
import { Dropdown } from './ui/Dropdown'
import WeekNavigator from './WeekNavigator'
import { buildDefaultFilters } from '../features/dashboard/filters'
import { LOCATIONS, MACHINES, YEARS } from '../lib/constants'
import type { FilterState, Project } from '../types'

interface FilterBarProps {
  projects: Project[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  onWeekChange: (week: number, year: number) => void
}

export default function FilterBar({ projects, filters, onChange, onWeekChange }: FilterBarProps) {
  const filteredProjects = filters.location === 'All'
    ? projects
    : projects.filter(p => p.location === filters.location)

  useEffect(() => {
    if (filteredProjects.length === 0) return
    if (filteredProjects.some(p => p.id === filters.projectId)) return
    onChange({ ...filters, projectId: filteredProjects[0].id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.location, filters.projectId])

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial })
  }

  function handleReset() {
    onChange(buildDefaultFilters(projects))
  }

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center gap-6">
        <div className="flex items-end gap-3 flex-wrap">
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
            label="Machine"
            value={filters.machine}
            options={MACHINES.map(m => ({ value: m, label: m }))}
            onChange={machine => update({ machine })}
          />
        </div>

        <div className="flex flex-col gap-0.5">
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
          className="px-4 py-[9px] rounded-lg border border-border-card text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 whitespace-nowrap"
        >
          Reset
        </button>
      </div>
    </Card>
  )
}
