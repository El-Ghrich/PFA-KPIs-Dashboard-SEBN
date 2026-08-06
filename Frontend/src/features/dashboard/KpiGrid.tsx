import KpiCard from '../../components/KpiCard'
import { KPI_LABELS } from '../../lib/constants'
import type { KpiDisplay } from './transformers'

interface KpiGridProps {
  kpis: KpiDisplay[]
  diffValues: (string | null)[]
}

export function KpiGrid({ kpis, diffValues }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-6">
      {kpis.map((kpi, i) => (
        <KpiCard
          key={KPI_LABELS[i]}
          label={KPI_LABELS[i]}
          value={kpi.value}
          unit={kpi.unit}
          diffValue={diffValues[i]}
          compareDirection={kpi.diffDirection}
        />
      ))}
    </div>
  )
}
