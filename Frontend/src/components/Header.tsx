interface HeaderProps {
  title: string
  subtitle: string
  currentTime: string
  currentDate: string
}

export default function Header({ title, subtitle, currentTime, currentDate }: HeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-none px-10  mt-8 flex items-center gap-4 z-20">
      <div className="flex-1 min-w-0">
        <h2 className="text-[20px] font-extrabold text-on-surface truncate leading-7">{title}</h2>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">{subtitle}</p>
      </div>
      <div className="hidden md:flex items-center gap-3 flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-[rgba(0,164,114,0.08)] text-[#00a472]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00a472]" />
          Normal
        </span>
        <span className="text-[14px] text-on-surface-variant tabular-nums whitespace-nowrap">
          Last refresh: <strong className="text-on-surface">{currentTime}</strong>
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 text-right">
        <div>
          <p className="text-[14px] font-medium text-on-surface tabular-nums">{currentTime}</p>
          <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{currentDate}</p>
        </div>
      </div>
    </header>
  )
}
