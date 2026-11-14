import { create } from 'zustand'
import { appendEntry, buildChain } from '../crypto/chain'
import { sealCode } from '../crypto/seal-code'
import { generateSigningKeys, signReport, type SigningKeys } from '../crypto/sign'
import { verifyReport, type ReportVerification } from '../crypto/verify'
import type { ChainEntry, Reading, SignedReport } from '../domain/types'

export type TamperKind = 'alter' | 'reorder' | 'delete'

interface IntegrityState {
  ready: boolean
  /** Lo que hay "guardado" (vault). Es lo que un atacante podría modificar. */
  stored: ChainEntry[]
  /** Último reporte firmado: fija headHash y nº de entradas. */
  report: SignedReport | null
  keys: SigningKeys | null
  verification: ReportVerification | null
  code: string | null
  tampered: TamperKind | null

  /** Construye la cadena desde las lecturas, genera claves, firma y verifica. */
  init: (readings: readonly Reading[]) => Promise<void>
  /** Añade una lectura a la cadena y vuelve a sellar el día. */
  addReading: (r: Reading) => Promise<void>
  /** Recalcula la verificación del reporte contra lo guardado. */
  verify: () => Promise<void>
  /** Demo: modifica lo guardado como lo haría un atacante. */
  simulateTamper: (kind: TamperKind) => Promise<void>
  /** Demo: restaura el historial íntegro (el sello original sigue siendo válido). */
  restore: () => Promise<void>
}

/** Copia íntegra, solo para poder restaurar en el modo demo. */
let pristine: ChainEntry[] = []

async function seal(stored: ChainEntry[], keys: SigningKeys) {
  const report = await signReport(stored, keys)
  const verification = await verifyReport(report)
  return { report, verification, code: await sealCode(report) }
}

export const useIntegrityStore = create<IntegrityState>((set, get) => ({
  ready: false, stored: [], report: null, keys: null, verification: null, code: null, tampered: null,

  init: async (readings) => {
    const stored = await buildChain(readings)
    const keys = get().keys ?? (await generateSigningKeys())
    pristine = structuredClone(stored)
    set({ ready: true, stored, keys, tampered: null, ...(await seal(stored, keys)) })
  },

  addReading: async (r) => {
    const { stored, keys } = get()
    if (!keys) return
    const next = await appendEntry(stored, r)
    pristine = structuredClone(next)
    set({ stored: next, tampered: null, ...(await seal(next, keys)) })
  },

  verify: async () => {
    const { report, stored } = get()
    if (!report) return
    set({ verification: await verifyReport({ ...report, entries: stored }) })
  },

  simulateTamper: async (kind) => {
    const t = structuredClone(get().stored)
    if (t.length < 4) return
    const mid = Math.floor(t.length / 2)
    if (kind === 'alter') t[mid]!.reading.spo2 = Math.max(0, t[mid]!.reading.spo2 - 8)
    else if (kind === 'reorder') [t[mid], t[mid + 1]] = [t[mid + 1]!, t[mid]!]
    else t.splice(mid, 1)
    set({ stored: t, tampered: kind })
    await get().verify()
  },

  restore: async () => {
    set({ stored: structuredClone(pristine), tampered: null })
    await get().verify()
  },
}))
