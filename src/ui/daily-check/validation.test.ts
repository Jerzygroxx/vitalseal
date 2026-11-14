import { describe, expect, it } from 'vitest'
import {
  NUMERIC_RULES,
  hasErrors,
  parseSymptoms,
  validateReading,
  type NumericField,
  type ReadingValues,
} from './validation'

const validValues: ReadingValues = {
  heartRate: '64',
  systolic: '118',
  diastolic: '76',
  spo2: '98',
  temperature: '36.6',
  sleepHours: '7.5',
  mood: '4',
  radiationDose: '12.4',
  symptoms: '',
}

const withField = (field: NumericField, value: string): ReadingValues => ({
  ...validValues,
  [field]: value,
})

describe('validateReading', () => {
  it('acepta una lectura completa dentro de rango', () => {
    const errors = validateReading(validValues)
    expect(errors).toEqual({})
    expect(hasErrors(errors)).toBe(false)
  })

  it('valida los rangos en los límites exactos (inclusivos)', () => {
    for (const rule of NUMERIC_RULES) {
      expect(validateReading(withField(rule.field, String(rule.min)))).not.toHaveProperty(rule.field)

      if (rule.max !== undefined) {
        expect(validateReading(withField(rule.field, String(rule.max)))).not.toHaveProperty(rule.field)
      }
    }
  })

  it('rechaza valores justo fuera de rango por abajo y por arriba', () => {
    for (const rule of NUMERIC_RULES) {
      const below = rule.min - rule.step
      expect(validateReading(withField(rule.field, String(below)))).toHaveProperty(rule.field)

      if (rule.max !== undefined) {
        const above = rule.max + rule.step
        expect(validateReading(withField(rule.field, String(above)))).toHaveProperty(rule.field)
      }
    }
  })

  it('limites duros: HR 20-250, sistolica 60-250, diastolica 30-150', () => {
    expect(validateReading(withField('heartRate', '19'))).toHaveProperty('heartRate')
    expect(validateReading(withField('heartRate', '251'))).toHaveProperty('heartRate')
    expect(validateReading(withField('systolic', '59'))).toHaveProperty('systolic')
    expect(validateReading(withField('systolic', '251'))).toHaveProperty('systolic')
    expect(validateReading(withField('diastolic', '29'))).toHaveProperty('diastolic')
    expect(validateReading(withField('diastolic', '151'))).toHaveProperty('diastolic')
  })

  it('SpO2 50-100 y temperatura 30-45 admiten decimales dentro del rango', () => {
    expect(validateReading(withField('spo2', '50'))).not.toHaveProperty('spo2')
    expect(validateReading(withField('spo2', '100'))).not.toHaveProperty('spo2')
    expect(validateReading(withField('spo2', '100.1'))).toHaveProperty('spo2')
    expect(validateReading(withField('spo2', '49.9'))).toHaveProperty('spo2')
    expect(validateReading(withField('temperature', '36.65'))).not.toHaveProperty('temperature')
    expect(validateReading(withField('temperature', '29.9'))).toHaveProperty('temperature')
    expect(validateReading(withField('temperature', '45.1'))).toHaveProperty('temperature')
  })

  it('sueno 0-24 y dosis acumulada sin tope superior', () => {
    expect(validateReading(withField('sleepHours', '0'))).not.toHaveProperty('sleepHours')
    expect(validateReading(withField('sleepHours', '24'))).not.toHaveProperty('sleepHours')
    expect(validateReading(withField('sleepHours', '24.5'))).toHaveProperty('sleepHours')
    expect(validateReading(withField('sleepHours', '-0.5'))).toHaveProperty('sleepHours')
    expect(validateReading(withField('radiationDose', '0'))).not.toHaveProperty('radiationDose')
    expect(validateReading(withField('radiationDose', '0.01'))).not.toHaveProperty('radiationDose')
    expect(validateReading(withField('radiationDose', '900'))).not.toHaveProperty('radiationDose')
    expect(validateReading(withField('radiationDose', '-0.1'))).toHaveProperty('radiationDose')
  })

  it('mood exige entero entre 1 y 5', () => {
    expect(validateReading(withField('mood', '1'))).not.toHaveProperty('mood')
    expect(validateReading(withField('mood', '5'))).not.toHaveProperty('mood')
    expect(validateReading(withField('mood', '0'))).toHaveProperty('mood')
    expect(validateReading(withField('mood', '6'))).toHaveProperty('mood')
    expect(validateReading(withField('mood', '2.5'))).toHaveProperty('mood')
    expect(validateReading(withField('mood', '3.0'))).not.toHaveProperty('mood')
  })

  it('exige los 8 campos numéricos', () => {
    const allEmpty: ReadingValues = {
      ...validValues,
      heartRate: '',
      systolic: '',
      diastolic: '',
      spo2: '',
      temperature: '',
      sleepHours: '',
      mood: '',
      radiationDose: '',
    }
    const errors = validateReading(allEmpty)

    for (const rule of NUMERIC_RULES) {
      expect(errors[rule.field]).toMatch(/required/)
    }
    expect(hasErrors(errors)).toBe(true)
  })

  it('rechaza texto no numérico y espacios en blanco', () => {
    expect(validateReading(withField('heartRate', 'abc'))).toHaveProperty('heartRate')
    expect(validateReading(withField('spo2', ' '))).toHaveProperty('spo2')
    expect(validateReading(withField('temperature', '36,6'))).toHaveProperty('temperature')
  })

  it('no valida síntomas: es texto libre y opcional', () => {
    expect(validateReading({ ...validValues, symptoms: '' })).toEqual({})
    expect(validateReading({ ...validValues, symptoms: 'headache, back pain' })).toEqual({})
  })
})

describe('parseSymptoms', () => {
  it('separa por comas y recorta espacios', () => {
    expect(parseSymptoms('headache, back pain')).toEqual(['headache', 'back pain'])
    expect(parseSymptoms('  headache  ,   back   pain ')).toEqual(['headache', 'back pain'])
  })

  it('descarta entradas vacías y comas sobrantes', () => {
    expect(parseSymptoms('')).toEqual([])
    expect(parseSymptoms('   ')).toEqual([])
    expect(parseSymptoms(',,')).toEqual([])
    expect(parseSymptoms('headache,,back pain,')).toEqual(['headache', 'back pain'])
  })

  it('elimina duplicados sin distinguir mayúsculas y conserva el primer texto', () => {
    expect(parseSymptoms('Headache, headache')).toEqual(['Headache'])
    expect(parseSymptoms('nausea, Nausea, dizziness, DIZZINESS')).toEqual(['nausea', 'dizziness'])
  })

  it('tolera saltos de línea dentro de un síntoma', () => {
    expect(parseSymptoms('back\npain, dizziness')).toEqual(['back pain', 'dizziness'])
  })
})
