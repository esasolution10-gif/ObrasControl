import { useEffect, useState } from 'react'

/**
 * Evita hydration mismatch com Zustand persist + Next.js SSR.
 * Use em componentes que lêem estado persistido antes de renderizar.
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  return hydrated
}
