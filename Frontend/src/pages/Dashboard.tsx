import { useState, useEffect } from 'react'
import Header from '../components/Header'
import AlertBanner from '../components/AlertBanner'
import KpiCard from '../components/KpiCard'
import ProductionChart from '../components/ProductionChart'
import EquipmentStatus from '../components/EquipmentStatus'
import AlarmsTable from '../components/AlarmsTable'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour12: false })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Chicago',
  }).toUpperCase().replace(',', ' · CST')
}

export default function Dashboard() {
  const now = useClock()

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <Header
        title="HCM-S Weekly Highlights"
        subtitle="Overview of performance and key highlights for the selected week and project"
        currentTime={formatTime(now)}
        currentDate={formatDate(now)}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Output" value="847" unit="units" trend={{ direction: 'up', text: '+2.4%' }} />
          <KpiCard label="Scrap Rate" value="2.1" unit="%" trend={{ direction: 'up', text: '+0.1%', color: '#e67e22' }} />
          <KpiCard label="OEE" value="94.6" unit="%" trend={{ direction: 'up', text: '+0.8%', color: '#00a472' }} />
          <KpiCard label="Downtime" value="1.2" unit="%" trend={{ direction: 'down', text: '-0.3%', color: '#00a472' }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ProductionChart />
          <EquipmentStatus />
        </div>

        <AlarmsTable />
      </div>
    </main>
  )
}
