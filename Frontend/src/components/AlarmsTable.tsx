const alarms = [
  { time: '14:28:42', unit: 'P-205', type: 'High Vibration', typeColor: '#ef4444', message: 'Bearing vibration exceeded threshold — 12.4 mm/s', value: '12.4', valueUnit: 'mm/s', status: 'CRITICAL', statusBg: '#fee2e2', statusColor: '#991b1b' },
  { time: '13:55:17', unit: 'C-402', type: 'Maintenance', typeColor: '#f59e0b', message: 'Oil change interval reached — 8,000 operating hours', value: '8,000', valueUnit: 'hrs', status: 'WARNING', statusBg: '#fef3c7', statusColor: '#92400e' },
  { time: '12:10:03', unit: 'C-401', type: 'Startup', typeColor: '#22c55e', message: 'Compressor C-401 started successfully — normal parameters', value: '—', valueUnit: '', status: 'NORMAL', statusBg: '#dcfce7', statusColor: '#166534' },
  { time: '09:45:28', unit: 'V-101', type: 'Level OK', typeColor: '#22c55e', message: 'Separator level stabilized at setpoint — 62% capacity', value: '62', valueUnit: '%', status: 'NORMAL', statusBg: '#dcfce7', statusColor: '#166534' },
  { time: '08:02:51', unit: 'C-403', type: 'Ramp Up', typeColor: '#3b82f6', message: 'Booster ramped to 100% capacity — discharge pressure nominal', value: '100', valueUnit: '%', status: 'NORMAL', statusBg: '#dbeafe', statusColor: '#1e40af' },
  { time: '06:30:00', unit: 'C-401', type: 'Shift Start', typeColor: '#64748b', message: 'Shift handover completed — all units operational', value: '—', valueUnit: '', status: 'NORMAL', statusBg: '#f1f5f9', statusColor: '#475569' },
]

export default function AlarmsTable() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="px-5 py-4 flex items-center justify-between border-b border-border-card">
        <div>
          <h3 className="text-[16px] font-semibold text-on-surface">Recent Alarms & Events</h3>
          <p className="text-[11px] font-medium text-on-surface-variant/60 mt-0.5">Last 50 Records</p>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Filter events..."
            className="px-3 py-2 rounded-lg border border-border-card text-[13px] text-on-surface placeholder-on-surface-variant/50 bg-white min-w-[180px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button className="px-3 py-2 rounded-lg border border-border-card text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors duration-200 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
              <th className="text-left px-4 py-3 whitespace-nowrap font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 whitespace-nowrap font-medium">Unit</th>
              <th className="text-left px-4 py-3 whitespace-nowrap font-medium">Event Type</th>
              <th className="text-left px-4 py-3 whitespace-nowrap font-medium">Message</th>
              <th className="text-right px-4 py-3 whitespace-nowrap font-medium">Value</th>
              <th className="text-center px-4 py-3 whitespace-nowrap font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {alarms.map((a, i) => (
              <tr key={i} className="border-b border-[#f1f5f9] hover:bg-surface transition-colors duration-150">
                <td className="px-4 py-2.5 text-[13px] font-medium tabular-nums text-on-surface whitespace-nowrap">{a.time}</td>
                <td className="px-4 py-2.5 font-semibold text-on-surface whitespace-nowrap">{a.unit}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-[12px] font-semibold" style={{ color: a.typeColor }}>{a.type}</span>
                </td>
                <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[240px]">{a.message}</td>
                <td className="px-4 py-2.5 text-[13px] font-medium tabular-nums text-right text-on-surface whitespace-nowrap">
                  {a.value} {a.valueUnit && <span className="text-on-surface-variant/50 font-normal">{a.valueUnit}</span>}
                </td>
                <td className="px-4 py-2.5 text-center">
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
      <div className="px-5 py-3 border-t border-border-card flex items-center justify-between text-[12px] text-on-surface-variant/60">
        <span>Showing 6 of 50 events</span>
        <div className="flex gap-1">
          <button className="px-2.5 py-1 rounded-lg border border-border-card text-on-surface-variant hover:bg-surface-container transition-colors duration-200 font-medium">Prev</button>
          <button className="px-2.5 py-1 rounded-lg bg-primary text-white font-medium">1</button>
          <button className="px-2.5 py-1 rounded-lg border border-border-card text-on-surface-variant hover:bg-surface-container transition-colors duration-200 font-medium">2</button>
          <button className="px-2.5 py-1 rounded-lg border border-border-card text-on-surface-variant hover:bg-surface-container transition-colors duration-200 font-medium">3</button>
          <button className="px-2.5 py-1 rounded-lg border border-border-card text-on-surface-variant hover:bg-surface-container transition-colors duration-200 font-medium">Next</button>
        </div>
      </div>
    </div>
  )
}
