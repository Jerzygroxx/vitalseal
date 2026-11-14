import { describe, expect, it } from 'vitest'
import type { Reading } from './types'

describe('types contract', () => {
  it('permite construir una lectura mínima', () => {
    const r: Reading = {
      id: 'r1', date: '2026-11-14T00:00:00Z', heartRate: 62, systolic: 118,
      diastolic: 76, spo2: 98, temperature: 36.6, sleepHours: 7, mood: 4,
      symptoms: [], radiationDose: 0.5, source: 'manual',
    }
    expect(r.spo2).toBe(98)
  })
})
