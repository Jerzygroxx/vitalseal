import { CircleCheck, OctagonX, TriangleExclamationPoint, type LucideIcon } from 'lucide-react'
import type { Status } from '../../domain/types'
import { statusLabel } from './format'
import { STATUS_TONES } from './status-tone'

/** Una forma distinta por estado: círculo, triángulo, octágono. */
const BADGE_ICONS: Record<Status, LucideIcon> = {
  green: CircleCheck,
  amber: TriangleExclamationPoint,
  red: OctagonX,
}

export interface StatusBadgeProps {
  status: Status
  /** `lg` para el estado general del Dashboard. */
  size?: 'sm' | 'lg'
}

/**
 * Semáforo accesible: icono + texto + color (nunca solo color).
 * Los tonos claros sobre vidrio oscuro mantienen contraste >= 4.5:1.
 */
export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const Icon = BADGE_ICONS[status]
  const label = statusLabel(status)
  const large = size === 'lg'

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center rounded-full border font-semibold uppercase ${
        large
          ? 'gap-2 px-4 py-1.5 text-base tracking-[0.12em]'
          : 'gap-1.5 px-2.5 py-1 text-xs tracking-[0.1em]'
      } ${STATUS_TONES[status].chip}`}
    >
      <Icon aria-hidden="true" className={`shrink-0 ${large ? 'size-5' : 'size-4'}`} />
      <span>{label}</span>
    </span>
  )
}
