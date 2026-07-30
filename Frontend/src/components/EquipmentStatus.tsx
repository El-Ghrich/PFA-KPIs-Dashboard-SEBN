const equipment = [
  { id: 'C-401', name: 'Main Compressor', status: 'Running', color: '#00a472', bg: 'rgba(0,164,114,0.08)' },
  { id: 'C-402', name: 'Main Compressor', status: 'Maint. Due', color: '#e67e22', bg: '#fef3e2' },
  { id: 'C-403', name: 'Booster', status: 'Running', color: '#00a472', bg: 'rgba(0,164,114,0.08)' },
  { id: 'P-205', name: 'Cooling Pump', status: 'Fault', color: '#ba1a1a', bg: '#ffdad6' },
  { id: 'V-101', name: 'Separator', status: 'Normal', color: '#00a472', bg: 'rgba(0,164,114,0.08)' },
]

export default function EquipmentStatus() {
  return (
    <div className="dashboard-card bg-white rounded-3xl border border-border-card shadow-[1px_1px_9px_0px_rgba(0,0,0,0.1)]
 p-5 flex flex-col">
      <h3 className="text-[20px] font-semibold text-on-surface mb-4">Equipment Status</h3>
      <div className="flex-1 space-y-3">
        {equipment.map((eq) => (
          <div key={eq.id} className="flex items-center justify-between p-3 rounded bg-surface-container-low">
            <div>
              <p className="text-[14px] font-semibold text-on-surface">{eq.id}</p>
              <p className="text-[11px] text-on-surface-variant/70">{eq.name}</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: eq.bg, color: eq.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eq.color }} />
              {eq.status}
            </span>
          </div>
        ))}
      </div>
      <button className="mt-4 text-[12px] font-semibold text-secondary hover:text-secondary-container transition-colors flex items-center gap-1">
        View All Equipment
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}
