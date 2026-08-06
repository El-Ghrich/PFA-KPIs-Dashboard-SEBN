import { Chart } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
  type TooltipItem,
} from 'chart.js'
import { Card } from './ui/Card'
import { CHART_TARGET } from '../lib/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

type MixedChart = 'bar' | 'line'
type MixedData = ChartData<MixedChart, (number | null)[], string>
type MixedOptions = ChartOptions<MixedChart>

interface ProductionChartProps {
  weekLabels: string[]
  outputData: (number | null)[]
  oeeData: (number | null)[]
}

const COLORS = {
  bar: '#3b82f6',
  barBorder: '#3b82f6',
  target: '#ef4444',
  oee: '#22c55e',
  grid: '#f1f5f9',
  text: '#94a3b8',
}

export default function ProductionChart({ weekLabels, outputData, oeeData }: ProductionChartProps) {
  const targetData = outputData.map(() => CHART_TARGET)

  const data: MixedData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Output (Sets)',
        data: outputData,
        type: 'bar',
        backgroundColor: (ctx: ScriptableContext<'bar'>) => {
          if (!ctx.chart.chartArea) return `${COLORS.bar}cc`
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, COLORS.bar)
          g.addColorStop(1, `${COLORS.bar}15`)
          return g
        },
        borderColor: COLORS.barBorder,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.5,
        order: 2,
        yAxisID: 'y',
      },
      {
        label: 'Target (Sets)',
        data: targetData,
        type: 'line',
        borderColor: COLORS.target,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          if (!ctx.chart.chartArea) return `${COLORS.target}08`
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, `${COLORS.target}18`)
          g.addColorStop(1, `${COLORS.target}00`)
          return g
        },
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: COLORS.target,
        pointBorderColor: COLORS.target,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0,
        fill: true,
        order: 1,
        yAxisID: 'y',
      },
      {
        label: 'OEE (%)',
        data: oeeData,
        type: 'line',
        borderColor: COLORS.oee,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          if (!ctx.chart.chartArea) return `${COLORS.oee}15`
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, `${COLORS.oee}30`)
          g.addColorStop(1, `${COLORS.oee}00`)
          return g
        },
        borderWidth: 2,
        pointBackgroundColor: COLORS.oee,
        pointBorderColor: COLORS.oee,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointStyle: 'rectRot',
        tension: 0.3,
        fill: true,
        order: 0,
        yAxisID: 'y1',
      },
    ],
  }

  const options: MixedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          font: { size: 11, family: 'Inter' },
          padding: 16,
          usePointStyle: true,
          color: COLORS.text,
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        titleFont: { size: 11, family: 'Inter' },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
        borderColor: '#e2e8f0',
        borderWidth: 1,
        boxPadding: 4,
        callbacks: {
          label: (context: TooltipItem<MixedChart>) => {
            const label = context.dataset.label || ''
            const value = context.raw as number | null
            if (context.dataset.yAxisID === 'y') {
              if (value === null || value === undefined || isNaN(value)) {
                return `${label}: No data`
              }
            }
            return `${label}: ${value}%`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter', weight: 600 }, color: COLORS.text },
      },
      y: {
        position: 'left',
        min: 0,
        max: 11000,
        ticks: {
          stepSize: 2000,
          callback: (value: number | string) => (Number(value) / 1000).toFixed(0) + 'k',
          font: { size: 10, family: 'Inter' },
          color: COLORS.text,
        },
        grid: {
          color: COLORS.grid,
          drawOnChartArea: true,
        },
        title: {
          display: true,
          text: 'Output / Target',
          color: COLORS.text,
          font: { size: 10, family: 'Inter', weight: 600 },
        },
      },
      y1: {
        position: 'right',
        min: 40,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: (value: number | string) => `${value}%`,
          font: { size: 10, family: 'Inter' },
          color: COLORS.text,
        },
        grid: { display: false },
        title: {
          display: true,
          text: 'OEE',
          color: COLORS.text,
          font: { size: 10, family: 'Inter', weight: 600 },
        },
      },
    },
  }



  const mobile = weekLabels.length <= 4

  return (
    <Card className="flex flex-col hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold text-on-surface">Last 8 Week Trend</h3>
        <div className="flex items-center gap-2">
          {mobile && (
            <span className="text-[10px] font-medium text-on-surface-variant/50 bg-surface px-2.5 py-1 rounded-full">
              Last 4 weeks
            </span>
          )}
          <span className="text-[10px] font-medium text-on-surface-variant/50">{weekLabels.length} weeks</span>
        </div>
      </div>
      <div className="relative" style={{ minHeight: mobile ? '260px' : '300px' }}>
        <Chart<MixedChart, (number | null)[], string>
          type="bar"
          options={options}
          data={data}
          plugins={[]}
        />
      </div>
    </Card>
  )
}
