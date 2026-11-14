/**
 * Validación pura del Daily Check (T-01). Sin React ni DOM: se prueba con
 * Vitest en entorno node.
 *
 * Convención: los límites son INCLUSIVOS (min y max son valores válidos).
 * `radiationDose` no tiene tope superior (dosis acumulada).
 */

export interface ReadingValues {
  heartRate: string
  systolic: string
  diastolic: string
  spo2: string
  temperature: string
  sleepHours: string
  mood: string
  radiationDose: string
  symptoms: string
}

export type NumericField = Exclude<keyof ReadingValues, 'symptoms'>
export type FieldName = keyof ReadingValues

/** Errores por campo, listos para pintar junto al input. */
export type ValidationErrors = Partial<Record<FieldName, string>>

export interface NumericRule {
  field: NumericField
  label: string
  /** Unidad visible; vacío si el campo no tiene unidad (mood). */
  unit: string
  min: number
  /** `undefined` = sin tope superior. */
  max?: number
  /** Solo se aceptan enteros dentro del rango. */
  integer?: boolean
  /** Paso del input numérico. */
  step: number
}

/** Fuente única de límites y orden de tabulación del formulario. */
export const NUMERIC_RULES: readonly NumericRule[] = [
  { field: 'heartRate', label: 'Heart rate', unit: 'bpm', min: 20, max: 250, step: 1 },
  { field: 'systolic', label: 'Systolic pressure', unit: 'mmHg', min: 60, max: 250, step: 1 },
  { field: 'diastolic', label: 'Diastolic pressure', unit: 'mmHg', min: 30, max: 150, step: 1 },
  { field: 'spo2', label: 'SpO2', unit: '%', min: 50, max: 100, step: 1 },
  { field: 'temperature', label: 'Temperature', unit: '°C', min: 30, max: 45, step: 0.1 },
  { field: 'sleepHours', label: 'Sleep hours', unit: 'h', min: 0, max: 24, step: 0.5 },
  { field: 'mood', label: 'Mood', unit: '', min: 1, max: 5, integer: true, step: 1 },
  { field: 'radiationDose', label: 'Radiation dose', unit: 'mSv', min: 0, step: 0.01 },
]

/** Valores iniciales vacíos: ningún campo viene prellenado. */
export const EMPTY_VALUES: ReadingValues = {
  heartRate: '',
  systolic: '',
  diastolic: '',
  spo2: '',
  temperature: '',
  sleepHours: '',
  mood: '',
  radiationDose: '',
  symptoms: '',
}

function rangePhrase(rule: NumericRule): string {
  const unit = rule.unit ? ` ${rule.unit}` : ''
  return rule.max === undefined
    ? `${rule.min} or more${unit}`
    : `between ${rule.min} and ${rule.max}${unit}`
}

/** Texto de ayuda que acompaña al campo (unidades y rango permitido). */
export function rangeHint(rule: NumericRule): string {
  return rule.integer ? `Whole number ${rangePhrase(rule)}` : `Range: ${rangePhrase(rule)}`
}

function rangeError(rule: NumericRule): string {
  return rule.integer
    ? `${rule.label} must be a whole number ${rangePhrase(rule)}.`
    : `${rule.label} must be ${rangePhrase(rule)}.`
}

/**
 * Valida los 8 indicadores numéricos. `symptoms` es texto libre separado por
 * comas y no bloquea el envío. Devuelve un error legible por campo inválido.
 */
export function validateReading(values: ReadingValues): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const rule of NUMERIC_RULES) {
    const raw = values[rule.field].trim()

    if (raw === '') {
      errors[rule.field] = `${rule.label} is required.`
      continue
    }

    const value = Number(raw)

    if (!Number.isFinite(value)) {
      errors[rule.field] = `${rule.label} must be a number.`
      continue
    }

    const aboveMax = rule.max !== undefined && value > rule.max

    if (value < rule.min || aboveMax) {
      errors[rule.field] = rangeError(rule)
      continue
    }

    if (rule.integer && !Number.isInteger(value)) {
      errors[rule.field] = `${rule.label} must be a whole number.`
    }
  }

  return errors
}

/** True si hay al menos un campo inválido. */
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Convierte el texto de síntomas en lista: separa por comas, recorta espacios,
 * descarta vacíos y elimina duplicados sin distinguir mayúsculas. Conserva el
 * texto tal como lo escribió la persona.
 */
export function parseSymptoms(raw: string): string[] {
  const seen = new Set<string>()
  const symptoms: string[] = []

  for (const part of raw.split(',')) {
    const symptom = part.trim().replace(/\s+/g, ' ')
    if (symptom === '') continue

    const key = symptom.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    symptoms.push(symptom)
  }

  return symptoms
}
