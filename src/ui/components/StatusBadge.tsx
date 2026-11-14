import { CircleCheck, OctagonX, TriangleExclamationPoint, type LucideIcon } from 'lucide-react'
import type { Status } from '../../domain/types'
import { statusLabel } from './format'

interface BadgeStyle {
  icon: LucideIcon
  /** Fondo + texto + borde: el color nunca es el único indicador. */
  tone: string
}

const BADGE_STYLES: Record<Status, BadgeStyle> = {
  green: {
    icon: CircleCheck,
    tone: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
  },
  amber: {
    icon: TriangleExclamationPoint,
    tone: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
  },
  red: {
    icon: OctagonX,
    tone: 'border-red-400/40 bg-red-500/15 text-red-300',
  },
}

/**
 * Semáforo accesible: icono + texto + color (nunca solo color).
 * Los tonos claros sobre fondo oscuro mantienen contraste >= 4.5:1.
 */
export function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, tone } = BADGE_STYLES[status]
  const label = statusLabel(status)

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </span>
  )
}
