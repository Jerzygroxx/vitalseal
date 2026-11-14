import { zScore } from './baseline'
import { escalate, escalationAction } from './escalation'
import { SYSTEM_LABELS, THRESHOLDS } from './thresholds'
import type {
  Baseline, Distance, Reading, Status, SystemId, SystemStatus, TriageResult,
} from './types'

const RANK: Record<Status, number> = { green: 0, amber: 1, red: 2 }
const SYSTEMS: SystemId[] = ['neuro', 'cardio', 'metabolic', 'musculoskeletal', 'radiation']

export const worst = (a: Status, b: Status): Status => (RANK[a] >= RANK[b] ? a : b)

/** Penalización de score (0-100) por estado de un indicador. */
const PENALTY: Record<Status, number> = { green: 0, amber: 25, red: 60 }

const MSK_WORDS = ['pain', 'muscle', 'bone', 'back', 'joint']

interface Finding { status: Status; text: string; evidence: string }

/**
 * Evalúa una lectura contra límites absolutos (seguridad) y contra el baseline
 * personal (tendencia). El estado de cada sistema es el peor de sus indicadores.
 * Lecturas con integridad dudosa no producen semáforo: piden re-medición.
 */
export function evaluate(
  reading: Reading,
  baseline: Baseline,
  distance: Distance = 'mars',
): TriageResult {
  const findings: Record<SystemId, Finding[]> = {
    neuro: [], cardio: [], metabolic: [], musculoskeletal: [], radiation: [],
  }

  for (const t of THRESHOLDS) {
    const v = reading[t.metric]
    let status: Status = 'green'
    let why = ''
    if (v < t.redLow || v > t.redHigh) {
      status = 'red'; why = `${v}${t.unit} outside safety limit`
    } else if (v < t.amberLow || v > t.amberHigh) {
      status = 'amber'; why = `${v}${t.unit} outside expected range`
    }
    if (t.useBaseline && baseline.computedFrom >= 3) {
      const z = Math.abs(zScore(v, t.metric, baseline))
      const zs: Status = z >= t.redZ ? 'red' : z >= t.amberZ ? 'amber' : 'green'
      if (RANK[zs] > RANK[status]) {
        status = zs; why = `${v}${t.unit} deviates ${z.toFixed(1)}σ from personal baseline`
      }
    }
    if (status !== 'green') {
      findings[t.system].push({ status, text: `${t.label}: ${why}`, evidence: t.source })
    }
  }

  const msk = reading.symptoms.filter((s) => MSK_WORDS.some((w) => s.toLowerCase().includes(w)))
  if (msk.length > 0) {
    findings.musculoskeletal.push({
      status: msk.length >= 3 ? 'red' : 'amber',
      text: `Reported: ${msk.join(', ')}`,
      evidence: 'Síntomas auto-reportados (regla interna, sin umbral NASA)',
    })
  }
  const other = reading.symptoms.filter((s) => !msk.includes(s))
  if (other.length >= 2) {
    findings.radiation.push({
      status: 'amber',
      text: `Multiple symptoms: ${other.join(', ')}`,
      evidence: 'Regla interna: 2+ síntomas no musculoesqueléticos',
    })
  }

  const doubtful = reading.integrity === 'doubtful'
  const systems: SystemStatus[] = SYSTEMS.map((id) => {
    const fs = findings[id]
    const status = fs.reduce<Status>((acc, f) => worst(acc, f.status), 'green')
    const score = Math.max(0, 100 - fs.reduce((s, f) => s + PENALTY[f.status], 0))
    return {
      id, label: SYSTEM_LABELS[id], status, score,
      indicators: fs.map((f) => f.text),
      action: '', // se rellena abajo con el overall
      evidence: [...new Set(fs.map((f) => f.evidence))],
    }
  })

  const overall = systems.reduce<Status>((acc, s) => worst(acc, s.status), 'green')
  const escalation = escalate(distance, overall)
  const action = doubtful
    ? 'Data integrity doubtful: re-measure before relying on this result.'
    : escalationAction(escalation, overall)
  for (const s of systems) s.action = s.status === 'green' ? 'No action required.' : action

  return { overall, systems, escalation, generatedAt: reading.date }
}
