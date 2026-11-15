import { describe, expect, it } from 'vitest'
import type { Reading } from '../../domain/types'
import {
  EMPTY_VALUES,
  MOOD_OPTIONS,
  MOOD_REQUIRED,
  STEPS,
  STEP_COUNT,
  SYMPTOMS,
  SYMPTOM_NONE,
  buildReading,
  initialValues,
  isStepValid,
  nudge,
  toggleSymptom,
  validateStep,
  type CheckInValues,
  type StepDefinition,
  type StepId,
} from './steps'
import { NUMERIC_LIMITS } from './ranges'

const stepById = (id: StepId): StepDefinition => {
  const step = STEPS.find((item) => item.id === id)
  if (step === undefined) throw new Error(`Missing step: ${id}`)
  return step
}

/** Lectura completa y válida, base de casi todos los casos. */
const validValues: CheckInValues = {
  heartRate: '64',
  systolic: '118',
  diastolic: '76',
  spo2: '98',
  temperature: '36.6',
  sleepHours: '7.5',
  mood: 4,
  symptoms: ['Headache'],
  radiationDose: '12.4',
}

const withField = <K extends keyof CheckInValues>(field: K, value: CheckInValues[K]): CheckInValues => ({
  ...validValues,
  [field]: value,
})

const errorFields = (stepId: StepId, values: CheckInValues): string[] =>
  Object.keys(validateStep(stepById(stepId), values))

describe('STEPS', () => {
  it('tiene exactamente 8 pasos en el orden pedido', () => {
    expect(STEP_COUNT).toBe(8)
    expect(STEPS.map((step) => step.id)).toEqual([
      'heartRate',
      'bloodPressure',
      'spo2',
      'temperature',
      'sleepHours',
      'mood',
      'symptoms',
      'radiationDose',
    ])
  })

  it('cada paso trae pregunta y una línea de ayuda no vacías', () => {
    for (const step of STEPS) {
      expect(step.question.endsWith('?')).toBe(true)
      expect(step.help.length).toBeGreaterThan(0)
    }
  })

  it('la presión arterial pide sistólica y diastólica en la misma pantalla', () => {
    expect(stepById('bloodPressure').fields).toEqual(['systolic', 'diastolic'])
  })

  it('los pasos de ánimo y síntomas no son numéricos', () => {
    expect(stepById('mood').kind).toBe('mood')
    expect(stepById('symptoms').kind).toBe('symptoms')
    expect(stepById('symptoms').fields).toEqual([])
  })
})

describe('validateStep', () => {
  it('acepta una lectura completa en todos los pasos', () => {
    for (const step of STEPS) {
      expect(validateStep(step, validValues)).toEqual({})
      expect(isStepValid(step, validValues)).toBe(true)
    }
  })

  it('acepta los límites exactos de cada control (inclusivos)', () => {
    expect(validateStep(stepById('heartRate'), withField('heartRate', '20'))).toEqual({})
    expect(validateStep(stepById('heartRate'), withField('heartRate', '250'))).toEqual({})
    expect(validateStep(stepById('spo2'), withField('spo2', '50'))).toEqual({})
    expect(validateStep(stepById('spo2'), withField('spo2', '100'))).toEqual({})
    expect(validateStep(stepById('temperature'), withField('temperature', '30'))).toEqual({})
    expect(validateStep(stepById('temperature'), withField('temperature', '45'))).toEqual({})
    expect(validateStep(stepById('sleepHours'), withField('sleepHours', '0'))).toEqual({})
    expect(validateStep(stepById('sleepHours'), withField('sleepHours', '24'))).toEqual({})
    expect(validateStep(stepById('bloodPressure'), withField('systolic', '60'))).toEqual({})
    expect(validateStep(stepById('bloodPressure'), withField('systolic', '250'))).toEqual({})
    expect(validateStep(stepById('bloodPressure'), withField('diastolic', '30'))).toEqual({})
    expect(validateStep(stepById('bloodPressure'), withField('diastolic', '150'))).toEqual({})
  })

  it('rechaza valores fuera de rango justo por abajo y por arriba', () => {
    expect(errorFields('heartRate', withField('heartRate', '19'))).toContain('heartRate')
    expect(errorFields('heartRate', withField('heartRate', '251'))).toContain('heartRate')
    expect(errorFields('spo2', withField('spo2', '49.9'))).toContain('spo2')
    expect(errorFields('spo2', withField('spo2', '100.1'))).toContain('spo2')
    expect(errorFields('temperature', withField('temperature', '29.9'))).toContain('temperature')
    expect(errorFields('temperature', withField('temperature', '45.1'))).toContain('temperature')
    expect(errorFields('sleepHours', withField('sleepHours', '-0.5'))).toContain('sleepHours')
    expect(errorFields('sleepHours', withField('sleepHours', '24.5'))).toContain('sleepHours')
  })

  it('la dosis acumulada no tiene tope superior pero no admite negativos', () => {
    expect(validateStep(stepById('radiationDose'), withField('radiationDose', '0'))).toEqual({})
    expect(validateStep(stepById('radiationDose'), withField('radiationDose', '900'))).toEqual({})
    expect(errorFields('radiationDose', withField('radiationDose', '-0.1'))).toContain('radiationDose')
  })

  it('exige los dos valores de la presión arterial', () => {
    const onlySystolic: CheckInValues = { ...validValues, systolic: '118', diastolic: '' }
    expect(errorFields('bloodPressure', onlySystolic)).toEqual(['diastolic'])

    const onlyDiastolic: CheckInValues = { ...validValues, systolic: '', diastolic: '76' }
    expect(errorFields('bloodPressure', onlyDiastolic)).toEqual(['systolic'])
  })

  it('marca vacío, texto no numérico y coma decimal como error', () => {
    expect(errorFields('heartRate', withField('heartRate', ''))).toContain('heartRate')
    expect(errorFields('heartRate', withField('heartRate', '   '))).toContain('heartRate')
    expect(errorFields('heartRate', withField('heartRate', 'abc'))).toContain('heartRate')
    expect(errorFields('temperature', withField('temperature', '36,6'))).toContain('temperature')
  })

  it('el mensaje de rango nombra el campo y el rango', () => {
    const errors = validateStep(stepById('heartRate'), withField('heartRate', '300'))
    expect(errors.heartRate).toBe('Heart rate must be between 20 and 250 bpm.')
  })

  it('ánimo: solo enteros de 1 a 5', () => {
    expect(validateStep(stepById('mood'), { ...validValues, mood: 1 })).toEqual({})
    expect(validateStep(stepById('mood'), { ...validValues, mood: 5 })).toEqual({})
    expect(validateStep(stepById('mood'), { ...validValues, mood: null })).toEqual({ mood: MOOD_REQUIRED })
    expect(validateStep(stepById('mood'), { ...validValues, mood: 0 })).toEqual({ mood: MOOD_REQUIRED })
    expect(validateStep(stepById('mood'), { ...validValues, mood: 6 })).toEqual({ mood: MOOD_REQUIRED })
    expect(validateStep(stepById('mood'), { ...validValues, mood: 2.5 })).toEqual({ mood: MOOD_REQUIRED })
  })

  it('los cinco botones de ánimo van de Very low a Great', () => {
    expect(MOOD_OPTIONS.map((option) => option.value)).toEqual([1, 2, 3, 4, 5])
    expect(MOOD_OPTIONS[0]?.label).toBe('Very low')
    expect(MOOD_OPTIONS[4]?.label).toBe('Great')
  })

  it('el paso de síntomas nunca bloquea el avance', () => {
    const symptoms = stepById('symptoms')
    expect(validateStep(symptoms, { ...validValues, symptoms: [] })).toEqual({})
    expect(validateStep(symptoms, { ...validValues, symptoms: [SYMPTOM_NONE] })).toEqual({})
  })
})

describe('toggleSymptom', () => {
  it('añade el síntoma al final y no duplica', () => {
    expect(toggleSymptom([], 'Headache')).toEqual(['Headache'])
    expect(toggleSymptom(['Headache'], 'Nausea')).toEqual(['Headache', 'Nausea'])
    expect(toggleSymptom(['Headache'], 'Headache')).toEqual([])
  })

  it('None limpia el resto y no se mezcla con otros síntomas', () => {
    expect(toggleSymptom(['Headache', 'Nausea'], SYMPTOM_NONE)).toEqual([SYMPTOM_NONE])
    expect(toggleSymptom([SYMPTOM_NONE], 'Fatigue')).toEqual(['Fatigue'])
    expect(toggleSymptom([SYMPTOM_NONE], SYMPTOM_NONE)).toEqual([])
  })

  it('solo trabaja con los chips de la lista', () => {
    for (const symptom of SYMPTOMS) {
      expect(toggleSymptom([], symptom)).toEqual([symptom])
    }
    expect(SYMPTOMS).not.toContain(SYMPTOM_NONE)
  })
})

describe('nudge', () => {
  it('arranca en el mínimo desde vacío o desde texto inválido', () => {
    expect(nudge(NUMERIC_LIMITS.heartRate, '', 1)).toBe('20')
    expect(nudge(NUMERIC_LIMITS.heartRate, '', -1)).toBe('20')
    expect(nudge(NUMERIC_LIMITS.heartRate, 'abc', 1)).toBe('20')
  })

  it('suma y resta un paso', () => {
    expect(nudge(NUMERIC_LIMITS.heartRate, '64', 1)).toBe('65')
    expect(nudge(NUMERIC_LIMITS.heartRate, '64', -1)).toBe('63')
    expect(nudge(NUMERIC_LIMITS.sleepHours, '7.5', 1)).toBe('8')
    expect(nudge(NUMERIC_LIMITS.temperature, '36.6', 1)).toBe('36.7')
    expect(nudge(NUMERIC_LIMITS.radiationDose, '12.34', 1)).toBe('12.35')
  })

  it('no se pasa de los límites', () => {
    expect(nudge(NUMERIC_LIMITS.heartRate, '250', 1)).toBe('250')
    expect(nudge(NUMERIC_LIMITS.heartRate, '20', -1)).toBe('20')
    expect(nudge(NUMERIC_LIMITS.spo2, '100', 1)).toBe('100')
    expect(nudge(NUMERIC_LIMITS.radiationDose, '0', -1)).toBe('0')
    expect(nudge(NUMERIC_LIMITS.radiationDose, '900', 1)).toBe('900.01')
  })
})

describe('initialValues', () => {
  it('sin lectura previa deja todo vacío', () => {
    const values = initialValues()
    expect(values).toEqual(EMPTY_VALUES)
    expect(values.symptoms).toEqual([])
    expect(values.mood).toBeNull()
  })

  it('usa los defaults cuando se dan', () => {
    const at = new Date('2026-11-15T08:00:00.000Z')
    const defaults = buildReading(validValues, at)
    const values = initialValues(defaults)

    expect(values.heartRate).toBe('64')
    expect(values.systolic).toBe('118')
    expect(values.diastolic).toBe('76')
    expect(values.spo2).toBe('98')
    expect(values.temperature).toBe('36.6')
    expect(values.sleepHours).toBe('7.5')
    expect(values.radiationDose).toBe('12.4')
    expect(values.mood).toBe(4)
    expect(values.symptoms).toEqual(['Headache'])
  })

  it('mapea síntomas sin distinguir mayúsculas y descarta los que no tienen chip', () => {
    const defaults: Reading = {
      ...buildReading(validValues),
      symptoms: ['headache', 'DIZZINESS', 'unlisted symptom', 'Headache'],
    }
    expect(initialValues(defaults).symptoms).toEqual(['Headache', 'Dizziness'])
  })

  it('ignora un ánimo fuera de 1-5', () => {
    const defaults: Reading = { ...buildReading(validValues), mood: 7 }
    expect(initialValues(defaults).mood).toBeNull()
  })
})

describe('buildReading', () => {
  it('construye una lectura completa con source manual', () => {
    const at = new Date('2026-11-15T10:30:00.000Z')
    const reading = buildReading(validValues, at)

    expect(reading).toEqual({
      id: `manual-${at.getTime()}`,
      date: '2026-11-15T10:30:00.000Z',
      heartRate: 64,
      systolic: 118,
      diastolic: 76,
      spo2: 98,
      temperature: 36.6,
      sleepHours: 7.5,
      mood: 4,
      symptoms: ['Headache'],
      radiationDose: 12.4,
      source: 'manual',
    })
  })

  it('copia los síntomas (no comparte la lista del estado)', () => {
    const reading = buildReading(validValues)
    reading.symptoms.push('Nausea')
    expect(validValues.symptoms).toEqual(['Headache'])
  })

  it('falla si falta el ánimo: es un error de programación', () => {
    expect(() => buildReading({ ...validValues, mood: null })).toThrow(/mood/)
  })
})
