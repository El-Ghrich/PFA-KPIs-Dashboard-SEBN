const alarms = [
  { time: '14:28:42', unit: 'P-205', type: 'High Vibration', typeColor: '#ba1a1a', message: 'Bearing vibration exceeded threshold — 12.4 mm/s', value: '12.4', valueUnit: 'mm/s', status: 'CRITICAL', statusBg: '#ffdad6', statusColor: '#93000a' },
  { time: '13:55:17', unit: 'C-402', type: 'Maintenance', typeColor: '#e67e22', message: 'Oil change interval reached — 8,000 operating hours', value: '8,000', valueUnit: 'hrs', status: 'WARNING', statusBg: '#fef3e2', statusColor: '#e67e22' },
  { time: '12:10:03', unit: 'C-401', type: 'Startup', typeColor: '#00a472', message: 'Compressor C-401 started successfully — normal parameters', value: '—', valueUnit: '', status: 'NORMAL', statusBg: 'rgba(0,164,114,0.08)', statusColor: '#00a472' },
  { time: '09:45:28', unit: 'V-101', type: 'Level OK', typeColor: '#00a472', message: 'Separator level stabilized at setpoint — 62% capacity', value: '62', valueUnit: '%', status: 'NORMAL', statusBg: 'rgba(0,164,114,0.08)', statusColor: '#00a472' },
  { time: '08:02:51', unit: 'C-403', type: 'Ramp Up', typeColor: '#00a472', message: 'Booster ramped to 100% capacity — discharge pressure nominal', value: '100', valueUnit: '%', status: 'NORMAL', statusBg: 'rgba(0,164,114,0.08)', statusColor: '#00a472' },
  { time: '06:30:00', unit: 'C-401', type: 'Shift Start', typeColor: '#00a472', message: 'Shift handover completed — all units operational', value: '—', valueUnit: '', status: 'NORMAL', statusBg: 'rgba(0,164,114,0.08)', statusColor: '#00a472' },
]

export default function AlarmsTable() {
  return (
    <div className="dashboard-card bg-white rounded border border-border-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border-card flex items-center justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-on-surface">Recent Alarms & Events</h3>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">Last 50 Records</p>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Filter events..."
            className="px-3 py-2 rounded border border-outline-variant text-[14px] text-on-surface placeholder-on-surface-variant/50 bg-white min-w-[180px] focus:outline-none focus:border-[#2170e4] focus:ring-3 focus:ring-[rgba(33,112,228,0.2)]"
          />
          <button className="px-3 py-2 rounded border border-outline-variant text-[12px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70 bg-table-header-bg">
              <th className="text-left px-5 py-3 whitespace-nowrap">Timestamp</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Unit</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Event Type</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Message</th>
              <th className="text-right px-5 py-3 whitespace-nowrap">Value</th>
              <th className="text-center px-5 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {alarms.map((a, i) => (
              <tr key={i} className="border-b border-border-card hover:bg-surface-container-low transition-colors">
                <td className="px-5 py-2.5 text-[14px] font-medium tabular-nums text-on-surface whitespace-nowrap">{a.time}</td>
                <td className="px-5 py-2.5 font-semibold text-on-surface whitespace-nowrap">{a.unit}</td>
                <td className="px-5 py-2.5 whitespace-nowrap">
                  <span className="text-[12px] font-semibold" style={{ color: a.typeColor }}>{a.type}</span>
                </td>
                <td className="px-5 py-2.5 text-on-surface-variant truncate max-w-[240px]">{a.message}</td>
                <td className="px-5 py-2.5 text-[14px] font-medium tabular-nums text-right text-on-surface whitespace-nowrap">
                  {a.value} {a.valueUnit && <span className="text-on-surface-variant/60 font-normal">{a.valueUnit}</span>}
                </td>
                <td className="px-5 py-2.5 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: a.statusBg, color: a.statusColor }}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border-card flex items-center justify-between text-[12px] text-on-surface-variant/70">
        <span>Showing 6 of 50 events</span>
        <div className="flex gap-1">
          <button className="px-2.5 py-1 rounded border border-outline-variant hover:bg-surface-container-high transition-colors font-medium">Prev</button>
          <button className="px-2.5 py-1 rounded bg-[#1e293b] text-white font-medium">1</button>
          <button className="px-2.5 py-1 rounded border border-outline-variant hover:bg-surface-container-high transition-colors font-medium">2</button>
          <button className="px-2.5 py-1 rounded border border-outline-variant hover:bg-surface-container-high transition-colors font-medium">3</button>
          <button className="px-2.5 py-1 rounded border border-outline-variant hover:bg-surface-container-high transition-colors font-medium">Next</button>
        </div>
      </div>
    </div>
  )
}
