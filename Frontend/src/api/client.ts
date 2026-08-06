import axios from 'axios'
import { tokenStorage } from '../lib/tokenStorage'

const baseConfig = {
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
}

const client = axios.create(baseConfig)
const refreshClient = axios.create(baseConfig)

const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/refresh']

function isAuthPath(url?: string): boolean {
  if (!url) return false
  return AUTH_PATHS.some((p) => url.startsWith(p))
}

// ⬇️ ADD THIS: Queue for requests waiting during token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (reason?: any) => void
  config: any
}> = []

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
      resolve(client(config))
    } else {
      reject(new Error('No token available'))
    }
  })
  failedQueue = []
}

// Request interceptor - unchanged
client.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token && !isAuthPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - FIXED with queue
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    
    // Don't retry auth paths
    if (isAuthPath(original?.url)) {
      return Promise.reject(error)
    }

    // Only handle 401s and only once per request
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: original })
      })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = tokenStorage.getRefreshToken()
    
    if (!refreshToken) {
      // No session at all (unauthenticated public visitor) — fail silently,
      // don't redirect to /login so the public dashboard stays usable.
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      // Attempt to refresh
      const { data } = await refreshClient.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      })

      // Save new token
      tokenStorage.setAccessToken(data.access_token)
      
      // Update the original request with new token
      original.headers.Authorization = `Bearer ${data.access_token}`

      // Process waiting queue with new token
      processQueue(null, data.access_token)
      
      // Retry the original request
      return client(original)

    } catch (refreshError) {
      // Refresh token is invalid/expired — clear tokens and redirect to login
      processQueue(refreshError, null)
      tokenStorage.clearTokens()
      isRefreshing = false
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default client