import client from './client'
import type { KPIDefinition, KPIRecord } from '../types'

export interface KPIRecordBulkCreateItem {
  project_id: string
  kpi_id: string
  set_id?: string
  record_date: string
  period: 'DAILY' | 'WEEKLY'
  numeric_value: number | null
  asset_url?: string | null
  is_missing?: boolean
}

export interface KPIRecordPatch {
  record_date?: string
  period?: 'DAILY' | 'WEEKLY'
  numeric_value?: number | null
  asset_url?: string | null
  is_missing?: boolean
}

export const kpisApi = {
  getDefinitions: () =>
    client.get<KPIDefinition[]>('/kpis/definitions').then((r) => r.data),

  getRecords: (projectId: string, period?: string, isoYear?: number, isoWeek?: number, kpiId?: string, setId?: string) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (period) params.set('period', period)
    if (isoYear) params.set('iso_year', String(isoYear))
    if (isoWeek) params.set('iso_week', String(isoWeek))
    if (kpiId) params.set('kpi_id', kpiId)
    if (setId) params.set('set_id', setId)
    return client.get<KPIRecord[]>(`/kpis/records?${params}`).then((r) => r.data)
  },

  createRecordsBulk: (records: KPIRecordBulkCreateItem[]) =>
    client.post<{ records: KPIRecord[]; total: number }>('/kpis/records/bulk', { records }).then((r) => r.data),

  updateRecord: (recordId: string, patch: KPIRecordPatch) =>
    client.patch<KPIRecord>(`/kpis/records/${recordId}`, patch).then((r) => r.data),
}
