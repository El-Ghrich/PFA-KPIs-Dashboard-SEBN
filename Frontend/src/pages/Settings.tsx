import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useToast } from '../contexts/ToastContext'
import { useSettings } from '../hooks/useSettings'
import type { AppSettings } from '../hooks/useSettings'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function Settings() {
  const { settings, setSettings } = useSettings()
  const { showSuccess } = useToast()

  const [formData, setFormData] = useState<AppSettings>(settings)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSettings(formData)
    showSuccess('Settings saved successfully')
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage local application preferences (saved in this browser)
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-slate-700/50 pb-2">
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

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-slate-700/50 pb-2">
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
    </main>
  )
}
