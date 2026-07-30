export default function AlertBanner() {
  return (
    <div
      className="mb-6 p-4 rounded-3xl shadow-sm flex items-start gap-3"
      style={{
        backgroundColor: '#fef3e2',
        borderLeft: '4px solid #e67e22',
        borderTop: '1px solid #fde0c2',
        borderRight: '1px solid #fde0c2',
        borderBottom: '1px solid #fde0c2',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-on-alert">Preventive Maintenance Due</p>
        <p className="text-[12px] text-[#9a3d00] mt-0.5">
          Compressor C-402 has reached 8,000 operating hours. Schedule oil change and vibration analysis within 72 hours.
        </p>
      </div>
    </div>
  )
}
