import { useSidebar } from '../contexts/SidebarContext'
import { Menu } from 'lucide-react'

export default function TopBar() {
  const { isOpen, toggle } = useSidebar()

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-12 flex items-center gap-2 px-3 bg-white/90 backdrop-blur-md border-b border-border-card lg:hidden">
      <button
        onClick={toggle}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <img src="/LOGO_sebn.png" alt="SEBN" className="h-8 w-auto object-contain" />
    </header>
  )
}
