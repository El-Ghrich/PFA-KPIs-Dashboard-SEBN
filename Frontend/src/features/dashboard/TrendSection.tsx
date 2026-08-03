import HighlightsPanel from '../../components/HighlightsPanel'
import ProductionChart from '../../components/ProductionChart'
import type { Highlight } from '../../types'
import type { WeekDataPoint } from './transformers'

interface TrendSectionProps {
  weekData: WeekDataPoint[]
  good: Highlight[]
  bad: Highlight[]
}

export function TrendSection({ weekData, good, bad }: TrendSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <div className="lg:col-span-2 min-w-0">
        <ProductionChart
          weekLabels={weekData.map(w => w.weekLabel)}
          outputData={weekData.map(w => w.output)}
          oeeData={weekData.map(w => w.oee)}
        />
      </div>
      <HighlightsPanel good={good} bad={bad} />
    </div>
  )
}
