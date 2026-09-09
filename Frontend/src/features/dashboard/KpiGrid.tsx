import KpiCard from '../../components/KpiCard'
import { KPI_LABELS } from '../../lib/constants'
import type { KpiDisplay } from './transformers'
import type { KpiTargets } from '../../hooks/useSettings'

interface KpiGridProps {
  kpis: KpiDisplay[]
  diffValues: (string | null)[]
  targets?: KpiTargets
}

export function KpiGrid({ kpis, diffValues, targets }: KpiGridProps) {
  const getTarget = (index: number): number | undefined => {
    if (!targets) return undefined
    switch (index) {
      case 0:
        return targets.output
      case 1:
        return targets.scrapRate
      case 2:
        return targets.oee
      case 3:
        return targets.insertion1
      case 4:
        return targets.insertion2
      case 5:
        return targets.insertion3
      default:
        return undefined
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 mb-6">
      {kpis.map((kpi, i) => (
        <KpiCard
          key={KPI_LABELS[i]}
          label={KPI_LABELS[i]}
          value={kpi.value}
          unit={kpi.unit}
          diffValue={diffValues[i]}
          compareDirection={kpi.diffDirection}
          target={getTarget(i)}
        />
      ))}
    </div>
  )
}
