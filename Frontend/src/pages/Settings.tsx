import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useToast } from '../contexts/ToastContext'
import { useSettings, DEFAULT_KPI_TARGETS } from '../hooks/useSettings'
import type { AppSettings, KpiTargets } from '../hooks/useSettings'
import { Save, Target } from 'lucide-react'

export default function Settings() {
  const { settings, setSettings } = useSettings()
  const { showSuccess } = useToast()

  const [formData, setFormData] = useState<AppSettings>(() => ({
    ...settings,
    kpiTargets: {
      ...DEFAULT_KPI_TARGETS,
      ...(settings.kpiTargets || {}),
    },
  }))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleKpiTargetChange = (key: keyof KpiTargets, value: number) => {
    setFormData(prev => {
      const updatedTargets: KpiTargets = {
        ...(prev.kpiTargets || DEFAULT_KPI_TARGETS),
        [key]: value,
      }
      return {
        ...prev,
        ...(key === 'output' ? { chartTarget: value } : {}),
        kpiTargets: updatedTargets,
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSettings(formData)
    showSuccess('Settings saved successfully')
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full mx-auto overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 pb-32">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-on-surface">System Settings</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage local application preferences and benchmark targets (saved in this browser)
            </p>
          </header>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Preferences */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border-card pb-2">
              General Dashboard Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Default Project Name"
                name="defaultProjectName"
                value={formData.defaultProjectName}
                onChange={handleChange}
                placeholder="e.g. MEB21 HV"
                required
              />
              <Input
                label="Default Year"
                name="defaultYear"
                type="number"
                min={2020}
                max={2030}
                value={formData.defaultYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* KPI Targets Section */}
          <div className="space-y-4 pt-4">
            <div className="border-b border-border-card pb-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>KPI Benchmark Targets</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Configure the targets displayed with a faded look on the plant dashboard KPI cards
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Output Target (units)"
                name="outputTarget"
                type="number"
                min={0}
                value={formData.kpiTargets?.output ?? 9000}
                onChange={(e) => handleKpiTargetChange('output', Number(e.target.value))}
                required
              />
              <Input
                label="Scrap Rate Target (%)"
                name="scrapRateTarget"
                type="number"
                step="0.1"
                min={0}
                value={formData.kpiTargets?.scrapRate ?? 1.5}
                onChange={(e) => handleKpiTargetChange('scrapRate', Number(e.target.value))}
                required
              />
              <Input
                label="OEE Target (%)"
                name="oeeTarget"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={formData.kpiTargets?.oee ?? 80}
                onChange={(e) => handleKpiTargetChange('oee', Number(e.target.value))}
                required
              />
              <Input
                label="Insertion Rate CIM-1 (%)"
                name="insertion1Target"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={formData.kpiTargets?.insertion1 ?? 85}
                onChange={(e) => handleKpiTargetChange('insertion1', Number(e.target.value))}
                required
              />
              <Input
                label="Insertion Rate CIM-2 (%)"
                name="insertion2Target"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={formData.kpiTargets?.insertion2 ?? 85}
                onChange={(e) => handleKpiTargetChange('insertion2', Number(e.target.value))}
                required
              />
              <Input
                label="Insertion Rate CIM-3 (%)"
                name="insertion3Target"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={formData.kpiTargets?.insertion3 ?? 85}
                onChange={(e) => handleKpiTargetChange('insertion3', Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Charts & Visualization */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border-card pb-2">
              Charts & Visualization
            </h2>

            <Input
              label="Chart Target KPI"
              name="chartTarget"
              type="number"
              value={formData.chartTarget}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Chart Weeks (Desktop)"
                name="chartWeeksDesktop"
                type="number"
                min={1}
                max={52}
                value={formData.chartWeeksDesktop}
                onChange={handleChange}
                required
              />
              <Input
                label="Chart Weeks (Mobile)"
                name="chartWeeksMobile"
                type="number"
                min={1}
                max={52}
                value={formData.chartWeeksMobile}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
        </div>
      </div>
    </main>
  )
}
