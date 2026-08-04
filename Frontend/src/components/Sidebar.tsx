import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const reportItems = isAdmin ? [
    { href: '/entry', label: 'Weekly Entry', icon: <FileInputIcon />, active: location.pathname === '/entry' },
    { href: '/users', label: 'User Management', icon: <UsersIcon />, active: location.pathname === '/users' },
    { href: '/api-keys', label: 'API Keys', icon: <KeyIcon />, active: location.pathname === '/api-keys' },
  ] : []

  return (
    <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-full overflow-y-auto bg-white border-r border-border-card">
      <div className="pl-2 pt-2 border-b border-border-card">
        <img src="/LOGO_sebn.png" alt="SEBN Logo" className="h-20 w-auto object-contain" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <NavItem href="/" active={location.pathname === '/'} icon={<GridIcon />}>
          Overview
        </NavItem>

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

      <div className="px-4 py-4 border-t border-border-card mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-on-surface text-[12px] font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-on-surface-variant/60 truncate capitalize">{user?.role?.toLowerCase()?.replace('_', ' ') || 'Operator'}</p>
          </div>
          <button onClick={logout} className="text-on-surface-variant/50 hover:text-on-surface transition-colors" title="Logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ href, children, active, badge, icon }: { href: string; children: React.ReactNode; active?: boolean; badge?: string; icon: React.ReactNode }) {
  const classes = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-200 ${
    active
      ? 'text-primary bg-primary/5'
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
  }`
  const content = (
    <>
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{children}</span>
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

function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function FileInputIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="13" y1="17" x2="16" y2="17"/><line x1="8" y1="17" x2="9" y2="17"/></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg> }
