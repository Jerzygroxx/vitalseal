import type { Distance, Escalation, Status } from './types'

/** Latencia unidireccional representativa (s). Marte varía de ~3 a ~22 min. */
export const LATENCY_SECONDS: Record<Distance, number> = {
  leo: 1,
  moon: 2.5,
  mars: 22 * 60,
}

/**
 * Protocolo de escalamiento: depende de la distancia, no solo del estado.
 * - LEO: consulta inmediata con tierra.
 * - Luna: consulta asíncrona rápida.
 * - Marte: protocolo autónomo + reporte firmado para revisión diferida.
 * Con estado green no se escala; el nivel solo informa del canal disponible.
 */
export function escalate(distance: Distance, _overall: Status): Escalation {
  const level = distance === 'leo' ? 'immediate' : distance === 'moon' ? 'async' : 'autonomous'
  return { distance, level, latencySeconds: LATENCY_SECONDS[distance] }
}

export function escalationAction(e: Escalation, overall: Status): string {
  if (overall === 'green') return 'No action required. Continue the daily self-check.'
  switch (e.level) {
    case 'immediate':
      return 'Contact ground flight surgeon now (real-time link available).'
    case 'async':
      return 'Send a message to ground now; expect a reply in seconds to minutes.'
    case 'autonomous':
      return 'Follow the onboard autonomous protocol and send the signed report for delayed ground review.'
  }
}
