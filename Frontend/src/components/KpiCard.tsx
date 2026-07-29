interface KpiCardProps {
  label: string
  value: string
  unit: string
  trend: { direction: 'up' | 'down'; text: string; color?: string }
  chartColor: string
  chartData?: string
  limitLine?: boolean
}

export default function KpiCard({ label, value, unit, trend, chartColor, limitLine }: KpiCardProps) {
  const trendColor = trend.color || (trend.direction === 'up' ? '#00a472' : '#e67e22')
  return (
    <div className="dashboard-card bg-white rounded border border-border-card p-5 flex flex-col gap-2">
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
        <span className="text-[11px] text-on-surface-variant/60">{trend.direction === 'up' ? 'vs. target' : 'approaching limit'}</span>
      </div>
      <svg width="100%" height="32" className="mt-1" viewBox="0 0 200 32" preserveAspectRatio="none">
        <polyline points="0,28 20,22 40,24 60,18 80,20 100,14 120,16 140,10 160,12 180,6 200,8"
          fill="none" stroke={chartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {limitLine && <line x1="0" y1="26" x2="200" y2="26" stroke="#ba1a1a" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>}
      </svg>
    </div>
  )
}
