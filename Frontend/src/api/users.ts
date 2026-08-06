import client from './client'
import type { User } from '../types'

export interface UserCreateInput {
  email: string
  full_name: string
  password: string
  role: 'ADMIN'
}

export interface UserPatchInput {
  email?: string
  full_name?: string
  password?: string
  role?: 'ADMIN'
}

export const usersApi = {
  list: () => client.get<User[]>('/users').then(r => r.data),

  create: (data: UserCreateInput) =>
    client.post<User>('/users', data).then(r => r.data),

  update: (userId: string, patch: UserPatchInput) =>
    client.patch<User>(`/users/${userId}`, patch).then(r => r.data),

  remove: (userId: string) =>
    client.delete(`/users/${userId}`).then(r => r.data),
}