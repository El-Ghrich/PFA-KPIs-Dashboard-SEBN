import client from './client'
import type { Paginated, Project } from '../types'

export const projectsApi = {
  list: (page = 1, pageSize = 10, location?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (location && location !== 'All') params.set('location', location)
    return client.get<Paginated<Project>>(`/projects?${params}`).then((r) => r.data)
  },

  get: (id: string, includeKpis = false) => {
    const params = new URLSearchParams()
    if (includeKpis) params.set('include_kpis', 'true')
    return client.get<Project>(`/projects/${id}${params.size ? `?${params}` : ''}`).then((r) => r.data)
  },

  create: (data: { name: string; status?: string; location?: string }) =>
    client.post<Project>('/projects', data).then((r) => r.data),
}
