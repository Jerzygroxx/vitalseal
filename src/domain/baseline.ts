import type { Baseline, MetricKey, Reading } from './types'

export const METRICS: MetricKey[] = [
  'heartRate', 'systolic', 'diastolic', 'spo2',
  'temperature', 'sleepHours', 'mood', 'radiationDose',
]

/** Evita z-scores enormes cuando la variabilidad observada es casi nula. */
export const MIN_STD: Record<MetricKey, number> = {
  heartRate: 2, systolic: 3, diastolic: 2, spo2: 0.5,
  temperature: 0.1, sleepHours: 0.4, mood: 0.3, radiationDose: 0.01,
}

/**
 * Baseline personal: media y desvío de las primeras `windowSize` lecturas
 * (por defecto 14 días). Se excluyen lecturas con integridad dudosa.
 */
export function computeBaseline(readings: Reading[], windowSize = 14): Baseline {
  const sample = readings.filter((r) => r.integrity !== 'doubtful').slice(0, windowSize)
  const mean = {} as Record<MetricKey, number>
  const stdDev = {} as Record<MetricKey, number>
  for (const m of METRICS) {
    const xs = sample.map((r) => r[m])
    const mu = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    const variance = xs.length > 1 ? xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1) : 0
    mean[m] = mu
    stdDev[m] = Math.max(Math.sqrt(variance), MIN_STD[m])
  }
  return { computedFrom: sample.length, mean, stdDev }
}

export function zScore(value: number, metric: MetricKey, b: Baseline): number {
  return (value - b.mean[metric]) / b.stdDev[metric]
}
