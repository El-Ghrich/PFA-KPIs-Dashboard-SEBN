import { Spinner } from './Spinner'

interface EmptyStateProps {
  message: string
  className?: string
}

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-on-surface-variant text-[14px] font-medium ${className}`}>
      <Spinner />
      <p>{message}</p>
    </div>
  )
}
