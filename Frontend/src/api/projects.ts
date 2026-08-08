import client from './client'
import type { Paginated, Project, ProjectSet } from '../types'

export interface ProjectCreatePayload {
  name: string
  location?: string
  status?: string
  initial_sets_count?: number
}

export interface ProjectUpdatePayload {
  name?: string
  location?: string
  status?: string
}

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

  create: (data: ProjectCreatePayload) =>
    client.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: ProjectUpdatePayload) =>
    client.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  softDelete: (id: string) =>
    client.delete(`/projects/${id}`).then((r) => r.data),

  addSet: (projectId: string, name: string) =>
    client.post<ProjectSet>(`/projects/${projectId}/sets`, { name }).then((r) => r.data),

  updateSet: (projectId: string, setId: string, name: string) =>
    client.patch<ProjectSet>(`/projects/${projectId}/sets/${setId}`, { name }).then((r) => r.data),

  softDeleteSet: (projectId: string, setId: string) =>
    client.delete(`/projects/${projectId}/sets/${setId}`).then((r) => r.data),
}
