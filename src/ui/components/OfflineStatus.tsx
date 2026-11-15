import { CloudCheck, Wifi, WifiOff, type LucideIcon } from 'lucide-react'
import { useOfflineStatus, type OfflineTone } from '../../pwa/offline-status'

const STYLE: Record<OfflineTone, { icon: LucideIcon; tone: string }> = {
  ready: { icon: CloudCheck, tone: 'border-ok/50 text-ok' },
  offline: { icon: WifiOff, tone: 'border-watch/50 text-watch' },
  online: { icon: Wifi, tone: 'border-line text-fg-muted' },
  uncached: { icon: WifiOff, tone: 'border-alert/50 text-alert' },
}

/** Estado de conexión y de disponibilidad sin conexión: icono + texto + color. */
export function OfflineStatus() {
  const { tone, label } = useOfflineStatus()
  const { icon: Icon, tone: toneClass } = STYLE[tone]
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
