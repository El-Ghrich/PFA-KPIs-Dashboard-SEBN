import { useState, type ReactNode } from 'react'
import { WifiOff, AlertTriangle, ShieldAlert, FileQuestion, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { parseApiError } from '../../lib/errorUtils'
import { Button } from './Button'

interface ErrorStateProps {
  error: unknown
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
  compact?: boolean
  action?: ReactNode
}

export function ErrorState({
  error,
  title: customTitle,
  message: customMessage,
  onRetry,
  isRetrying = false,
  className = '',
  compact = false,
  action,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false)
  const parsed = parseApiError(error)

  const title = customTitle || parsed.title
  const message = customMessage || parsed.message

  // Pick appropriate icon based on error category
  const renderIcon = () => {
    if (parsed.isNetworkError) {
      return <WifiOff className="w-6 h-6 text-error shrink-0" />
    }
    if (parsed.isAuthError || parsed.status === 403) {
      return <ShieldAlert className="w-6 h-6 text-alert shrink-0" />
    }
    if (parsed.status === 404) {
      return <FileQuestion className="w-6 h-6 text-on-surface-variant shrink-0" />
    }
    return <AlertTriangle className="w-6 h-6 text-error shrink-0" />
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-error/5 border border-error/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left ${className}`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-error/10 text-error shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h4 className="text-[14px] font-semibold text-on-surface truncate">{title}</h4>
            <p className="text-[13px] text-on-surface-variant leading-snug">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {action}
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              loading={isRetrying}
              variant="outline"
              className="py-1.5 px-3 text-[12px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-2xl border border-border-card shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center shadow-inner">
        {renderIcon()}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-[18px] font-bold text-on-surface tracking-tight">{title}</h3>
        <p className="text-[13.5px] text-on-surface-variant leading-relaxed">{message}</p>
      </div>

      {(onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {action}
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              loading={isRetrying}
              className="px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Connecting…' : 'Try Again'}
            </Button>
          )}
        </div>
      )}

      {/* Accordion for Technical Debug Details */}
      {Boolean(parsed.status || parsed.code || parsed.detail) && (
        <div className="w-full mt-2 pt-4 border-t border-border-card text-left">
          <button
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center justify-between w-full text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface transition-colors py-1 select-none"
          >
            <span>Technical Diagnostics</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-surface-container rounded-lg font-mono text-[11px] text-on-surface-variant space-y-1 overflow-x-auto">
              {Boolean(parsed.status) && <div><span className="font-bold text-on-surface">Status:</span> HTTP {parsed.status}</div>}
              {Boolean(parsed.code) && <div><span className="font-bold text-on-surface">Code:</span> {parsed.code}</div>}
              {Boolean(parsed.detail) && (
                <div>
                  <span className="font-bold text-on-surface">Detail:</span>
                  <pre className="mt-1 whitespace-pre-wrap text-[10.5px]">
                    {typeof parsed.detail === 'object' ? JSON.stringify(parsed.detail, null, 2) : String(parsed.detail ?? '')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
