import { Bar } from 'react-chartjs-2'
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
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

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
  const targetData = outputData.map(() => 9000)

  const data = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Output (Sets)',
        data: outputData,
        type: 'bar' as const,
        backgroundColor: (ctx: any) => {
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
        yAxisID: 'y' as const,
      },
      {
        label: 'Target (Sets)',
        data: targetData,
        type: 'line' as const,
        borderColor: COLORS.target,
        backgroundColor: (ctx: any) => {
          if (!ctx.chart.chartArea) return `${COLORS.target}08`
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, `${COLORS.target}18`)
          g.addColorStop(1, `${COLORS.target}00`)
          return g
        },
        borderWidth: 2,
        borderDash: [6, 4] as number[],
        pointBackgroundColor: COLORS.target,
        pointBorderColor: COLORS.target,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0,
        fill: true,
        order: 1,
        yAxisID: 'y' as const,
      },
      {
        label: 'OEE (%)',
        data: oeeData,
        type: 'line' as const,
        borderColor: COLORS.oee,
        backgroundColor: (ctx: any) => {
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
        pointStyle: 'rectRot' as const,
        tension: 0.3,
        fill: true,
        order: 0,
        yAxisID: 'y1' as const,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
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
          label: function (context: any) {
            const label = context.dataset.label || ''
            const value = context.raw
            if (context.dataset.yAxisID === 'y') {
               if (value === null || value === undefined || isNaN(value)) {
                  return `${label}: No data`
                }
            }
            return label + ': ' + value + '%'
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter', weight: '600' as const }, color: COLORS.text },
      },
      y: {
        position: 'left' as const,
        min: 0,
        max: 11000,
        ticks: {
          stepSize: 2000,
          callback: function (value: any) {
            return (value / 1000).toFixed(0) + 'k'
          },
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
          font: { size: 10, family: 'Inter', weight: '600' as const },
        },
      },
      y1: {
        position: 'right' as const,
        min: 40,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function (value: any) {
            return value + '%'
          },
          font: { size: 10, family: 'Inter' },
          color: COLORS.text,
        },
        grid: { display: false },
        title: {
          display: true,
          text: 'OEE',
          color: COLORS.text,
          font: { size: 10, family: 'Inter', weight: '600' as const },
        },
      },
    },
  }

  const labelPlugin = {
    id: 'customLabels',
    afterDraw: function (chart: any) {
      const ctx = chart.ctx
      chart.data.datasets.forEach(function (dataset: any, i: number) {
        const meta = chart.getDatasetMeta(i)
        if (dataset.type === 'bar') {
          meta.data.forEach(function (bar: any, index: number) {
            const value = dataset.data[index]
            if (value === null || value === undefined) return
            ctx.fillStyle = '#0f172a'
            ctx.font = '600 11px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText((value / 1000).toFixed(1) + 'k', bar.x, bar.y - 4)
          })
        }
        if (dataset.label === 'OEE (%)') {
          meta.data.forEach(function (point: any, index: number) {
            const value = dataset.data[index]
            if (value === null || value === undefined) return
            ctx.fillStyle = COLORS.oee
            ctx.font = '600 11px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(value + '%', point.x, point.y - 8)
          })
        }
      })
    },
  }

  const mobile = weekLabels.length <= 4

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 flex flex-col transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
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
        <Bar options={options} data={data} plugins={[labelPlugin]} />
      </div>
    </div>
  )
}
