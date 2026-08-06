import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  loading?: boolean
  children: ReactNode
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-lg text-[13px] font-semibold px-4 py-2.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-fixed-dim',
  secondary: 'border border-border-card text-on-surface-variant hover:bg-surface-container',
  outline: 'border border-border-card text-on-surface-variant hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:bg-error/90',
} as const

export function Button({ variant = 'primary', loading = false, disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
