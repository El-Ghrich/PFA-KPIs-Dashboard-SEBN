import type { ReactNode } from 'react'
import { weekLabel } from '../lib/isoDate'
import { Card } from './ui/Card'
import type { Highlight } from '../types'

interface HighlightsPanelProps {
  good: Highlight[]
  bad: Highlight[]
}

function HighlightCard({
  title,
  icon,
  accent,
  accentBg,
  items,
  emptyText,
}: {
  title: string
  icon: ReactNode
  accent: string
  accentBg: string
  items: Highlight[]
  emptyText: string
}) {
  return (
    <Card className="flex-1 min-h-0 flex flex-col hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: accentBg, color: accent }}>
            {icon}
          </span>
          <h3 className="text-[15px] font-semibold text-on-surface">{title}</h3>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: accentBg, color: accent }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-on-surface-variant/60 py-3">{emptyText}</p>
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto max-h-[84px] flex flex-col gap-2 pr-1">
          {items.map((h) => (
            <li key={h.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ backgroundColor: accentBg }}>
              <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5" style={{ color: accent }}>
                {weekLabel(h.record_date)}
              </span>
              <p className="text-[13px] text-on-surface leading-snug">{h.value}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function HighlightsPanel({ good, bad }: HighlightsPanelProps) {
  return (
    <div className="flex flex-col gap-5 min-w-0">
      <HighlightCard
        title="What Went Right"
        accent="#22c55e"
        accentBg="rgba(34,197,94,0.08)"
        emptyText="No positive highlights this period"
        items={good}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        }
      />
      <HighlightCard
        title="What Went Wrong"
        accent="#ef4444"
        accentBg="rgba(239,68,68,0.08)"
        emptyText="No issues highlighted this period"
        items={bad}
        icon={
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }
      />
    </div>
  )
}
