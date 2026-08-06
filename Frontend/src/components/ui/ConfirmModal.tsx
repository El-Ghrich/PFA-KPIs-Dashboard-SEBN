import type { ReactNode } from 'react'
import { AlertTriangle, Trash2, Ban } from 'lucide-react'

type ConfirmVariant = 'delete' | 'revoke' | 'warning'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_STYLES: Record<ConfirmVariant, { icon: ReactNode; iconBg: string; confirmBtn: string }> = {
  delete: {
    icon: <Trash2 className="w-5 h-5" />,
    iconBg: 'bg-error/10 text-error',
    confirmBtn: 'bg-error hover:bg-error/90 text-white',
  },
  revoke: {
    icon: <Ban className="w-5 h-5" />,
    iconBg: 'bg-alert/10 text-alert',
    confirmBtn: 'bg-alert hover:bg-alert/90 text-white',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-alert/10 text-alert',
    confirmBtn: 'bg-alert hover:bg-alert/90 text-white',
  },
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const styles = VARIANT_STYLES[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${
            variant === 'delete' ? 'bg-error' : 'bg-alert'
          }`}
        />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div className="pt-1">
              <h2
                id="confirm-modal-title"
                className="text-[16px] font-semibold text-on-surface leading-snug"
              >
                {title}
              </h2>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-[13px] text-on-surface-variant leading-relaxed ml-14">
              {description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors duration-150 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-150 disabled:opacity-50 flex items-center gap-2 ${styles.confirmBtn}`}
            >
              {loading && (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
