/**
 * Lógica pura del check-in "una pregunta por pantalla" (T-06): definición de
 * pasos, validación por paso, botones − / +, chips de síntomas y construcción
 * del `Reading` final. Sin React ni DOM: se prueba con Vitest en entorno node.
 */

import type { Reading } from '../../domain/types'
import { NUMERIC_LIMITS, rangeError, type NumericField, type NumericLimit, type TextField } from './ranges'

export type StepId =
  | 'heartRate'
  | 'bloodPressure'
  | 'spo2'
  | 'temperature'
  | 'sleepHours'
  | 'mood'
  | 'symptoms'
  | 'radiationDose'

export type StepKind = 'number' | 'mood' | 'symptoms'

export interface StepDefinition {
  id: StepId
  /** Pregunta grande del paso, en inglés. */
  question: string
  /** Una línea corta: cómo medirlo. Nunca consejo médico. */
  help: string
  kind: StepKind
  /** Controles numéricos de la pantalla (dos en la presión arterial). */
  fields: readonly TextField[]
}

/** Los 8 pasos, en el orden en que se muestran. */
export const STEPS: readonly StepDefinition[] = [
  {
    id: 'heartRate',
    question: 'What is your heart rate?',
    help: 'Run the band reading, or count your pulse for 30 seconds and double it.',
    kind: 'number',
    fields: ['heartRate'],
  },
  {
    id: 'bloodPressure',
    question: 'What is your blood pressure?',
    help: 'Take it with the cuff and enter both numbers, systolic and diastolic.',
    kind: 'number',
    fields: ['systolic', 'diastolic'],
  },
  {
    id: 'spo2',
    question: 'What is your blood oxygen level?',
    help: 'Place the band sensor on a fingertip and hold still until the number settles.',
    kind: 'number',
    fields: ['spo2'],
  },
  {
    id: 'temperature',
    question: 'What is your body temperature?',
    help: 'Use the skin sensor or an ear thermometer. Enter the value in degrees Celsius.',
    kind: 'number',
    fields: ['temperature'],
  },
  {
    id: 'sleepHours',
    question: 'How many hours did you sleep last night?',
    help: 'Count from lights out to wake-up. Half hours are fine.',
    kind: 'number',
    fields: ['sleepHours'],
  },
  {
    id: 'mood',
    question: 'How is your mood today?',
    help: 'Pick the face closest to how you feel right now.',
    kind: 'mood',
    fields: [],
  },
  {
    id: 'symptoms',
    question: 'Do you have any symptoms today?',
    help: 'Tap every symptom you notice. If you have none, tap None.',
    kind: 'symptoms',
    fields: [],
  },
  {
    id: 'radiationDose',
    question: 'What is your radiation dose?',
    help: 'Read the cumulative total from your dosimeter.',
    kind: 'number',
    fields: ['radiationDose'],
  },
]

export const STEP_COUNT = STEPS.length

/** Etiquetas de los cinco botones de ánimo (1 Very low … 5 Great). */
export const MOOD_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 1, label: 'Very low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
]

/** Chip que limpia el resto de síntomas. No forma parte de `SYMPTOMS`. */
export const SYMPTOM_NONE = 'None'

/**
 * Chips de síntomas. El formulario viejo era texto libre
 * (`src/ui/daily-check/DailyCheckForm.tsx`, placeholder "e.g. headache, lower
 * back pain"); la lista recoge esos dos términos más los que nombran los
 * playbooks (náusea, fatiga, escalofríos, dolor de garganta, disnea, molestia
 * torácica, erupción).
 */
export const SYMPTOMS: readonly string[] = [
  'Headache',
  'Dizziness',
  'Nausea',
  'Fatigue',
  'Chills',
  'Sore throat',
  'Shortness of breath',
  'Chest discomfort',
  'Back pain',
  'Skin rash',
]

/**
 * Estado del wizard: los numéricos como texto (lo que teclea la persona) y el
 * ánimo como número ya elegido.
 */
export interface CheckInValues {
  heartRate: string
  systolic: string
  diastolic: string
  spo2: string
  temperature: string
  sleepHours: string
  mood: number | null
  symptoms: string[]
  radiationDose: string
}

/** Estado inicial sin lectura previa: todo vacío. */
export const EMPTY_VALUES: CheckInValues = {
  heartRate: '',
  systolic: '',
  diastolic: '',
  spo2: '',
  temperature: '',
  sleepHours: '',
  mood: null,
  symptoms: [],
  radiationDose: '',
}

const CANONICAL_SYMPTOM = new Map(SYMPTOMS.map((symptom) => [symptom.toLowerCase(), symptom]))

/**
 * Valores iniciales a partir de la última lectura (si la hay). Los síntomas se
 * mapean a los chips canónicos sin distinguir mayúsculas; los textos libres que
 * no están en la lista se descartan porque no tendrían chip para deseleccionar.
 */
export function initialValues(defaults?: Reading): CheckInValues {
  if (defaults === undefined) {
    return { ...EMPTY_VALUES, symptoms: [] }
  }

  const mood =
    Number.isInteger(defaults.mood) && defaults.mood >= 1 && defaults.mood <= 5 ? defaults.mood : null

  const symptoms: string[] = []
  for (const raw of defaults.symptoms) {
    const canonical = CANONICAL_SYMPTOM.get(raw.trim().toLowerCase())
    if (canonical !== undefined && !symptoms.includes(canonical)) symptoms.push(canonical)
  }

  return {
    heartRate: String(defaults.heartRate),
    systolic: String(defaults.systolic),
    diastolic: String(defaults.diastolic),
    spo2: String(defaults.spo2),
    temperature: String(defaults.temperature),
    sleepHours: String(defaults.sleepHours),
    mood,
    symptoms,
    radiationDose: String(defaults.radiationDose),
  }
}

/** Errores por control numérico, listos para pintar bajo cada campo. */
export type FieldErrors = Partial<Record<NumericField, string>>

function validateLimit(limit: NumericLimit, raw: string): string | undefined {
  const text = raw.trim()
  if (text === '') return `${limit.label} is required.`

  const value = Number(text)
  if (!Number.isFinite(value)) return `${limit.label} must be a number.`
  if (value < limit.min || (limit.max !== undefined && value > limit.max)) return rangeError(limit)
  if (limit.integer && !Number.isInteger(value)) return `${limit.label} must be a whole number.`

  return undefined
}

/** Error del ánimo cuando no hay una opción válida de 1 a 5. */
export const MOOD_REQUIRED = 'Pick a face to continue.'

/**
 * Valida los controles del paso. Objeto vacío = se puede continuar.
 * El paso de síntomas siempre es válido: no elegir nada equivale a "None".
 */
export function validateStep(step: StepDefinition, values: CheckInValues): FieldErrors {
  const errors: FieldErrors = {}

  if (step.kind === 'mood') {
    const mood = values.mood
    if (mood === null || !Number.isInteger(mood) || mood < 1 || mood > 5) {
      errors.mood = MOOD_REQUIRED
    }
  }

  for (const field of step.fields) {
    const error = validateLimit(NUMERIC_LIMITS[field], values[field])
    if (error !== undefined) errors[field] = error
  }

  return errors
}

/** True si no hay ningún error en el paso. */
export function isStepValid(step: StepDefinition, values: CheckInValues): boolean {
  return Object.keys(validateStep(step, values)).length === 0
}

function decimalsOf(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

function roundTo(value: number, step: number): number {
  return Number(value.toFixed(decimalsOf(step)))
}

/**
 * Valor tras pulsar − o +: avanza un `step` y queda dentro del rango.
 * Un campo vacío o con texto no numérico arranca en el mínimo.
 */
export function nudge(limit: NumericLimit, raw: string, direction: 1 | -1): string {
  const text = raw.trim()
  const parsed = text === '' ? Number.NaN : Number(text)

  if (!Number.isFinite(parsed)) return String(limit.min)

  let next = roundTo(parsed + limit.step * direction, limit.step)
  if (next < limit.min) next = limit.min
  if (limit.max !== undefined && next > limit.max) next = limit.max

  return String(next)
}

/**
 * Añade o quita un chip. "None" es exclusivo: al elegirlo se limpian los demás
 * y al elegir cualquier otro síntoma se quita "None". Pulsar el mismo chip dos
 * veces lo deselecciona.
 */
export function toggleSymptom(selected: readonly string[], symptom: string): string[] {
  if (selected.includes(symptom)) {
    return selected.filter((item) => item !== symptom)
  }

  if (symptom === SYMPTOM_NONE) {
    return [SYMPTOM_NONE]
  }

  return [...selected.filter((item) => item !== SYMPTOM_NONE), symptom]
}

/**
 * `Reading` final con la misma forma que creaba el formulario viejo: id
 * `manual-`, fecha ISO, números en todas las métricas y `source: 'manual'`.
 * Solo se llama cuando los 8 pasos son válidos; sin ánimo es un error de
 * programación, no de la persona.
 */
export function buildReading(values: CheckInValues, now: Date = new Date()): Reading {
  if (values.mood === null) {
    throw new Error('Cannot build a reading without a mood value')
  }

  return {
    id: `manual-${now.getTime()}`,
    date: now.toISOString(),
    heartRate: Number(values.heartRate),
    systolic: Number(values.systolic),
    diastolic: Number(values.diastolic),
    spo2: Number(values.spo2),
    temperature: Number(values.temperature),
    sleepHours: Number(values.sleepHours),
    mood: values.mood,
    symptoms: [...values.symptoms],
    radiationDose: Number(values.radiationDose),
    source: 'manual',
  }
}
