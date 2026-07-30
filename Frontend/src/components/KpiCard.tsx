interface KpiCardProps {
  label: string
  value: string
  unit: string
  trend: { direction: 'up' | 'down'; text: string; color?: string }
}

export default function KpiCard({ label, value, unit, trend }: KpiCardProps) {
  const trendColor = trend.color || (trend.direction === 'up' ? '#00a472' : '#e67e22')
  return (
    <div className="dashboard-card bg-white rounded-3xl border border-border-card shadow-[1px_1px_9px_0px_rgba(0,0,0,0.1)]
 p-5 flex flex-col gap-2">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-[32px] font-bold text-on-surface tabular-nums leading-none">{value}</span>
        <span className="text-[14px] text-on-surface-variant pb-1">{unit}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: trendColor }}>
          {trend.direction === 'up' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
            </svg>
          )}
          {trend.text}
        </span>
      </div>
    </div>
  )
}
