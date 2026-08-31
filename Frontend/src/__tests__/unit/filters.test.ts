/**
 * src/__tests__/unit/filters.test.ts
 *
 * Unit tests for src/features/dashboard/filters.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildDefaultFilters } from '../../features/dashboard/filters'
import { MOCK_PROJECTS, MOCK_PROJECT_MOROCCO, MOCK_PROJECT_MEXICO } from '../mocks/data'
import * as isoDate from '../../lib/isoDate'
import type { AppSettings } from '../../hooks/useSettings'

const mockSettings: AppSettings = {
  defaultProjectName: 'MEB21 HV',
  defaultYear: 2026,
  chartTarget: 9000,
  chartWeeksDesktop: 8,
  chartWeeksMobile: 4,
}

describe('buildDefaultFilters', () => {
  beforeEach(() => {
    // Pin getCurrentISOWeek to week 15 for deterministic assertions
    vi.spyOn(isoDate, 'getCurrentISOWeek').mockReturnValue(15)
  })

  it('sets location to "All"', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.location).toBe('All')
  })

  it('picks the defaultProjectName project when it exists', () => {
    // MOCK_PROJECT_MOROCCO.name is 'MEB21 HV' which equals defaultProjectName
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.projectId).toBe(MOCK_PROJECT_MOROCCO.id)
  })

  it('falls back to the first project when default name not found', () => {
    const otherProjects = [MOCK_PROJECT_MEXICO]
    const filters = buildDefaultFilters(otherProjects, mockSettings)
    expect(filters.projectId).toBe(MOCK_PROJECT_MEXICO.id)
  })

  it('sets projectId to empty string when projects array is empty', () => {
    const filters = buildDefaultFilters([], mockSettings)
    expect(filters.projectId).toBe('')
  })

  it('sets year to defaultYear', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.year).toBe(2026)
  })

  it('sets week to the current ISO week', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.week).toBe(15)
  })

  it('sets compareWeek to currentWeek - 1', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.compareWeek).toBe(14)
  })

  it('sets setId to "All"', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS, mockSettings)
    expect(filters.setId).toBe('All')
  })
})
