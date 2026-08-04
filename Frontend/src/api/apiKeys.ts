import client from './client'
import type { ApiKey, ApiKeyCreated, ApiKeyCreateInput } from '../types'

export const apiKeysApi = {
  list: () => client.get<ApiKey[]>('/api-keys').then((r) => r.data),

  create: (data: ApiKeyCreateInput) =>
    client.post<ApiKeyCreated>('/api-keys', data).then(r => r.data),

  revoke: (keyId: string) =>
    client.post(`/api-keys/${keyId}/revoke`).then(r => r.data),

  remove: (keyId: string) =>
    client.delete(`/api-keys/${keyId}`).then(r => r.data),
}