import { getCurrentISOWeek } from '../../lib/isoDate'
import type { FilterState, Project } from '../../types'
import type { AppSettings } from '../../hooks/useSettings'

export function buildDefaultFilters(projects: Project[], settings: AppSettings): FilterState {
  const defaultProj = projects.find(p => p.name === settings.defaultProjectName) || projects[0]
  const currentWeek = getCurrentISOWeek()
  return {
    location: 'All',
    projectId: defaultProj?.id || '',
    year: settings.defaultYear,
    week: currentWeek,
    compareWeek: currentWeek - 1,
    setId: 'All',
  }
}
