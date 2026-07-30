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
import { useEffect, useRef } from 'react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

export default function ProductionChart() {
  const chartRef = useRef<any>(null)

  const weeks = ['CW18', 'CW19', 'CW20', 'CW21', 'CW22', 'CW23', 'CW24', 'CW25']
  const output = [6500, 7500, 7000, 7300, 6900, 8200, 7600, 9250]
  const target = [9000, 9000, 9000, 9000, 9000, 9000, 9000, 9000]
  const oee = [58, 65, 75, 70, 72, 70, 72, 70]

  // Custom gradient for bars
  const getBarGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)')
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.7)')
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)')
    return gradient
  }

  const data = {
    labels: weeks,
    datasets: [
      {
        label: 'Output (Sets)',
        data: output,
        type: 'bar' as const,
        backgroundColor: (context: any) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return 'rgba(59, 130, 246, 0.8)'
          return getBarGradient(ctx)
        },
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderSkipped: false,
        borderRadius: 6,
        barPercentage: 0.5,
        barThickness: 32,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
        hoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Target (Sets)',
        data: target,
        type: 'line' as const,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 1.8,
        borderDash: [3, 8],
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#ef4444',
        tension: 0.3,
        fill: false,
        order: 1,
        yAxisID: 'y',
      },
      {
        label: 'OEE (%)',
        data: oee,
        type: 'line' as const,
        borderColor: '#22c55e',
        backgroundColor: (context: any) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return 'transparent'
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)')
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.01)')
          return gradient
        },
        borderWidth: 3,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2.5,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#22c55e',
        pointStyle: 'circle' as const,
        tension: 0.3,
        fill: true,
        order: 1,
        yAxisID: 'y1',
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
        align: 'center' as const,
        labels: {
          font: {
            size: 12,
            weight: '600' as const,
            family: "'Inter', sans-serif",
          },
          padding: 24,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          boxWidth: 8,
          boxHeight: 8,
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        order: 1,
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || ''
            const value = context.raw
            const formattedValue =
              context.dataset.yAxisID === 'y'
                ? value.toLocaleString() + ' Sets'
                : value + '%'
            return `${label}: ${formattedValue}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500' as const,
            family: "'Inter', sans-serif",
          },
          color: '#64748b',
        },
        border: {
          display: false,
        },
      },
      y: {
        position: 'left' as const,
        min: 0,
        max: 11000,
        ticks: {
          stepSize: 1000,
          callback: function (value: any) {
            return value >= 1000 ? value / 1000 + 'K' : value
          },
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawOnChartArea: true,
          drawTicks: false,
        },
        title: {
          display: true,
          text: 'Production (Sets)',
          color: '#94a3b8',
          font: {
            size: 11,
            weight: '500' as const,
            family: "'Inter', sans-serif",
          },
          padding: { bottom: 8 },
        },
        border: {
          display: false,
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
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#94a3b8',
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'OEE (%)',
          color: '#94a3b8',
          font: {
            size: 11,
            weight: '500' as const,
            family: "'Inter', sans-serif",
          },
          padding: { bottom: 8 },
        },
        border: {
          display: false,
        },
      },
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutQuad' as const,
      },
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
      point: {
        hoverRadius: 8,
      },
    },
  }

  // Custom plugin for labels with better styling
  const labelPlugin = {
    id: 'customLabels',
    afterDraw: function (chart: any) {
      const ctx = chart.ctx
      const chartArea = chart.chartArea

      chart.data.datasets.forEach(function (dataset: any, i: number) {
        const meta = chart.getDatasetMeta(i)

        // Bar labels
        if (dataset.type === 'bar') {
          meta.data.forEach(function (bar: any, index: number) {
            const value = dataset.data[index]
            const x = bar.x
            const y = bar.y - 8

            // Background pill for better readability
            const text = value.toLocaleString()
            ctx.save()
            ctx.shadowColor = 'rgba(0,0,0,0.05)'
            ctx.shadowBlur = 4

            // White background pill
            const metrics = ctx.measureText(text)
            const padding = 8
            const width = metrics.width + padding * 2
            const height = 22
            const radius = 6

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.shadowColor = 'rgba(0,0,0,0.1)'
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.roundRect(x - width / 2, y - height + 4, width, height, radius)
            ctx.fill()

            // Text
            ctx.shadowColor = 'transparent'
            ctx.fillStyle = '#1e293b'
            ctx.font = '600 11px Inter, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(text, x, y + 4)

            ctx.restore()
          })
        }

        // OEE labels with better positioning
        if (dataset.label === 'OEE (%)') {
          meta.data.forEach(function (point: any, index: number) {
            const value = dataset.data[index]
            const x = point.x
            const y = point.y - 12

            const text = value + '%'
            ctx.save()
            ctx.fillStyle = '#22c55e'
            ctx.font = '600 11px Inter, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.shadowColor = 'rgba(255,255,255,0.8)'
            ctx.shadowBlur = 4
            ctx.fillText(text, x, y)
            ctx.restore()
          })
        }
      })
    },
  }

  // Add roundRect polyfill for older browsers
  useEffect(() => {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (
        x: number,
        y: number,
        w: number,
        h: number,
        radii: number | number[]
      ) {
        const r = typeof radii === 'number' ? radii : radii[0] || 0
        this.moveTo(x + r, y)
        this.lineTo(x + w - r, y)
        this.quadraticCurveTo(x + w, y, x + w, y + r)
        this.lineTo(x + w, y + h - r)
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        this.lineTo(x + r, y + h)
        this.quadraticCurveTo(x, y + h, x, y + h - r)
        this.lineTo(x, y + r)
        this.quadraticCurveTo(x, y, x + r, y)
        return this
      }
    }
  }, [])

  return (
    <div className="dashboard-card bg-white rounded-3xl border border-border-card shadow-[1px_1px_9px_0px_rgba(0,0,0,0.1)] p-6 lg:col-span-2 flex flex-col">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Production Performance</h3>
          <p className="text-sm text-slate-500">Weekly output vs target with OEE tracking</p>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-600">OEE Avg: {Math.round(oee.reduce((a,b) => a+b, 0) / oee.length)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-600">Total: {output.reduce((a,b) => a+b, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 relative" style={{ minHeight: '380px' }}>
        <Bar
          ref={chartRef}
          options={options}
          data={data}
          plugins={[labelPlugin]}
        />
      </div>

      {/* Footer with key insights */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Peak Output</p>
          <p className="text-sm font-semibold text-slate-800">
            {Math.max(...output).toLocaleString()} Sets
          </p>
          <p className="text-xs text-emerald-600">CW25</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Best OEE</p>
          <p className="text-sm font-semibold text-slate-800">
            {Math.max(...oee)}%
          </p>
          <p className="text-xs text-emerald-600">CW20</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Target Achievement</p>
          <p className="text-sm font-semibold text-slate-800">
            {Math.round((output.reduce((a,b) => a+b, 0) / target.reduce((a,b) => a+b, 0)) * 100)}%
          </p>
          <p className="text-xs text-amber-600">Overall</p>
        </div>
      </div>
    </div>
  )
}