import { DEFAULT_PROJECT_NAME, DEFAULT_YEAR } from '../../lib/constants'
import { getCurrentISOWeek } from '../../lib/isoDate'
import type { FilterState, Project } from '../../types'

export function buildDefaultFilters(projects: Project[]): FilterState {
  const defaultProj = projects.find(p => p.name === DEFAULT_PROJECT_NAME) || projects[0]
  const currentWeek = getCurrentISOWeek()
  return {
    location: 'All',
    projectId: defaultProj?.id || '',
    year: DEFAULT_YEAR,
    week: currentWeek,
    compareWeek: currentWeek - 1,
    machine: 'All',
  }
}
