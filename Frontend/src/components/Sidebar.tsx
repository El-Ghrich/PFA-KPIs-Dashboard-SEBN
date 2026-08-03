import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { href: '/', label: 'Overview', icon: <GridIcon />, active: location.pathname === '/' },
    { href: '#', label: 'Real-Time Metrics', icon: <TrendingIcon /> },
    { href: '#', label: 'Historian', icon: <ClockIcon /> },
    { href: '#', label: 'Alarms', icon: <AlertIcon />, badge: '3' },
  ]

  const equipmentItems = [
    { href: '#', label: 'Compressor Skids', icon: <ServerIcon /> },
    { href: '#', label: 'Utilities', icon: <SettingsIcon /> },
    { href: '#', label: 'HMI Panels', icon: <MonitorIcon /> },
  ]

  const reportItems = [
    ...(user?.role === 'ADMIN' ? [{ href: '/entry', label: 'Weekly Entry', icon: <FileInputIcon /> }] : []),
    { href: '#', label: 'Shift Logs', icon: <FileIcon /> },
    { href: '#', label: 'Analytics', icon: <BarChartIcon /> },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-full overflow-y-auto bg-white border-r border-border-card">
      <div className="pl-2 pt-2 border-b border-border-card">
        <img src="/LOGO_sebn.png" alt="SEBN Logo" className="h-20 w-auto object-contain" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">Monitoring</p>
        {navItems.map(item => (
          <NavItem key={item.label} href={item.href} active={item.active} icon={item.icon} badge={item.badge}>
            {item.label}
          </NavItem>
        ))}

        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">Equipment</p>
        {equipmentItems.map(item => (
          <NavItem key={item.label} href={item.href} icon={item.icon}>
            {item.label}
          </NavItem>
        ))}

        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/50">Reports</p>
        {reportItems.map(item => (
          <NavItem key={item.label} href={item.href} icon={item.icon}>
            {item.label}
          </NavItem>
        ))}
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
function TrendingIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ServerIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function MonitorIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function FileInputIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="13" y1="17" x2="16" y2="17"/><line x1="8" y1="17" x2="9" y2="17"/></svg> }
function BarChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
