import axios from 'axios'
import { tokenStorage } from '../lib/tokenStorage'

const baseConfig = {
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
}

const client = axios.create(baseConfig)

// Bare instance without auth interceptors so the token-refresh request never
// re-enters the 401 interceptor (which would cause infinite recursion).
const refreshClient = axios.create(baseConfig)

client.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        try {
          const { data } = await refreshClient.post<{ access_token: string }>('/auth/refresh', {
            refresh_token: refreshToken,
          })
          tokenStorage.setAccessToken(data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return client(original)
        } catch {
          tokenStorage.clearTokens()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default client
