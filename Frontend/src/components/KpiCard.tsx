import { Card } from './ui/Card'

interface KpiCardProps {
  label: string
  value: string
  unit: string
  diffValue: string | null
  compareDirection: 'up' | 'down'
}

export default function KpiCard({ label, value, unit, diffValue, compareDirection }: KpiCardProps) {
  const isGood = compareDirection === 'up'
  const color = isGood ? '#22c55e' : '#ef4444'

  return (
    <Card className="flex flex-col gap-2 relative overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">{label}</p>
        {diffValue != null && (
          <span className="text-[13px] font-bold flex items-center gap-0.5 shrink-0 leading-tight px-2 py-0.5 rounded-md" style={{ color, backgroundColor: isGood ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
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
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold text-on-surface tabular-nums leading-none">{value}</span>
        <span className="text-[13px] font-medium text-on-surface-variant/60">{unit}</span>
      </div>
    </Card>
  )
}
