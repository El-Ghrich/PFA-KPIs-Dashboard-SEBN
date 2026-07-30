interface HeaderProps {
  title: string
  subtitle: string
  currentTime: string
  currentDate: string
}

export default function Header({ title, subtitle, currentTime, currentDate }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold text-on-surface tracking-tight leading-snug">{title}</h1>
        <p className="text-[12px] font-medium text-on-surface-variant/70 mt-0.5">{subtitle}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
      
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider leading-tight"> Today : {currentDate}</p>
        </div>
      </div>
    </div>
  )
}
