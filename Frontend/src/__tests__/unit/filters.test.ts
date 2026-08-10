/**
 * src/__tests__/unit/filters.test.ts
 *
 * Unit tests for src/features/dashboard/filters.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildDefaultFilters } from '../../features/dashboard/filters'
import { MOCK_PROJECTS, MOCK_PROJECT_MOROCCO, MOCK_PROJECT_MEXICO } from '../mocks/data'
import { DEFAULT_PROJECT_NAME, DEFAULT_YEAR } from '../../lib/constants'
import * as isoDate from '../../lib/isoDate'

describe('buildDefaultFilters', () => {
  beforeEach(() => {
    // Pin getCurrentISOWeek to week 15 for deterministic assertions
    vi.spyOn(isoDate, 'getCurrentISOWeek').mockReturnValue(15)
  })

  it('sets location to "All"', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.location).toBe('All')
  })

  it('picks the DEFAULT_PROJECT_NAME project when it exists', () => {
    // MOCK_PROJECT_MOROCCO.name is 'MEB21 HV' which equals DEFAULT_PROJECT_NAME
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.projectId).toBe(MOCK_PROJECT_MOROCCO.id)
  })

  it('falls back to the first project when default name not found', () => {
    const otherProjects = [MOCK_PROJECT_MEXICO]
    const filters = buildDefaultFilters(otherProjects)
    expect(filters.projectId).toBe(MOCK_PROJECT_MEXICO.id)
  })

  it('sets projectId to empty string when projects array is empty', () => {
    const filters = buildDefaultFilters([])
    expect(filters.projectId).toBe('')
  })

  it('sets year to DEFAULT_YEAR', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.year).toBe(DEFAULT_YEAR)
  })

  it('sets week to the current ISO week', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.week).toBe(15)
  })

  it('sets compareWeek to currentWeek - 1', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.compareWeek).toBe(14)
  })

  it('sets setId to "All"', () => {
    const filters = buildDefaultFilters(MOCK_PROJECTS)
    expect(filters.setId).toBe('All')
  })
})
