import React from 'react'

interface RadialGaugeProps {
  value: number | null | undefined
  target?: number
  className?: string
}

/**
 * Semicircular Radial Gauge (Half Doughnut) for OEE performance.
 * - 0,0% to 100,0% arc
 * - Target tick line at 65% with label
 * - Vivid SEBN blue progress arc directly reflecting the real OEE percentage from DB
 * - Centered bold value display
 */
export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  target = 65,
  className = '',
}) => {
  const hasValue = value !== null && value !== undefined
  const numValue = hasValue ? Number(value) : null
  const clampedVal = numValue !== null ? Math.min(Math.max(numValue, 0), 100) : 0

  // Arc calculations:
  // Center (100, 100), Radius 75
  // Arc length = PI * 75 ≈ 235.619
  const arcLength = 235.62
  const strokeDashoffset = numValue !== null ? arcLength * (1 - clampedVal / 100) : arcLength

  // Target tick mark calculation
  const targetFrac = Math.min(Math.max(target, 0), 100) / 100
  const targetAngle = targetFrac * Math.PI
  const cosTarget = Math.cos(targetAngle)
  const sinTarget = Math.sin(targetAngle)

  // Inner tick point (radius 65) and Outer tick point (radius 85)
  const x1 = 100 - 65 * cosTarget
  const y1 = 100 - 65 * sinTarget
  const x2 = 100 - 85 * cosTarget
  const y2 = 100 - 85 * sinTarget

  // Target text position slightly outward
  const xLabel = 100 - 95 * cosTarget
  const yLabel = Math.max(100 - 95 * sinTarget, 16)

  // Format real OEE value directly (e.g. 83.9%)
  const displayValue = numValue !== null ? `${numValue.toFixed(1)}%` : '-'

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 200 118"
        className="w-full max-w-[200px] h-auto overflow-visible select-none"
      >
        {/* Background Inactive Arc */}
        <path
          d="M 25 100 A 75 75 0 0 1 175 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Active Blue Progress Arc */}
        {numValue !== null && clampedVal > 0 && (
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="#0080ff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Target Tick Line (at 65%) */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#b45309"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Target 65% Label */}
        <text
          x={xLabel + 2}
          y={yLabel + 1}
          textAnchor="start"
          className="text-[9px] fill-slate-500 font-semibold tracking-tighter"
        >
          {target}%
        </text>

        {/* 0,0 % Start Label */}
        <text
          x="20"
          y="114"
          textAnchor="start"
          className="text-[9px] fill-slate-400 font-medium"
        >
          0%
        </text>

        {/* 100,0 % End Label */}
        <text
          x="180"
          y="114"
          textAnchor="end"
          className="text-[9px] fill-slate-400 font-medium"
        >
          100%
        </text>

        {/* Centered Large Real OEE Value */}
        <text
          x="100"
          y="93"
          textAnchor="middle"
          className="text-[22px] font-black fill-slate-800 tracking-tight"
        >
          {displayValue}
        </text>
      </svg>
    </div>
  )
}

export default RadialGauge
