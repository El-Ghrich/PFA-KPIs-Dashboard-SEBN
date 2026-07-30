import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import WeekNavigator from './WeekNavigator'
import type { Project } from '../types'

export interface FilterState {
  location: string
  projectId: string
  year: number
  week: number
  compareWeek: number | null
  machine: string
}

interface FilterBarProps {
  projects: Project[]
  defaultFilters: FilterState
  onApply: (filters: FilterState) => void
  onWeekChange: (week: number, year: number) => void
}

const LOCATIONS = ['All', 'Morocco', 'Mexico', 'Europe', 'Asia', 'USA']
const YEARS = ['2024', '2025', '2026', '2027']
const MACHINES = ['All', 'C-401', 'C-402', 'C-403', 'P-205', 'V-101']

interface DropdownProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  className?: string
}

function FilterDropdown({ label, value, options, onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-border-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] min-w-[130px] text-[13px] font-medium text-on-surface hover:bg-surface-container transition-colors duration-200"
        >
          <span className="flex-1 text-left truncate">{selected?.label || value}</span>
          <ChevronDown className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-white rounded-lg border border-border-card shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 max-h-[220px] overflow-y-auto min-w-[150px] py-1">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3 py-1.5 text-[13px] text-left hover:bg-surface-container transition-colors duration-200 ${
                  opt.value === (value || options[0]?.value)
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FilterBar({ projects, defaultFilters, onApply, onWeekChange }: FilterBarProps) {
  const [location, setLocation] = useState(defaultFilters.location)
  const [projectId, setProjectId] = useState(defaultFilters.projectId)
  const [year, setYear] = useState(String(defaultFilters.year))
  const [machine, setMachine] = useState(defaultFilters.machine)
  const initial = useRef(true)

  useEffect(() => {
    setLocation(defaultFilters.location)
    setProjectId(defaultFilters.projectId)
    setYear(String(defaultFilters.year))
    setMachine(defaultFilters.machine)
  }, [defaultFilters])

  const filteredProjects = location === 'All'
    ? projects
    : projects.filter(p => p.location === location)

  useEffect(() => {
    if (filteredProjects.length > 0 && !filteredProjects.find(p => p.id === projectId)) {
      setProjectId(filteredProjects[0].id)
    }
  }, [location])

  useEffect(() => {
    if (initial.current) { initial.current = false; return }
    onApply({ location, projectId, year: Number(year), week: defaultFilters.week, compareWeek: defaultFilters.compareWeek, machine })
  }, [location, projectId, year, machine])

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
      machine: 'All',
    }
    setLocation(reset.location)
    setProjectId(reset.projectId)
    setYear(String(reset.year))
    setMachine(reset.machine)
    onApply(reset)
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 mb-4">
      <div className="flex justify-between items-center gap-6">
        <div className="flex items-end gap-3 flex-wrap">
          <FilterDropdown
            label="Location"
            value={location}
            options={LOCATIONS.map(l => ({ value: l, label: l }))}
            onChange={setLocation}
          />
          <FilterDropdown
            label="Project"
            value={projectId}
            options={filteredProjects.map(p => ({ value: p.id, label: p.name }))}
            onChange={setProjectId}
          />
          <FilterDropdown
            label="Year"
            value={year}
            options={YEARS.map(y => ({ value: y, label: y }))}
            onChange={setYear}
          />
          <FilterDropdown
            label="Machine"
            value={machine}
            options={MACHINES.map(m => ({ value: m, label: m }))}
            onChange={setMachine}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-gray-500">Week</label>
          <WeekNavigator
            week={defaultFilters.week}
            year={Number(year) || defaultFilters.year}
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
    </div>
  )
}
