export function Spinner({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4 border-2' : 'w-6 h-6 border-2'
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClass} border-primary/30 border-t-primary rounded-full animate-spin`} />
    </div>
  )
}
