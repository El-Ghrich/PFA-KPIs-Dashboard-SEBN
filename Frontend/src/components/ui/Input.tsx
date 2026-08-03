import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  suffix?: ReactNode
}

export function Input({ label, error, suffix, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full px-3 py-2.5 rounded-lg border text-[14px] text-on-surface bg-white focus:outline-none transition-colors duration-200 ${
            error
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
              : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20'
          } ${suffix ? 'pr-10' : ''} ${className}`}
          {...rest}
        />
        {suffix && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{suffix}</div>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-[11px] text-error font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
