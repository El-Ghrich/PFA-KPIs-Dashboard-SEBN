import { useQuery } from '@tanstack/react-query'
import { highlightsApi } from '../../api/highlights'
import { kpisApi } from '../../api/kpis'
import type { FilterState } from '../../types'

export function useDashboardData(filters: FilterState) {
  return useQuery({
    queryKey: ['dashboard', filters.projectId, filters.year],
    queryFn: async () => {
      const [records, highlights] = await Promise.all([
        kpisApi.getRecords(filters.projectId, 'WEEKLY', filters.year),
        highlightsApi.list(filters.projectId, 'WEEKLY', filters.year),
      ])
      return { records, highlights }
    },
    enabled: Boolean(filters.projectId),
    staleTime: 30_000,
  })
}
