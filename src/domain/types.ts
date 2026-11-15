/**
 * Frozen type contract shared by the decision engine, the crypto layer and the UI.
 * Covers triage (readings, baselines, system status) and trust (hash chain, signed report).
 */

export type SystemId = 'neuro' | 'cardio' | 'metabolic' | 'musculoskeletal' | 'radiation'
/** Estado del semáforo. Nunca se muestra solo por color (color + icono + texto). */
export type Status = 'green' | 'amber' | 'red'
export type ReadingSource = 'manual' | 'band' | 'nasa-dataset'

export interface Reading {
  id: string
  date: string // ISO 8601
  heartRate: number // bpm
  systolic: number // mmHg
  diastolic: number // mmHg
  spo2: number // %
  temperature: number // °C
  sleepHours: number
  mood: number // 1-5
  symptoms: string[]
  radiationDose: number // mSv acumulados
  source: ReadingSource
  /** Marcado por plausibility.ts antes del cálculo del semáforo. */
  integrity?: 'ok' | 'doubtful'
}

/** Línea base personal (p. ej. media/desvío de los primeros 14 días). */
export interface Baseline {
  computedFrom: number // nº de lecturas usadas
  mean: Record<MetricKey, number>
  stdDev: Record<MetricKey, number>
}

export type MetricKey =
  | 'heartRate' | 'systolic' | 'diastolic' | 'spo2'
  | 'temperature' | 'sleepHours' | 'mood' | 'radiationDose'

export interface SystemStatus {
  id: SystemId
  label: string
  status: Status
  score: number // 0-100
  indicators: string[]
  action: string
  evidence: string[] // referencias a la tabla de umbrales
}

export type EscalationLevel = 'immediate' | 'async' | 'autonomous'
export type Distance = 'leo' | 'moon' | 'mars'

export interface Escalation {
  distance: Distance
  level: EscalationLevel
  latencySeconds: number
}

export interface TriageResult {
  overall: Status
  systems: SystemStatus[]
  escalation: Escalation
  generatedAt: string
}

/** Entrada de la hash chain: prevHash enlaza con la entrada anterior. */
export interface ChainEntry {
  index: number
  timestamp: string
  reading: Reading
  prevHash: string // hex SHA-256; '0'.repeat(64) en génesis
  hash: string // SHA-256(prevHash || canonical(reading) || timestamp)
}

export interface SignedReport {
  version: 1
  generatedAt: string
  entries: ChainEntry[]
  headHash: string
  signature: string // ECDSA P-256, base64
  publicKey: string // JWK serializado
}
