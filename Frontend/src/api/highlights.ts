import client from './client'
import type { Highlight } from '../types'

export const highlightsApi = {
  list: (projectId: string, period?: string, isoYear?: number, isoWeek?: number) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (period) params.set('period', period)
    if (isoYear) params.set('iso_year', String(isoYear))
    if (isoWeek) params.set('iso_week', String(isoWeek))
    return client.get<Highlight[]>(`/highlights?${params}`).then((r) => r.data)
  },

  create: (data: Omit<Highlight, 'id' | 'created_at' | 'created_by' | 'api_key_id'>) =>
    client.post<Highlight>('/highlights', data).then((r) => r.data),

  update: (id: string, patch: { value?: string; status?: 'GOOD' | 'BAD' }) =>
    client.patch<Highlight>(`/highlights/${id}`, patch).then((r) => r.data),

  remove: (id: string) =>
    client.delete(`/highlights/${id}`).then((r) => r.data),
}
