import { useQuery } from '@tanstack/react-query'
import { highlightsApi } from '../../api/highlights'
import { kpisApi } from '../../api/kpis'
import type { FilterState } from '../../types'

export function useDashboardData(filters: FilterState) {
  return useQuery({
    queryKey: ['dashboard', filters.projectId, filters.year, filters.setId],
    queryFn: async () => {
      const setId = filters.setId !== 'All' ? filters.setId : undefined
      const [records, highlights] = await Promise.all([
        kpisApi.getRecords(filters.projectId, 'WEEKLY', filters.year, undefined, undefined, setId),
        highlightsApi.list(filters.projectId, 'WEEKLY', filters.year),
      ])
      return { records, highlights }
    },
    enabled: Boolean(filters.projectId),
    staleTime: 30_000,
  })
}
