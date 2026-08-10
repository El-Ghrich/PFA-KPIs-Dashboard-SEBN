import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Toast, type ToastItem, type ToastType } from '../components/ui/Toast'
import { parseApiError } from '../lib/errorUtils'

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string) => void
  showSuccess: (message: string, title?: string) => void
  showError: (errorOrMessage: unknown, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]) // keep max 5
  }, [])

  const showSuccess = useCallback((message: string, title = 'Success') => {
    showToast('success', message, title)
  }, [showToast])

  const showError = useCallback((errorOrMessage: unknown, title?: string) => {
    const parsed = parseApiError(errorOrMessage)
    showToast('error', parsed.message, title || parsed.title)
  }, [showToast])

  const showInfo = useCallback((message: string, title = 'Notice') => {
    showToast('info', message, title)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast floating container top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
