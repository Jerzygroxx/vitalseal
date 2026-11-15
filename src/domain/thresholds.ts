import type { MetricKey, SystemId } from './types'

/**
 * Tabla de umbrales. Cada fila lleva su fuente para el gate G-Calidad.
 *
 * IMPORTANT: `verified: false` = general clinical reference value (or an
 * illustrative prototype level, for radiation), not checked against a NASA
 * standard. Do not present it as a NASA threshold unless it becomes `true`.
 * This is a research prototype, not a medical device.
 */
export interface Threshold {
  metric: MetricKey
  system: SystemId
  label: string
  unit: string
  /** Fuera de [amberLow, amberHigh] => amber. */
  amberLow: number
  amberHigh: number
  /** Fuera de [redLow, redHigh] => red (límite de seguridad absoluto). */
  redLow: number
  redHigh: number
  /** Z-score vs baseline personal: >= amberZ amber, >= redZ red. */
  amberZ: number
  redZ: number
  /** Si false, no se evalúa por desviación (p. ej. dosis acumulada). */
  useBaseline: boolean
  source: string
  verified: boolean
}

const HRP = 'https://www.nasa.gov/reference/'
/** Indicador justificado por un riesgo HRP (cualitativo); el rango numérico es referencia clínica general, NO un umbral NASA. */
const REF = (slug: string) =>
  `Indicator rationale: NASA HRP ${HRP}${slug}/ . Numeric range: general clinical reference, not a NASA threshold.`

export const THRESHOLDS: Threshold[] = [
  { metric: 'heartRate', system: 'cardio', label: 'Heart rate', unit: 'bpm',
    amberLow: 50, amberHigh: 100, redLow: 40, redHigh: 130, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-of-cardiovascular-adaptations'), verified: false },
  { metric: 'systolic', system: 'cardio', label: 'Systolic BP', unit: 'mmHg',
    amberLow: 95, amberHigh: 135, redLow: 85, redHigh: 160, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-of-cardiovascular-adaptations'), verified: false },
  { metric: 'diastolic', system: 'cardio', label: 'Diastolic BP', unit: 'mmHg',
    amberLow: 60, amberHigh: 88, redLow: 50, redHigh: 100, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-of-cardiovascular-adaptations'), verified: false },
  { metric: 'spo2', system: 'cardio', label: 'SpO2', unit: '%',
    amberLow: 94, amberHigh: 100, redLow: 90, redHigh: 100, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-of-hypoxia'), verified: false },
  { metric: 'temperature', system: 'metabolic', label: 'Body temperature', unit: '°C',
    amberLow: 35.8, amberHigh: 37.6, redLow: 35, redHigh: 38.5, amberZ: 2, redZ: 3,
    useBaseline: true, source: 'Indicator suggested by the challenge statement. The NASA HRP pages read set no temperature limits. Numeric range: general clinical reference, not a NASA threshold.', verified: false },
  { metric: 'sleepHours', system: 'neuro', label: 'Sleep', unit: 'h',
    amberLow: 6, amberHigh: 10, redLow: 4, redHigh: 12, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-from-inadequate-sleep-and-irregular-schedules'), verified: false },
  { metric: 'mood', system: 'neuro', label: 'Mood (1-5)', unit: 'pts',
    amberLow: 2.5, amberHigh: 5, redLow: 1.5, redHigh: 5, amberZ: 2, redZ: 3,
    useBaseline: true, source: REF('risk-of-behavioral-changes-and-psychiatric-disorders'), verified: false },
  { metric: 'radiationDose', system: 'radiation', label: 'Cumulative dose', unit: 'mSv',
    amberLow: 0, amberHigh: 400, redLow: 0, redHigh: 600, amberZ: 99, redZ: 99,
    useBaseline: false, source: `Rationale: NASA HRP ${HRP}risk-of-radiation-induced-cancers/ . The 400 and 600 mSv levels are illustrative prototype values, not NASA limits.`, verified: false },
]

export const SYSTEM_LABELS: Record<SystemId, string> = {
  neuro: 'Neuro / behavioral',
  cardio: 'Cardiovascular',
  metabolic: 'Metabolic',
  musculoskeletal: 'Musculoskeletal',
  radiation: 'Radiation / immune',
}
