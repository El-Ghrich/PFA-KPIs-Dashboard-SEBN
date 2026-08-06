import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default: open on desktop (>= 1024px), closed on mobile
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const handler = () => {
      // Auto-close on mobile when viewport shrinks
      if (window.innerWidth < 1024) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const toggle = () => setIsOpen(v => !v)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
