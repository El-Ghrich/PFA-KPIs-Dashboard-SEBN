import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownOption<T> {
  value: T
  label: string
}

interface DropdownProps<T extends string | number> {
  label: string
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function Dropdown<T extends string | number>({ label, value, options, onChange, className = '' }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-border-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] min-w-0 sm:min-w-[130px] text-[13px] font-medium text-on-surface hover:bg-surface-container transition-colors duration-200"
        >
          <span className="flex-1 text-left truncate">{selected?.label || String(value)}</span>
          <ChevronDown className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-white rounded-lg border border-border-card shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[100] max-h-[220px] overflow-y-auto min-w-full sm:min-w-[150px] py-1">
            {options.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3 py-1.5 text-[13px] text-left hover:bg-surface-container transition-colors duration-200 ${
                  opt.value === (value || options[0]?.value)
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-on-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
