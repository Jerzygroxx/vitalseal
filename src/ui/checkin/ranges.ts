/**
 * Límites numéricos y textos de rango del check-in paso a paso (T-06).
 *
 * Copiados del chequeo diario compartido para que esta carpeta no dependa de
 * `src/ui/daily-check/`, que este wizard reemplaza:
 * - límites y pasos → `src/ui/daily-check/validation.ts`, NUMERIC_RULES (42-51)
 * - ayuda y error → `src/ui/daily-check/validation.ts`, rangeHint/rangeError (66-82)
 *
 * Convención: los límites son INCLUSIVOS (min y max son valores válidos).
 * `max` ausente = sin tope superior (dosis acumulada).
 */

export type NumericField =
  | 'heartRate'
  | 'systolic'
  | 'diastolic'
  | 'spo2'
  | 'temperature'
  | 'sleepHours'
  | 'mood'
  | 'radiationDose'

/** Campos que se escriben con el teclado (todo menos la elección de ánimo). */
export type TextField = Exclude<NumericField, 'mood'>

export interface NumericLimit {
  field: NumericField
  label: string
  /** Unidad visible junto al control; vacío si la pregunta no tiene unidad. */
  unit: string
  min: number
  /** `undefined` = sin tope superior. */
  max?: number
  /** Solo se aceptan enteros dentro del rango. */
  integer?: boolean
  /** Incremento de los botones − / + y del atributo `step`. */
  step: number
}

/** Fuente única de límites del wizard. */
export const NUMERIC_LIMITS: Record<NumericField, NumericLimit> = {
  heartRate: { field: 'heartRate', label: 'Heart rate', unit: 'bpm', min: 20, max: 250, step: 1 },
  systolic: { field: 'systolic', label: 'Systolic pressure', unit: 'mmHg', min: 60, max: 250, step: 1 },
  diastolic: { field: 'diastolic', label: 'Diastolic pressure', unit: 'mmHg', min: 30, max: 150, step: 1 },
  spo2: { field: 'spo2', label: 'SpO2', unit: '%', min: 50, max: 100, step: 1 },
  temperature: { field: 'temperature', label: 'Temperature', unit: '°C', min: 30, max: 45, step: 0.1 },
  sleepHours: { field: 'sleepHours', label: 'Sleep hours', unit: 'h', min: 0, max: 24, step: 0.5 },
  mood: { field: 'mood', label: 'Mood', unit: '', min: 1, max: 5, integer: true, step: 1 },
  radiationDose: { field: 'radiationDose', label: 'Radiation dose', unit: 'mSv', min: 0, step: 0.01 },
}

function rangePhrase(limit: NumericLimit): string {
  const unit = limit.unit ? ` ${limit.unit}` : ''
  return limit.max === undefined
    ? `${limit.min} or more${unit}`
    : `between ${limit.min} and ${limit.max}${unit}`
}

/** Línea corta bajo el control: unidad y rango permitido. */
export function rangeHint(limit: NumericLimit): string {
  return limit.integer ? `Whole number ${rangePhrase(limit)}` : `Range: ${rangePhrase(limit)}`
}

/** Error legible cuando el valor queda fuera del rango permitido. */
export function rangeError(limit: NumericLimit): string {
  return limit.integer
    ? `${limit.label} must be a whole number ${rangePhrase(limit)}.`
    : `${limit.label} must be ${rangePhrase(limit)}.`
}
