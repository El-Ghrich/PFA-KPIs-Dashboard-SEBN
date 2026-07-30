import client from './client'
import type { Project } from '../types'

export const projectsApi = {
  list: (page = 1, pageSize = 10, location?: string) => {
    let url = `/projects?page=${page}&page_size=${pageSize}`
    if (location && location !== 'All') url += `&location=${encodeURIComponent(location)}`
    return client.get<{ items: Project[]; total: number; page: number; page_size: number }>(url).then((r) => r.data)
  },

  get: (id: string, includeKpis = false) =>
    client.get(`/projects/${id}${includeKpis ? '?include_kpis=true' : ''}`).then((r) => r.data),

  create: (data: { name: string; status?: string; location?: string }) =>
    client.post<Project>('/projects', data).then((r) => r.data),
}
