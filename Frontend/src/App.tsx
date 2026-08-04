import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WeeklyEntry from './pages/WeeklyEntry'
import UserManagement from './pages/UserManagement'
import ApiKeyManagement from './pages/ApiKeyManagement'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-surface text-on-surface-variant">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) return <>{children}</>
  return <Navigate to="/" replace />
}

function AppLayout() {
  const { user, logout } = useAuth()

  if (user?.role === 'VIEWER') {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-surface">
        <Outlet />
        <button
          onClick={logout}
          title="Logout"
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-card text-on-surface-variant text-[13px] font-semibold shadow-sm hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/entry" element={<AdminRoute><WeeklyEntry /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/api-keys" element={<AdminRoute><ApiKeyManagement /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
