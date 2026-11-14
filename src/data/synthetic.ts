import type { Reading } from '../domain/types'

/** PRNG determinista (mulberry32): mismos datos en cada recarga y en los tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d

export interface SyntheticOptions {
  seed?: number
  days?: number
  startDate?: string // ISO
  /** Si true, inyecta anomalías en los últimos días (demo). */
  anomalies?: boolean
}

/**
 * DATOS SINTÉTICOS (no son datos de ningún astronauta ni crudos de NASA).
 * Valores plausibles alrededor de una línea base típica con ruido gaussiano
 * aproximado; la dosis acumulada crece ~0.5 mSv/día.
 */
export function generateSynthetic(opts: SyntheticOptions = {}): Reading[] {
  const { seed = 2026, days = 21, startDate = '2026-11-01T08:00:00Z', anomalies = true } = opts
  const rnd = mulberry32(seed)
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.7 // ~N(0,1)
  const start = new Date(startDate).getTime()
  const out: Reading[] = []
  let dose = 20

  for (let i = 0; i < days; i++) {
    dose += 0.5 + rnd() * 0.1
    const r: Reading = {
      id: `syn-${seed}-${i}`,
      date: new Date(start + i * 86_400_000).toISOString(),
      heartRate: round(64 + gauss() * 3, 0),
      systolic: round(118 + gauss() * 4, 0),
      diastolic: round(76 + gauss() * 3, 0),
      spo2: round(Math.min(100, 98 + gauss() * 0.6), 0),
      temperature: round(36.6 + gauss() * 0.15, 1),
      sleepHours: round(Math.max(0, 7.2 + gauss() * 0.5), 1),
      mood: Math.min(5, Math.max(1, round(4 + gauss() * 0.4, 0))),
      symptoms: [],
      radiationDose: round(dose, 2),
      source: 'manual',
    }
    if (anomalies && i >= days - 4) {
      // Deterioro gradual: sueño bajo, FC y presión al alza, ánimo bajo.
      const k = i - (days - 4) + 1
      r.sleepHours = round(r.sleepHours - 0.9 * k, 1)
      r.heartRate += 6 * k
      r.systolic += 5 * k
      r.mood = Math.max(1, r.mood - 1)
      if (k >= 3) r.symptoms = ['headache', 'back pain']
    }
    out.push(r)
  }
  return out
}
