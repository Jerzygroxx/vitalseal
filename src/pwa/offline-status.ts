import { useEffect, useState } from 'react'

export type OfflineTone = 'ready' | 'offline' | 'online' | 'uncached'

export interface OfflineStatus {
  tone: OfflineTone
  label: string
}

/**
 * Estado que se muestra al usuario. `ready` = el service worker ya controla la
 * página, es decir, la app quedó guardada y puede abrirse sin conexión.
 */
export function describeOffline({ online, ready }: { online: boolean; ready: boolean }): OfflineStatus {
  if (ready && online) return { tone: 'ready', label: 'Offline ready' }
  if (ready && !online) return { tone: 'offline', label: 'Offline mode' }
  if (!ready && online) return { tone: 'online', label: 'Online' }
  return { tone: 'uncached', label: 'Offline, not cached' }
}

export function useOfflineStatus(): OfflineStatus {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [ready, setReady] = useState(
    () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !!navigator.serviceWorker.controller,
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    let cancelled = false
    const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : null
    const check = () => {
      if (!cancelled) setReady(!!sw?.controller)
    }
    sw?.addEventListener('controllerchange', check)
    void sw?.ready.then(check).catch(() => undefined)

    return () => {
      cancelled = true
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      sw?.removeEventListener('controllerchange', check)
    }
  }, [])

  return describeOffline({ online, ready })
}
