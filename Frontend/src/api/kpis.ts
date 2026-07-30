import client from './client'
import type { KPIDefinition, KPIRecord } from '../types'

export const kpisApi = {
  getDefinitions: () =>
    client.get<KPIDefinition[]>('/kpis/definitions').then((r) => r.data),

  getRecords: (projectId: string, period?: string, isoYear?: number, isoWeek?: number, kpiId?: string) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (period) params.set('period', period)
    if (isoYear) params.set('iso_year', String(isoYear))
    if (isoWeek) params.set('iso_week', String(isoWeek))
    if (kpiId) params.set('kpi_id', kpiId)
    return client.get<KPIRecord[]>(`/kpis/records?${params}`).then((r) => r.data)
  },
}
