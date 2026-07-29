export default function ProductionChart() {
  return (
    <div className="dashboard-card bg-white rounded border border-border-card p-5 lg:col-span-2 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[20px] font-semibold text-on-surface">Production Trend</h3>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">24-Hour Rolling Window</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded text-[12px] font-semibold bg-[#1e293b] text-[#8590a6]">24H</button>
          <button className="px-3 py-1.5 rounded text-[12px] font-medium text-on-surface-variant border border-outline-variant hover:border-outline transition-colors">7D</button>
          <button className="px-3 py-1.5 rounded text-[12px] font-medium text-on-surface-variant border border-outline-variant hover:border-outline transition-colors">30D</button>
        </div>
      </div>
      <div className="flex-1 relative" style={{ minHeight: '280px' }}>
        <svg viewBox="0 0 620 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="dotGrid" x="0" y="0" width="31" height="28" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.8" fill="#e8ecf1"/>
            </pattern>
            <linearGradient id="areaGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2170e4" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#2170e4" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="areaGradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00a472" stopOpacity="0.14"/>
              <stop offset="100%" stopColor="#00a472" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect x="40" y="0" width="580" height="240" fill="url(#dotGrid)"/>

          <text x="32" y="20" textAnchor="end" className="text-[10px]" fill="#75777d" fontFamily="Inter" fontWeight="500">1000</text>
          <text x="32" y="68" textAnchor="end" className="text-[10px]" fill="#75777d" fontFamily="Inter" fontWeight="500">900</text>
          <text x="32" y="116" textAnchor="end" className="text-[10px]" fill="#75777d" fontFamily="Inter" fontWeight="500">800</text>
          <text x="32" y="164" textAnchor="end" className="text-[10px]" fill="#75777d" fontFamily="Inter" fontWeight="500">700</text>
          <text x="32" y="212" textAnchor="end" className="text-[10px]" fill="#75777d" fontFamily="Inter" fontWeight="500">600</text>

          <line x1="40" y1="24" x2="620" y2="24" stroke="#e8ecf1" strokeWidth="0.5"/>
          <line x1="40" y1="72" x2="620" y2="72" stroke="#e8ecf1" strokeWidth="0.5"/>
          <line x1="40" y1="120" x2="620" y2="120" stroke="#e8ecf1" strokeWidth="0.5"/>
          <line x1="40" y1="168" x2="620" y2="168" stroke="#e8ecf1" strokeWidth="0.5"/>
          <line x1="40" y1="216" x2="620" y2="216" stroke="#e8ecf1" strokeWidth="0.5"/>

          <line x1="40" y1="240" x2="620" y2="240" stroke="#c5c6cd" strokeWidth="1"/>
          <text x="40" y="256" textAnchor="middle" className="text-[9px]" fill="#75777d" fontFamily="Inter">00:00</text>
          <text x="156" y="256" textAnchor="middle" className="text-[9px]" fill="#75777d" fontFamily="Inter">06:00</text>
          <text x="272" y="256" textAnchor="middle" className="text-[9px]" fill="#75777d" fontFamily="Inter">12:00</text>
          <text x="388" y="256" textAnchor="middle" className="text-[9px]" fill="#75777d" fontFamily="Inter">18:00</text>
          <text x="504" y="256" textAnchor="middle" className="text-[9px]" fill="#75777d" fontFamily="Inter">Now</text>

          <rect x="40" y="48" width="580" height="48" fill="#00a472" opacity="0.04" rx="2"/>
          <line x1="40" y1="72" x2="620" y2="72" stroke="#00a472" strokeWidth="1" strokeDasharray="6,4" opacity="0.5"/>
          <text x="618" y="68" textAnchor="end" className="text-[9px]" fill="#00a472" fontFamily="Inter" fontWeight="600">TARGET</text>

          <path d="M40,168 L60,160 L80,155 L100,148 L120,140 L140,135 L160,130 L180,125 L200,118 L220,112 L240,108 L260,100 L280,95 L300,88 L320,82 L340,78 L360,72 L380,68 L400,62 L420,58 L440,55 L460,50 L480,48 L500,42 L520,40 L540,38 L560,35 L580,32 L600,30 L620,28 L620,240 L40,240 Z"
            fill="url(#areaGradBlue)"/>
          <polyline points="40,168 60,160 80,155 100,148 120,140 140,135 160,130 180,125 200,118 220,112 240,108 260,100 280,95 300,88 320,82 340,78 360,72 380,68 400,62 420,58 440,55 460,50 480,48 500,42 520,40 540,38 560,35 580,32 600,30 620,28"
            fill="none" stroke="#2170e4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          <path d="M40,180 L60,175 L80,172 L100,168 L120,165 L140,160 L160,158 L180,152 L200,148 L220,145 L240,140 L260,138 L280,132 L300,128 L320,125 L340,120 L360,118 L380,112 L400,108 L420,105 L440,100 L460,98 L480,94 L500,90 L520,88 L540,84 L560,80 L580,78 L600,74 L620,72 L620,240 L40,240 Z"
            fill="url(#areaGradGreen)"/>
          <polyline points="40,180 60,175 80,172 100,168 120,165 140,160 160,158 180,152 200,148 220,145 240,140 260,138 280,132 300,128 320,125 340,120 360,118 380,112 400,108 420,105 440,100 460,98 480,94 500,90 520,88 540,84 560,80 580,78 600,74 620,72"
            fill="none" stroke="#00a472" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          <circle cx="620" cy="28" r="5" fill="white" stroke="#2170e4" strokeWidth="2.5"/>
          <circle cx="620" cy="28" r="2.5" fill="#2170e4"/>
          <circle cx="620" cy="72" r="5" fill="white" stroke="#00a472" strokeWidth="2.5"/>
          <circle cx="620" cy="72" r="2.5" fill="#00a472"/>

          <rect x="500" y="8" width="10" height="10" rx="2" fill="#2170e4"/>
          <text x="514" y="17" className="text-[10px]" fill="#1b1b1d" fontFamily="Inter" fontWeight="600">Throughput</text>
          <rect x="580" y="8" width="10" height="10" rx="2" fill="#00a472"/>
          <text x="594" y="17" className="text-[10px]" fill="#1b1b1d" fontFamily="Inter" fontWeight="600">Efficiency</text>
        </svg>

        <div className="absolute top-4 right-4 text-white text-[11px] px-3 py-2 rounded pointer-events-none"
          style={{ backgroundColor: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <p className="font-semibold">Latest Reading</p>
          <p className="tabular-nums mt-0.5"><span style={{ color: '#adc6ff' }}>◆</span> 847 MMSCFD</p>
          <p className="tabular-nums"><span style={{ color: '#4edea3' }}>◆</span> 94.6% Eff.</p>
        </div>
      </div>
    </div>
  )
}
