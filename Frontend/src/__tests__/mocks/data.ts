/**
 * src/__tests__/mocks/data.ts
 *
 * Shared, typed fixture objects used across all tests.
 * Keep all test data here so tests never hard-code magic IDs.
 */

import type { User, Project, ProjectSet, KPIRecord, KPIDefinition, Highlight, AuthResponse } from '../../types'

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ADMIN_USER: User = {
  id: 'user-admin-1',
  email: 'admin@sebn.com',
  full_name: 'Admin User',
  role: 'ADMIN',
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_AUTH_RESPONSE: AuthResponse = {
  access_token: 'mock-access-token-abc123',
  refresh_token: 'mock-refresh-token-xyz789',
  token_type: 'bearer',
  user: MOCK_ADMIN_USER,
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Sets
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_SET_1: ProjectSet = {
  id: 'set-1',
  project_id: 'project-morocco-1',
  name: 'Set 1',
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_SET_2: ProjectSet = {
  id: 'set-2',
  project_id: 'project-morocco-1',
  name: 'Set 2',
  created_at: '2026-01-01T00:00:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_PROJECT_MOROCCO: Project = {
  id: 'project-morocco-1',
  name: 'MEB21 HV',
  status: 'ACTIVE',
  location: 'Morocco',
  created_at: '2026-01-01T00:00:00Z',
  sets: [MOCK_SET_1, MOCK_SET_2],
}

export const MOCK_PROJECT_MEXICO: Project = {
  id: 'project-mexico-1',
  name: 'MX Plant A',
  status: 'ACTIVE',
  location: 'Mexico',
  created_at: '2026-01-01T00:00:00Z',
  sets: [],
}

export const MOCK_PROJECTS: Project[] = [MOCK_PROJECT_MOROCCO, MOCK_PROJECT_MEXICO]

// ─────────────────────────────────────────────────────────────────────────────
// KPI Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_KPI_OUTPUT: KPIDefinition = {
  id: 'kpi-def-output',
  name: 'Output',
  unit: 'units',
  kpi_type: 'NUMERIC',
}

export const MOCK_KPI_SCRAP: KPIDefinition = {
  id: 'kpi-def-scrap',
  name: 'Scrap Rate',
  unit: '%',
  kpi_type: 'NUMERIC',
}

export const MOCK_KPI_OEE: KPIDefinition = {
  id: 'kpi-def-oee',
  name: 'OEE',
  unit: '%',
  kpi_type: 'NUMERIC',
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Records
// ─────────────────────────────────────────────────────────────────────────────

/** Helper to build a KPIRecord quickly */
export function makeRecord(
  overrides: Partial<KPIRecord> & { kpi_definition: KPIDefinition; numeric_value: number },
): KPIRecord {
  return {
    id: `rec-${Math.random()}`,
    project_id: MOCK_PROJECT_MOROCCO.id,
    kpi_id: overrides.kpi_definition.id,
    record_date: '2026-01-06', // CW02 2026
    period: 'WEEKLY',
    is_missing: false,
    created_at: '2026-01-06T00:00:00Z',
    created_by: MOCK_ADMIN_USER.id,
    ...overrides,
  }
}

// CW01 2026 = week starting 2025-12-29
export const RECORD_CW01_OUTPUT = makeRecord({
  kpi_definition: MOCK_KPI_OUTPUT,
  numeric_value: 8000,
  record_date: '2025-12-29',
})

// CW02 2026 = week starting 2026-01-05
export const RECORD_CW02_OUTPUT = makeRecord({
  kpi_definition: MOCK_KPI_OUTPUT,
  numeric_value: 9500,
  record_date: '2026-01-05',
})

export const RECORD_CW02_SCRAP = makeRecord({
  kpi_definition: MOCK_KPI_SCRAP,
  numeric_value: 2.5,
  record_date: '2026-01-05',
})

// ─────────────────────────────────────────────────────────────────────────────
// Highlights
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_HIGHLIGHT_GOOD: Highlight = {
  id: 'highlight-good-1',
  project_id: MOCK_PROJECT_MOROCCO.id,
  record_date: '2026-01-05',
  period: 'WEEKLY',
  value: 'Record production week',
  status: 'GOOD',
  created_at: '2026-01-05T00:00:00Z',
  created_by: MOCK_ADMIN_USER.id,
  api_key_id: null,
}

export const MOCK_HIGHLIGHT_BAD: Highlight = {
  id: 'highlight-bad-1',
  project_id: MOCK_PROJECT_MOROCCO.id,
  record_date: '2026-01-05',
  period: 'WEEKLY',
  value: 'Machine breakdown on line 3',
  status: 'BAD',
  created_at: '2026-01-05T00:00:00Z',
  created_by: MOCK_ADMIN_USER.id,
  api_key_id: null,
}
