interface KpiCardProps {
  label: string
  value: string
  unit: string
  diffValue: string | null
  compareWeekLabel: string | null
  compareDirection: 'up' | 'down'
}

export default function KpiCard({ label, value, unit, diffValue, compareWeekLabel, compareDirection }: KpiCardProps) {
  const isGood = compareDirection === 'up'
  const color = isGood ? '#00a472' : '#e74c3c'

  return (
    <div className="bg-white rounded-3xl border border-border-card shadow-[1px_1px_9px_0px_rgba(0,0,0,0.1)] p-5 flex flex-col gap-2 relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_16px_rgba(0,0,0,0.08),1px_1px_9px_0px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between min-h-[34px]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">{label}</p>
        {(diffValue != null && compareWeekLabel != null) && (
          <div className="flex flex-col items-end gap-0 shrink-0">
            <span className="text-[13px] font-bold flex items-center gap-0.5 leading-tight" style={{ color }}>
              {isGood ? (
                <svg className="animate-float-up" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              ) : (
                <svg className="animate-float-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <polyline points="19 12 12 19 5 12"/>
                </svg>
              )}
              {diffValue}
            </span>
            <span className="text-[10px] text-on-surface-variant/50 font-medium leading-tight">{compareWeekLabel}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold text-on-surface tabular-nums leading-none">{value}</span>
        <span className="text-[13px] text-on-surface-variant/70">{unit}</span>
      </div>
    </div>
  )
}
