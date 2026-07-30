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
          if (!ctx.chart.chartArea) return 'rgba(70, 130, 180, 0.7)'
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, '#4682B4')
          g.addColorStop(1, 'rgba(70, 130, 180, 0.15)')
          return g
        },
        borderColor: '#4682B4',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.5,
        order: 2,
        yAxisID: 'y' as const,
      },
      {
        label: 'Target (Sets)',
        data: targetData,
        type: 'line' as const,
        borderColor: '#dc3545',
        backgroundColor: (ctx: any) => {
          if (!ctx.chart.chartArea) return 'rgba(220, 53, 69, 0.05)'
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, 'rgba(220, 53, 69, 0.12)')
          g.addColorStop(1, 'rgba(220, 53, 69, 0)')
          return g
        },
        borderWidth: 2.5,
        borderDash: [8, 6] as number[],
        pointBackgroundColor: '#dc3545',
        pointBorderColor: '#dc3545',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0,
        fill: true,
        order: 1,
        yAxisID: 'y' as const,
      },
      {
        label: 'OEE (%)',
        data: oeeData,
        type: 'line' as const,
        borderColor: '#28a745',
        backgroundColor: (ctx: any) => {
          if (!ctx.chart.chartArea) return 'rgba(40, 167, 69, 0.08)'
          const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          g.addColorStop(0, 'rgba(40, 167, 69, 0.25)')
          g.addColorStop(1, 'rgba(40, 167, 69, 0)')
          return g
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#28a745',
        pointBorderColor: '#28a745',
        pointRadius: 4,
        pointHoverRadius: 6,
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
        labels: {
          font: { size: 11, family: 'Inter' },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 11, family: 'Inter' },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || ''
            const value = context.raw
            if (context.dataset.yAxisID === 'y') {
              return label + ': ' + value.toLocaleString()
            }
            return label + ': ' + value + '%'
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter', weight: '600' as const } },
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
        },
        grid: {
          color: 'rgba(0,0,0,0.06)',
          drawOnChartArea: true,
        },
        title: {
          display: true,
          text: 'Output / Target',
          color: '#4682B4',
          font: { size: 11, family: 'Inter', weight: '600' as const },
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
        },
        grid: { display: false },
        title: {
          display: true,
          text: 'OEE',
          color: '#28a745',
          font: { size: 11, family: 'Inter', weight: '600' as const },
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
            ctx.fillStyle = '#1b1b1d'
            ctx.font = '600 11px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText((value / 1000).toFixed(1) + 'k', bar.x, bar.y - 5)
          })
        }
        if (dataset.label === 'OEE (%)') {
          meta.data.forEach(function (point: any, index: number) {
            const value = dataset.data[index]
            if (value === null || value === undefined) return
            ctx.fillStyle = '#28a745'
            ctx.font = '600 11px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(value + '%', point.x, point.y - 10)
          })
        }
      })
    },
  }

  const mobile = weekLabels.length <= 4

  return (
    <div className="bg-white rounded-3xl border border-border-card shadow-[1px_1px_9px_0px_rgba(0,0,0,0.1)] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-on-surface tracking-tight">Last 8 Week Trend</h3>
        <div className="flex items-center gap-2">
          {mobile && (
            <span className="text-[10px] font-medium text-on-surface-variant/50 bg-surface px-2.5 py-1 rounded-full">
              Last 4 weeks
            </span>
          )}
          <span className="text-[10px] font-medium text-on-surface-variant/50">{weekLabels.length} weeks</span>
        </div>
      </div>
      <div className="relative" style={{ minHeight: mobile ? '280px' : '320px' }}>
        <Bar options={options} data={data} plugins={[labelPlugin]} />
      </div>
    </div>
  )
}
