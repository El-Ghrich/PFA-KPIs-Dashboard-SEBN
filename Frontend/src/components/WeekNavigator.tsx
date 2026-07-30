import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react'

interface WeekNavigatorProps {
  week: number
  year: number
  onChange: (week: number, year: number) => void
  showToday?: boolean
  label?: string
  compare?: boolean
  mainWeek?: number
}

function mondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const jan4Monday = new Date(jan4)
  jan4Monday.setDate(jan4.getDate() - dayOffset)
  const monday = new Date(jan4Monday)
  monday.setDate(monday.getDate() + (week - 1) * 7)
  return monday
}

function getISOWeekInfo(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const tueFix = (d.getDay() + 6) % 7
  const thursday = new Date(d)
  thursday.setDate(d.getDate() + 3 - tueFix)
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const jan4Monday = new Date(jan4)
  jan4Monday.setDate(jan4.getDate() - dayOffset)
  const week = Math.ceil(((thursday.getTime() - jan4Monday.getTime()) / 86400000 + 1) / 7)
  const monday = new Date(d)
  monday.setDate(d.getDate() - tueFix)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { week, year, monday, sunday }
}

export default function WeekNavigator({ week, year, onChange, showToday = true, label, compare, mainWeek }: WeekNavigatorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const monday = mondayOfISOWeek(year, week)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function goToPreviousWeek() {
    const prev = new Date(monday)
    prev.setDate(prev.getDate() - 7)
    const info = getISOWeekInfo(prev)
    onChange(info.week, info.year)
  }

  function goToNextWeek() {
    const next = new Date(monday)
    next.setDate(next.getDate() + 7)
    const info = getISOWeekInfo(next)
    onChange(info.week, info.year)
  }

  function goToToday() {
    const info = getISOWeekInfo(new Date())
    onChange(info.week, info.year)
  }

  function pickWeek(w: number) {
    onChange(w, year)
    setOpen(false)
  }

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }

  return (
    <div className="inline-flex items-center gap-0 bg-white rounded-lg border border-border-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-200">
      {showToday && (
        <>
          <button
            onClick={compare ? () => onChange(Math.max(1, (mainWeek ?? week) - 1), year) : goToToday}
            className="flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-primary hover:bg-surface-container rounded-l-lg transition-colors duration-200"
          >
            {compare ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            {compare ? 'Previous Week' : 'Current Week'}
          </button>
          <div className="w-px h-5 bg-border-card" />
        </>
      )}
      {label && (
        <span className="flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-on-surface-variant/60 border-r border-border-card">
          {label === 'compare' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
          Previous Week
        </span>
      )}

      <button
        onClick={goToPreviousWeek}
        className="px-1.5 py-2 hover:bg-surface-container transition-colors duration-200"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
      </button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 justify-center hover:bg-surface-container py-2 transition-colors duration-200"
        >
          <span className="text-[13px] font-bold text-on-surface tabular-nums whitespace-nowrap">
            CW{String(week).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-on-surface-variant/50 font-medium whitespace-nowrap">
            {formatDateRange(monday, sunday)}
          </span>
          <ChevronDown className="w-3 h-3 text-on-surface-variant/30" />
        </button>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg border border-border-card shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 max-h-[280px] overflow-y-auto min-w-[130px] py-1">
            {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
              <button
                key={w}
                onClick={() => pickWeek(w)}
                className={`w-full px-3 py-1.5 text-[13px] text-left hover:bg-surface-container transition-colors duration-200 ${
                  w === week
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-on-surface'
                }`}
              >
                CW{String(w).padStart(2, '0')}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={goToNextWeek}
        className="px-1.5 py-2 hover:bg-surface-container transition-colors duration-200"
        aria-label="Next week"
      >
        <ChevronRight className="w-4 h-4 text-on-surface-variant" />
      </button>
    </div>
  )
}
