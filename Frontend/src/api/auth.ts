import client from './client'
import type { AuthResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  signup: (data: { email: string; password: string; full_name: string; role?: string }) =>
    client.post<User>('/auth/signup', data).then((r) => r.data),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}
