import Header from '../../components/Header'
import { useClock } from '../../hooks/useClock'
import { formatTodayDate } from '../../lib/format'

interface DashboardHeaderProps {
  title: string
  subtitle: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const now = useClock()
  return <Header title={title} subtitle={subtitle} currentDate={formatTodayDate(now)} />
}
