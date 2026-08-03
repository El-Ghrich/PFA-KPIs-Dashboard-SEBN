import WeekNavigator from '../../components/WeekNavigator'
import { formatDateRange } from '../../lib/format'
import { getCurrentISOWeek, isoWeekRange } from '../../lib/isoDate'

interface DashboardToolbarProps {
  projectName: string
  machine: string
  year: number
  week: number
  compareWeek: number | null
  onCompareWeekChange: (week: number, year: number) => void
}

export function DashboardToolbar({
  projectName,
  machine,
  year,
  week,
  compareWeek,
  onCompareWeekChange,
}: DashboardToolbarProps) {
  const { monday, sunday } = isoWeekRange(year, week)

  return (
    <div className="flex items-center justify-between mb-4 ml-1">
      <div className="text-[15px] text-on-surface-variant/70 flex items-center gap-0">
        <span className="font-semibold text-on-surface">{projectName}</span>
        <span className="mx-1.5 text-on-surface-variant/30">-</span>
        <span>{machine}</span>
        <span className="mx-1.5 text-on-surface-variant/30">-</span>
        <span>{formatDateRange(monday, sunday, true)}</span>
      </div>
      <div className="flex items-center gap-3">
        <p className="mx-1.5 text-[15px] text-on-surface-variant/90">compare with:</p>
        <WeekNavigator
          week={compareWeek ?? getCurrentISOWeek() - 1}
          year={year}
          onChange={onCompareWeekChange}
          showToday
          compare
          mainWeek={week}
          label=""
        />
        <button className="px-4 py-[9px] rounded-lg border border-border-card text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
      </div>
    </div>
  )
}
