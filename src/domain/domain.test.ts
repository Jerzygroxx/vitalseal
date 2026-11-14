import { describe, expect, it } from 'vitest'
import { generateSynthetic } from '../data/synthetic'
import { computeBaseline } from './baseline'
import { escalate } from './escalation'
import { evaluate } from './rules'
import { THRESHOLDS } from './thresholds'

const data = generateSynthetic()
const baseline = computeBaseline(data)
const normal = data[10]!
const lastDay = data[data.length - 1]!

describe('synthetic data', () => {
  it('es determinista por semilla', () => {
    expect(generateSynthetic({ seed: 7 })).toEqual(generateSynthetic({ seed: 7 }))
    expect(generateSynthetic({ seed: 7 })).not.toEqual(generateSynthetic({ seed: 8 }))
  })
  it('respeta el número de días', () => {
    expect(generateSynthetic({ days: 14 })).toHaveLength(14)
  })
})

describe('baseline', () => {
  it('usa 14 lecturas por defecto y estima la media cerca de lo esperado', () => {
    expect(baseline.computedFrom).toBe(14)
    expect(baseline.mean.heartRate).toBeGreaterThan(60)
    expect(baseline.mean.heartRate).toBeLessThan(68)
  })
  it('excluye lecturas con integridad dudosa', () => {
    const tainted = data.map((r, i) => (i < 5 ? { ...r, integrity: 'doubtful' as const } : r))
    expect(computeBaseline(tainted).computedFrom).toBe(14)
    expect(computeBaseline(tainted.slice(0, 5)).computedFrom).toBe(0)
  })
})

describe('rules.evaluate', () => {
  it('lectura normal => green', () => {
    expect(evaluate(normal, baseline).overall).toBe('green')
  })
  it('deterioro inyectado en el último día => no green', () => {
    expect(evaluate(lastDay, baseline).overall).not.toBe('green')
  })
  it('límite de seguridad absoluto => red (SpO2 88)', () => {
    const r = evaluate({ ...normal, spo2: 88 }, baseline)
    expect(r.overall).toBe('red')
    expect(r.systems.find((s) => s.id === 'cardio')?.status).toBe('red')
  })
  it('dosis acumulada sobre el umbral rojo => radiation red', () => {
    const r = evaluate({ ...normal, radiationDose: 650 }, baseline)
    expect(r.systems.find((s) => s.id === 'radiation')?.status).toBe('red')
  })
  it('síntomas musculoesqueléticos => amber', () => {
    const r = evaluate({ ...normal, symptoms: ['back pain'] }, baseline)
    expect(r.systems.find((s) => s.id === 'musculoskeletal')?.status).toBe('amber')
  })
  it('integridad dudosa pide re-medición', () => {
    const r = evaluate({ ...normal, spo2: 88, integrity: 'doubtful' }, baseline)
    expect(r.systems.find((s) => s.id === 'cardio')?.action).toMatch(/re-measure/i)
  })
  it('devuelve los 5 sistemas con score 0-100', () => {
    const r = evaluate(lastDay, baseline)
    expect(r.systems).toHaveLength(5)
    for (const s of r.systems) {
      expect(s.score).toBeGreaterThanOrEqual(0)
      expect(s.score).toBeLessThanOrEqual(100)
    }
  })
})

describe('escalation', () => {
  it('el protocolo depende de la distancia', () => {
    expect(escalate('leo', 'red').level).toBe('immediate')
    expect(escalate('moon', 'red').level).toBe('async')
    expect(escalate('mars', 'red').level).toBe('autonomous')
    expect(escalate('mars', 'red').latencySeconds).toBe(1320)
  })
})

describe('thresholds', () => {
  it('toda fila tiene fuente y rangos coherentes', () => {
    for (const t of THRESHOLDS) {
      expect(t.source.length).toBeGreaterThan(5)
      expect(t.redLow).toBeLessThanOrEqual(t.amberLow)
      expect(t.redHigh).toBeGreaterThanOrEqual(t.amberHigh)
    }
  })
})
