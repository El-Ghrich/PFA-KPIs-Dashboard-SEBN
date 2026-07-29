import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-full overflow-y-auto bg-[#091426] text-on-primary-container">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-[#2170e4]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="8.5" x2="22" y2="8.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-[15px] leading-tight tracking-tight">INDUCTIVE</h1>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/60 leading-none mt-0.5">Control System</p>
          </div>
        </div>
        <div className="pt-2.5 flex items-center gap-2 border-t border-white/8 mt-2.5">
          <span className="w-2 h-2 rounded-full live-pulse flex-shrink-0 bg-[#00a472]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">System Live</span>
          <span className="ml-auto text-[10px] text-white/50 tabular-nums">UPTIME 99.7%</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Monitoring</p>
        <NavItem href="#" active icon={<SquaresIcon />}>Overview</NavItem>
        <NavItem href="#" icon={<TrendingIcon />}>Real-Time Metrics</NavItem>
        <NavItem href="#" icon={<ClockIcon />}>Historian</NavItem>
        <NavItem href="#" icon={<AlertIcon />} badge="3">Alarms</NavItem>

        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Equipment</p>
        <NavItem href="#" icon={<ServerIcon />}>Compressor Skids</NavItem>
        <NavItem href="#" icon={<SettingsIcon />}>Utilities</NavItem>
        <NavItem href="#" icon={<MonitorIcon />}>HMI Panels</NavItem>

        <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Reports</p>
        <NavItem href="#" icon={<FileIcon />}>Shift Logs</NavItem>
        <NavItem href="#" icon={<BarChartIcon />}>Analytics</NavItem>
      </nav>

      <div className="px-4 py-4 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-white/50 truncate capitalize">{user?.role?.toLowerCase()?.replace('_', ' ') || 'Operator'}</p>
          </div>
          <button onClick={logout} className="text-white/50 hover:text-white transition-colors" title="Logout">
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
  return (
    <a href={href} className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium ${active ? 'text-white bg-white/10 border-l-3 border-[#2170e4]' : 'text-white/70'} -ml-1 pl-4`}>
      {icon}
      <span className="flex-1">{children}</span>
      {badge && <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">{badge}</span>}
    </a>
  )
}

function SquaresIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function TrendingIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ServerIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function MonitorIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function BarChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
