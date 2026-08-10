import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
}

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-error shrink-0" />,
    info: <Info className="w-5 h-5 text-primary shrink-0" />,
  }

  const borderColors = {
    success: 'border-l-tertiary',
    error: 'border-l-error',
    info: 'border-l-primary',
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-full max-w-sm p-4 bg-white rounded-xl border border-border-card border-l-4 shadow-[0_4px_16px_rgba(0,0,0,0.1)] ${borderColors[toast.type]} animate-in slide-in-from-top-2 fade-in duration-200 pointer-events-auto`}
    >
      <div className="pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <h5 className="text-[13px] font-bold text-on-surface leading-tight">{toast.title}</h5>}
        <p className="text-[12.5px] font-medium text-on-surface-variant leading-snug mt-0.5 whitespace-pre-wrap">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-on-surface-variant/50 hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
