import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  )
}
