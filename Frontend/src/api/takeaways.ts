import client from './client'
import type { KeyTakeaway, KeyTakeawayListResponse } from '../types'

export const takeawaysApi = {
  list: (projectId: string) =>
    client.get<KeyTakeawayListResponse>(`/projects/${projectId}/takeaways`).then((r) => r.data),

  createBulk: (projectId: string, contents: string[]) =>
    client
      .post<KeyTakeaway[]>(`/projects/${projectId}/takeaways`, {
        items: contents.map((content) => ({ content })),
      })
      .then((r) => r.data),

  delete: (id: string) => client.delete(`/takeaways/${id}`).then((r) => r.data),
}
