import type { Distance, EscalationLevel, Status } from '../../domain/types'

/**
 * Etiquetas de presentación (T-02). Funciones puras, sin React.
 * El texto de `statusLabel` es el mismo que muestra `StatusBadge`
 * (que lo consume desde aquí para no duplicar cadenas).
 */

const STATUS_LABELS: Record<Status, string> = {
  green: 'OK',
  amber: 'Watch',
  red: 'Alert',
}

export function statusLabel(status: Status): string {
  return STATUS_LABELS[status]
}

/**
 * Latencia unilateral legible:
 * - < 1 s  → "<1 s"
 * - < 60 s → segundos con un decimal ("2.5 s")
 * - >= 60 s → minutos redondeados ("22 min")
 * Se redondea a décimas antes de decidir, para que 59.99 s no imprima "60.0 s".
 */
export function formatLatency(seconds: number): string {
  const tenths = Math.round(seconds * 10) / 10
  if (tenths < 1) return '<1 s'
  if (tenths < 60) return `${tenths.toFixed(1)} s`
  return `${Math.round(seconds / 60)} min`
}

const ESCALATION_LABELS: Record<EscalationLevel, string> = {
  immediate: 'Immediate consult',
  async: 'Asynchronous consult',
  autonomous: 'Autonomous protocol',
}

export function escalationLabel(level: EscalationLevel): string {
  return ESCALATION_LABELS[level]
}

const DISTANCE_LABELS: Record<Distance, string> = {
  leo: 'LEO',
  moon: 'Moon',
  mars: 'Mars',
}

/** Nombre corto de la distancia para la línea de escalación del Dashboard. */
export function distanceLabel(distance: Distance): string {
  return DISTANCE_LABELS[distance]
}
