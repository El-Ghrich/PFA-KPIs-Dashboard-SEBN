import React from 'react'

interface CountryFlagProps {
  country?: string | null
  className?: string
}

/**
 * Crisp SVG flag component tailored for international SEBN manufacturing sites.
 * Prevents OS-dependent emoji fallbacks on Windows/Linux browsers.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({ country = '', className = 'w-7 h-5' }) => {
  const norm = (country || '').trim().toLowerCase()

  // Morocco
  if (
    norm.includes('morocco') ||
    norm === 'ma' ||
    norm.includes('maroc') ||
    norm.includes('tangier') ||
    norm.includes('sale') ||
    norm.includes('salé')
  ) {
    return (
      <svg
        viewBox="0 0 900 600"
        className={`shrink-0 rounded-xs shadow-xs border border-black/10 overflow-hidden ${className}`}
        aria-label="Morocco Flag"
      >
        <rect width="900" height="600" fill="#c1272d" />
        {/* Moroccan Green Pentagram */}
        <polygon
          points="450,165 487,279 607,279 510,349 547,463 450,392 353,463 390,349 293,279 413,279"
          fill="none"
          stroke="#006233"
          strokeWidth="24"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Mexico
  if (norm.includes('mexico') || norm === 'mx' || norm.includes('mexique')) {
    return (
      <svg
        viewBox="0 0 840 480"
        className={`shrink-0 rounded-xs shadow-xs border border-black/10 overflow-hidden ${className}`}
        aria-label="Mexico Flag"
      >
        <rect width="280" height="480" fill="#006847" />
        <rect x="280" width="280" height="480" fill="#ffffff" />
        <rect x="560" width="280" height="480" fill="#ce1126" />
        {/* Simplified Mexican Coat of Arms (Eagle Emblem in center) */}
        <circle cx="420" cy="240" r="42" fill="#d97706" opacity="0.85" />
        <circle cx="420" cy="240" r="32" fill="#78350f" opacity="0.75" />
        <path d="M400,250 C410,230 430,230 440,250 C430,265 410,265 400,250 Z" fill="#047857" />
        <circle cx="420" cy="235" r="12" fill="#fef3c7" />
      </svg>
    )
  }

  // Tunisia
  if (norm.includes('tunisia') || norm === 'tn' || norm.includes('tunisie') || norm.includes('jendouba')) {
    return (
      <svg
        viewBox="0 0 1200 800"
        className={`shrink-0 rounded-xs shadow-xs border border-black/10 overflow-hidden ${className}`}
        aria-label="Tunisia Flag"
      >
        <rect width="1200" height="800" fill="#e70013" />
        <circle cx="600" cy="400" r="200" fill="#ffffff" />
        <circle cx="620" cy="400" r="150" fill="#e70013" />
        <circle cx="660" cy="400" r="120" fill="#ffffff" />
        <polygon
          points="620,335 632,375 672,375 640,398 652,438 620,414 588,438 600,398 568,375 608,375"
          fill="#e70013"
        />
      </svg>
    )
  }

  // Germany
  if (norm.includes('germany') || norm === 'de' || norm.includes('allemagne')) {
    return (
      <svg
        viewBox="0 0 5 3"
        className={`shrink-0 rounded-xs shadow-xs border border-black/10 overflow-hidden ${className}`}
        aria-label="Germany Flag"
      >
        <rect width="5" height="1" fill="#000000" />
        <rect y="1" width="5" height="1" fill="#dd0000" />
        <rect y="2" width="5" height="1" fill="#ffce00" />
      </svg>
    )
  }

  // Romania
  if (norm.includes('romania') || norm === 'ro' || norm.includes('roumanie')) {
    return (
      <svg
        viewBox="0 0 3 2"
        className={`shrink-0 rounded-xs shadow-xs border border-black/10 overflow-hidden ${className}`}
        aria-label="Romania Flag"
      >
        <rect width="1" height="2" fill="#002b7f" />
        <rect x="1" width="1" height="2" fill="#fcd116" />
        <rect x="2" width="1" height="2" fill="#ce1126" />
      </svg>
    )
  }

  // Fallback / International Site
  return (
    <div
      className={`shrink-0 rounded-xs bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase ${className}`}
      title={country || 'SEBN'}
    >
      {(country || 'SE').substring(0, 2)}
    </div>
  )
}

export default CountryFlag
