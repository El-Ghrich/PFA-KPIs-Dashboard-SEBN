import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid credentials or server error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded border border-border-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-[#2170e4]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="8.5" x2="22" y2="8.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-on-surface tracking-tight">INDUCTIVE</h1>
              <p className="text-[11px] uppercase tracking-wider text-on-surface-variant/60">Control System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded border border-outline-variant text-[14px] text-on-surface bg-white focus:outline-none focus:border-[#2170e4] focus:ring-3 focus:ring-[rgba(33,112,228,0.2)]"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded border border-outline-variant text-[14px] text-on-surface bg-white focus:outline-none focus:border-[#2170e4] focus:ring-3 focus:ring-[rgba(33,112,228,0.2)]"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-[12px] text-error font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-[#091426] text-white text-[13px] font-semibold hover:bg-[#1e293b] transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-on-surface-variant/60 mt-4">
          Industrial Precision Platform v2.0
        </p>
      </div>
    </div>
  )
}
