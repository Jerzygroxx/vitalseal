import { create } from 'zustand'
import { generateSynthetic } from '../data/synthetic'
import { computeBaseline } from '../domain/baseline'
import { evaluate } from '../domain/rules'
import type { Baseline, Distance, Reading, TriageResult } from '../domain/types'

interface AppState {
  readings: Reading[]
  distance: Distance
  baseline: Baseline
  triage: TriageResult | null
  addReading: (r: Reading) => void
  setDistance: (d: Distance) => void
  /** Reinicia a los datos sintéticos sembrados (modo demo). */
  resetDemo: () => void
}

/** El baseline se fija con las primeras 14 lecturas; no cambia al añadir nuevas. */
const initial = generateSynthetic()
const initialBaseline = computeBaseline(initial)

const triageOf = (readings: Reading[], b: Baseline, d: Distance) => {
  const last = readings[readings.length - 1]
  return last ? evaluate(last, b, d) : null
}

export const useAppStore = create<AppState>((set, get) => ({
  readings: initial,
  distance: 'mars',
  baseline: initialBaseline,
  triage: triageOf(initial, initialBaseline, 'mars'),
  addReading: (r) => {
    const readings = [...get().readings, r]
    set({ readings, triage: triageOf(readings, get().baseline, get().distance) })
  },
  setDistance: (distance) =>
    set({ distance, triage: triageOf(get().readings, get().baseline, distance) }),
  resetDemo: () => {
    const readings = generateSynthetic()
    const baseline = computeBaseline(readings)
    set({ readings, baseline, triage: triageOf(readings, baseline, get().distance) })
  },
}))
