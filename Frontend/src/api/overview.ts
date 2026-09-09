import client from './client'
import type { OverviewResponse } from '../types'

export const overviewApi = {
  getOverview: (year: number, week: number): Promise<OverviewResponse> => {
    const params = new URLSearchParams({
      iso_year: String(year),
      iso_week: String(week),
    })
    return client.get<OverviewResponse>(`/overview?${params}`).then((r) => r.data)
  },
}
