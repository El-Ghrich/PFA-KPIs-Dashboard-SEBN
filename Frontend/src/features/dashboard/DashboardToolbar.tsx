import WeekNavigator from '../../components/WeekNavigator'
import { formatDateRange } from '../../lib/format'
import { getCurrentISOWeek, isoWeekRange } from '../../lib/isoDate'

interface DashboardToolbarProps {
  projectName: string
  setName?: string
  year: number
  week: number
  compareWeek: number | null
  onCompareWeekChange: (week: number, year: number) => void
}

export function DashboardToolbar({
  projectName,
  setName,
  year,
  week,
  compareWeek,
  onCompareWeekChange,
}: DashboardToolbarProps) {
  const { monday, sunday } = isoWeekRange(year, week)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 ml-1">
      {/* Left: project/set/date info */}
      <div className="text-[13px] sm:text-[15px] text-on-surface-variant/70 flex flex-wrap items-center gap-x-0 gap-y-0.5">
        <span className="font-semibold text-on-surface">{projectName}</span>
        <span className="mx-1.5 text-on-surface-variant/30">-</span>
        <span>{setName || 'All Sets'}</span>
        <span className="mx-1.5 text-on-surface-variant/30">-</span>
        <span className="text-[12px] sm:text-[14px]">{formatDateRange(monday, sunday, true)}</span>
      </div>

      {/* Right: compare week + export */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[12px] sm:text-[13px] text-on-surface-variant/70 whitespace-nowrap">compare with:</p>
        <WeekNavigator
          week={compareWeek ?? getCurrentISOWeek() - 1}
          year={year}
          onChange={onCompareWeekChange}
          showToday
          compare
          mainWeek={week}
          label=""
        />
        <button className="px-3 py-[7px] sm:px-4 sm:py-[9px] rounded-lg border border-border-card text-[12px] sm:text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
      </div>
    </div>
  )
}
