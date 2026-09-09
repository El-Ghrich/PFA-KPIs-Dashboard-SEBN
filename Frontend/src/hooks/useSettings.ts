import { useState, useEffect, useCallback } from 'react'
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_YEAR,
  CHART_TARGET,
  CHART_WEEKS_DESKTOP,
  CHART_WEEKS_MOBILE,
} from '../lib/constants'

export interface KpiTargets {
  output: number
  scrapRate: number
  oee: number
  insertion1: number
  insertion2: number
  insertion3: number
}

export interface AppSettings {
  defaultProjectName: string
  defaultYear: number
  chartTarget: number
  chartWeeksDesktop: number
  chartWeeksMobile: number
  kpiTargets?: KpiTargets
}

export const DEFAULT_KPI_TARGETS: KpiTargets = {
  output: 9000,
  scrapRate: 1.5,
  oee: 80,
  insertion1: 85,
  insertion2: 85,
  insertion3: 85,
}

const defaultSettings: Required<AppSettings> = {
  defaultProjectName: DEFAULT_PROJECT_NAME,
  defaultYear: DEFAULT_YEAR,
  chartTarget: CHART_TARGET,
  chartWeeksDesktop: CHART_WEEKS_DESKTOP,
  chartWeeksMobile: CHART_WEEKS_MOBILE,
  kpiTargets: DEFAULT_KPI_TARGETS,
}

const SETTINGS_KEY = 'app_settings'

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const item = window.localStorage.getItem(SETTINGS_KEY)
      if (item) {
        const parsed = JSON.parse(item)
        return {
          ...defaultSettings,
          ...parsed,
          kpiTargets: {
            ...DEFAULT_KPI_TARGETS,
            ...(parsed.kpiTargets || {}),
          },
        }
      }
      return defaultSettings
    } catch (error) {
      console.warn('Error reading localStorage for settings', error)
      return defaultSettings
    }
  })

  const syncSettings = useCallback(() => {
    try {
      const item = window.localStorage.getItem(SETTINGS_KEY)
      if (item) {
        const parsed = JSON.parse(item)
        setSettingsState({
          ...defaultSettings,
          ...parsed,
          kpiTargets: {
            ...DEFAULT_KPI_TARGETS,
            ...(parsed.kpiTargets || {}),
          },
        })
      }
    } catch {
      // ignore parsing error
    }
  }, [])

  // Listen for storage events across tabs and custom events in the same tab
  useEffect(() => {
    window.addEventListener('storage', syncSettings)
    window.addEventListener('app-settings-changed', syncSettings)
    return () => {
      window.removeEventListener('storage', syncSettings)
      window.removeEventListener('app-settings-changed', syncSettings)
    }
  }, [syncSettings])

  const setSettings = (newSettings: AppSettings) => {
    try {
      setSettingsState(newSettings)
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
      // Manually dispatch custom event so other hooks in the same window update
      window.dispatchEvent(new Event('app-settings-changed'))
    } catch (error) {
      console.warn('Error setting localStorage for settings', error)
    }
  }

  return { settings, setSettings }
}
