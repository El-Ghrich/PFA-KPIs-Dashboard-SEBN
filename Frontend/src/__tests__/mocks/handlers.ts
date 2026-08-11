/**
 * src/__tests__/mocks/handlers.ts
 *
 * MSW request handlers that intercept real axios calls made during tests.
 * Import `server` from ./server to start/stop this in setup.ts.
 */

import { http, HttpResponse } from 'msw'
import {
  MOCK_AUTH_RESPONSE,
  MOCK_ADMIN_USER,
  MOCK_PROJECTS,
  MOCK_KPI_OUTPUT,
  MOCK_KPI_SCRAP,
  MOCK_KPI_OEE,
  RECORD_CW01_OUTPUT,
  RECORD_CW02_OUTPUT,
  RECORD_CW02_SCRAP,
} from './data'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const handlers = [
  // ── Auth ─────────────────────────────────────────────────────────────────

  /** Successful login */
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'admin@sebn.com' && body.password === 'correct-password') {
      return HttpResponse.json(MOCK_AUTH_RESPONSE, { status: 200 })
    }
    return HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
  }),

  /** GET /auth/me — returns logged-in user */
  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json(MOCK_ADMIN_USER, { status: 200 })
  }),

  // ── Projects ─────────────────────────────────────────────────────────────

  /** GET /projects — paginated list */
  http.get(`${BASE}/projects`, () => {
    return HttpResponse.json(
      { items: MOCK_PROJECTS, total: MOCK_PROJECTS.length, page: 1, page_size: 10 },
      { status: 200 },
    )
  }),

  // ── Takeaways ────────────────────────────────────────────────────────────

  /** GET /projects/:id/takeaways */
  http.get(`${BASE}/projects/:id/takeaways`, () => {
    return HttpResponse.json({ items: [], total: 0 }, { status: 200 })
  }),

  /** POST /projects/:id/takeaways */
  http.post(`${BASE}/projects/:id/takeaways`, async ({ request }) => {
    const body = (await request.json()) as { items: Array<{ content: string }> }
    const created = (body.items || []).map((item, idx) => ({
      id: `takeaway-${idx}`,
      project_id: 'project-morocco-1',
      content: item.content,
      created_by: 'user-admin-1',
      created_at: '2026-08-10T12:00:00Z',
    }))
    return HttpResponse.json(created, { status: 201 })
  }),

  // ── KPIs ──────────────────────────────────────────────────────────────────

  /** GET /kpis/definitions */
  http.get(`${BASE}/kpis/definitions`, () => {
    return HttpResponse.json(
      [
        MOCK_KPI_OUTPUT,
        MOCK_KPI_SCRAP,
        MOCK_KPI_OEE,
        { id: 'kpi-def-cim1', name: 'Insertion rate cim-1', unit: '%', kpi_type: 'NUMERIC' },
        { id: 'kpi-def-cim2', name: 'Insertion rate cim-2', unit: '%', kpi_type: 'NUMERIC' },
        { id: 'kpi-def-cim3', name: 'Insertion rate cim-3', unit: '%', kpi_type: 'NUMERIC' },
      ],
      { status: 200 },
    )
  }),

  /** GET /kpis/records */
  http.get(`${BASE}/kpis/records`, () => {
    return HttpResponse.json([RECORD_CW01_OUTPUT, RECORD_CW02_OUTPUT, RECORD_CW02_SCRAP], { status: 200 })
  }),

  /** POST /kpis/records/bulk */
  http.post(`${BASE}/kpis/records/bulk`, async ({ request }) => {
    const body = (await request.json()) as { records: any[] }
    const records = body.records || []
    return HttpResponse.json(
      {
        records: records.map((r, i) => ({
          id: `rec-bulk-${i}`,
          created_at: new Date().toISOString(),
          ...r,
        })),
        total: records.length,
      },
      { status: 201 },
    )
  }),
]

