import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { Link, useLocation } from 'react-router-dom'
import { X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { isOpen, toggle, close } = useSidebar()
  const location = useLocation()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const navItems = [
    { href: '/', label: 'Overview', icon: <GridIcon />, active: location.pathname === '/' },
  ]

  const reportItems: { href: string; label: string; icon: React.ReactNode; active: boolean }[] = isAdmin ? [
    { href: '/entry', label: 'Weekly Entry', icon: <FileInputIcon />, active: location.pathname === '/entry' },
    { href: '/projects', label: 'Project Management', icon: <FolderKanbanIcon />, active: location.pathname === '/projects' },
    { href: '/users', label: 'User Management', icon: <UsersIcon />, active: location.pathname === '/users' },
    { href: '/api-keys', label: 'API Keys', icon: <KeyIcon />, active: location.pathname === '/api-keys' },
  ] : []

  // Close sidebar on navigation (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed lg:relative z-40 lg:z-auto
          flex flex-col flex-shrink-0 h-full
          bg-white border-r border-border-card
          overflow-y-auto overflow-x-hidden
          transition-all duration-300 ease-in-out
          ${isOpen
            ? 'w-[240px] translate-x-0'
            : 'w-[240px] -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0'
          }
        `}
      >
        {/* Inner wrapper — preserves layout during width transition */}
        <div className="flex flex-col h-full w-[240px]">
          {/* Logo row */}
          <div className="flex items-center justify-between pl-2 pt-2 pr-2 border-b border-border-card min-h-[84px]">
            <img src="/LOGO_sebn.png" alt="SEBN Logo" className="h-20 w-auto object-contain" />
            <div className="flex items-center gap-1">
              {/* Desktop collapse button */}
              <button
                onClick={toggle}
                className="hidden lg:flex p-1.5 text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
              {/* Mobile close button */}
              <button
                onClick={close}
                className="lg:hidden p-1.5 text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {navItems.map(item => (
              <NavItem key={item.href} href={item.href} active={item.active} icon={item.icon}>
                {item.label}
              </NavItem>
            ))}

            {reportItems.length > 0 && (
              <>
                <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">Reports</p>
                {reportItems.map(item => (
                  <NavItem key={item.href} href={item.href} active={item.active} icon={item.icon}>
                    {item.label}
                  </NavItem>
                ))}
              </>
            )}
          </nav>

          {/* User footer */}
          <div className="px-4 py-4 border-t border-border-card mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-on-surface text-[12px] font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-[10px] text-on-surface-variant/60 truncate capitalize">{user?.role?.toLowerCase()?.replace('_', ' ') || 'Operator'}</p>
              </div>
              <button onClick={logout} className="text-on-surface-variant/50 hover:text-on-surface transition-colors flex-shrink-0" title="Logout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop re-open button — shown when sidebar is collapsed */}
      <button
        onClick={toggle}
        className={`
          hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-30
          flex-col items-center justify-center
          w-5 h-14 rounded-r-lg
          bg-white border border-l-0 border-border-card
          text-on-surface-variant/50 hover:text-primary hover:bg-primary/5
          transition-all duration-300
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <PanelLeftOpen className="w-3.5 h-3.5" />
      </button>
    </>
  )
}

function NavItem({ href, children, active, badge, icon }: { href: string; children: React.ReactNode; active?: boolean; badge?: string; icon: React.ReactNode }) {
  const classes = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-200 ${active
      ? 'text-primary bg-primary/5'
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
    }`
  const content = (
    <>
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {badge && (
        <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">{badge}</span>
      )}
    </>
  )
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <a href={href} className={classes}>
      {content}
    </a>
  )
}

function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> }
function FileInputIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="13" y1="17" x2="16" y2="17" /><line x1="8" y1="17" x2="9" y2="17" /></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> }
function FolderKanbanIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 8.07 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M8 10v4" /><path d="M12 10v2" /><path d="M16 10v6" /></svg> }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" /></svg> }
