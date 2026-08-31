import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WeeklyEntry from './pages/WeeklyEntry'
import BulkDataEntry from './pages/BulkDataEntry'
import UserManagement from './pages/UserManagement'
import ApiKeyManagement from './pages/ApiKeyManagement'
import ProjectManagement from './pages/ProjectManagement'
import Settings from './pages/Settings'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'

// ── Public layout for guests (no sidebar) ──────────────────────────────────
function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface">
      {children ?? <Outlet />}
      <Link
        to="/login"
        title="Admin Sign In"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full bg-white/95 hover:bg-white text-on-surface border border-border-card shadow-md hover:shadow-lg hover:border-primary/30 backdrop-blur-md transition-all duration-200 group select-none"
      >
        <Lock className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
        <span>Admin Sign In</span>
      </Link>
    </div>
  )
}

// ── Authenticated layout for logged-in admins (with TopBar + Sidebar) ──────────
function AdminLayout({ children }: { children?: ReactNode }) {
  return (
    <SidebarProvider>
      <TopBar />
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-12 lg:pt-0">
          {children ?? <Outlet />}
        </div>
      </div>
    </SidebarProvider>
  )
}

function AuthRequired({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-surface text-on-surface-variant">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRequired({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) return <>{children}</>
  return <Navigate to="/" replace />
}

function SuperAdminRequired({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user && user.role === 'SUPER_ADMIN') return <>{children}</>
  return <Navigate to="/" replace />
}

// Dynamic route for "/" dashboard — renders AdminLayout if logged in, PublicLayout if guest
function DashboardRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-surface text-on-surface-variant">Loading...</div>
  }

  if (user) {
    return (
      <AdminLayout>
        <Dashboard />
      </AdminLayout>
    )
  }

  return (
    <PublicLayout>
      <Dashboard />
    </PublicLayout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* ── Dashboard: shows AdminLayout if logged in, PublicLayout if guest ── */}
              <Route path="/" element={<DashboardRoute />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* ── Auth: login page ── */}
              <Route path="/login" element={<Login />} />

              {/* ── Auth-required: admin pages ── */}
              <Route element={<AuthRequired><AdminLayout /></AuthRequired>}>
                <Route path="/entry" element={<AdminRequired><WeeklyEntry /></AdminRequired>} />
                <Route path="/bulk-entry" element={<AdminRequired><BulkDataEntry /></AdminRequired>} />
                <Route path="/projects" element={<AdminRequired><ProjectManagement /></AdminRequired>} />
                <Route path="/users" element={<SuperAdminRequired><UserManagement /></SuperAdminRequired>} />
                <Route path="/api-keys" element={<AdminRequired><ApiKeyManagement /></AdminRequired>} />
                <Route path="/settings" element={<AdminRequired><Settings /></AdminRequired>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
