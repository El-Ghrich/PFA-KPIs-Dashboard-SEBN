import { useState, useEffect } from 'react'
import type { Project } from '../types'

export interface FilterState {
  location: string
  projectId: string
  year: number
  week: number
  compareWeek: number | null
}

interface FilterBarProps {
  projects: Project[]
  defaultFilters: FilterState
  onApply: (filters: FilterState) => void
}

const LOCATIONS = ['All', 'Morocco', 'Mexico', 'Europe', 'Asia', 'USA']
const YEARS = [2024, 2025, 2026, 2027]
export default function FilterBar({ projects, defaultFilters, onApply }: FilterBarProps) {
  const [location, setLocation] = useState(defaultFilters.location)
  const [projectId, setProjectId] = useState(defaultFilters.projectId)
  const [year, setYear] = useState(defaultFilters.year)
  const [week, setWeek] = useState(defaultFilters.week)

  useEffect(() => {
    setLocation(defaultFilters.location)
    setProjectId(defaultFilters.projectId)
    setYear(defaultFilters.year)
    setWeek(defaultFilters.week)
  }, [defaultFilters])

  const filteredProjects = location === 'All'
    ? projects
    : projects.filter(p => p.location === location)

  useEffect(() => {
    if (filteredProjects.length > 0 && !filteredProjects.find(p => p.id === projectId)) {
      setProjectId(filteredProjects[0].id)
    }
  }, [location])

  function handleApply() {
    onApply({ location, projectId, year, week, compareWeek: defaultFilters.compareWeek })
  }

  function handleReset() {
    const now = new Date()
    const d = new Date(now)
    d.setDate(d.getDate() + 3 - ((now.getDay() + 6) % 7))
    const firstJan = new Date(d.getFullYear(), 0, 1)
    const currentWeek = Math.ceil(((d.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7)

    const defaultProj = projects.find(p => p.name === 'MEB21 HV') || projects[0]
    const reset: FilterState = {
      location: 'All',
      projectId: defaultProj?.id || '',
      year: 2026,
      week: currentWeek,
      compareWeek: currentWeek - 1,
    }
    setLocation(reset.location)
    setProjectId(reset.projectId)
    setYear(reset.year)
    setWeek(reset.week)
    onApply(reset)
  }

  const selectClass = "px-3 py-2 rounded-lg border border-border-card text-[13px] text-on-surface bg-white focus:outline-none focus:border-secondary appearance-none cursor-pointer min-w-0 pr-8"

  return (
    <div className="bg-white rounded-3xl border border-border-card shadow-sm p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Location</label>
          <select
            value={location}
            onChange={e => { setLocation(e.target.value) }}
            className={selectClass}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2375777d' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
          >
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className={selectClass}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2375777d' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
          >
            {filteredProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[100px]">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className={selectClass}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2375777d' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-border-card text-[12px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-primary text-white text-[12px] font-semibold hover:opacity-85 transition-opacity whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
