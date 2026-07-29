import client from './client'
import type { AuthResponse } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  signup: (data: { email: string; password: string; full_name: string; role?: string }) =>
    client.post('/auth/signup', data).then((r) => r.data),

  me: () => client.get('/auth/me').then((r) => r.data),
}
