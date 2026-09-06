import { getCurrentISOWeek } from '../../lib/isoDate'
import type { FilterState, Project } from '../../types'
import type { AppSettings } from '../../hooks/useSettings'

export function buildDefaultFilters(projects: Project[], settings: AppSettings): FilterState {
  const defaultProj = projects.find(p => p.name === settings.defaultProjectName) || projects[0]
  const currentWeek = getCurrentISOWeek()
  const sets = defaultProj?.sets ?? []
  const defaultSet = sets.find(s => s.name.toLowerCase() === 'set 1' || s.name === '1') || sets[0]

  return {
    location: 'All',
    projectId: defaultProj?.id || '',
    year: settings.defaultYear,
    week: currentWeek,
    compareWeek: currentWeek - 1,
    setId: defaultSet?.id || '',
  }
}

