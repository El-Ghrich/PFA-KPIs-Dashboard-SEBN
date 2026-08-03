import { useEffect, useState } from 'react'

export function useBreakpoint(bp: number): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= bp)

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= bp)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [bp])

  return wide
}
