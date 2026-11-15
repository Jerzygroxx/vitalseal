import type { ChainEntry, Reading } from '../domain/types'
import { canonical, sha256Hex } from './encoding'

/** Hash de la "entrada anterior" de la primera entrada (génesis). */
export const GENESIS_HASH = '0'.repeat(64)

/** hash = SHA-256(prevHash | canonical(reading) | timestamp). */
export function entryHash(prevHash: string, reading: Reading, timestamp: string): Promise<string> {
  return sha256Hex(`${prevHash}|${canonical(reading)}|${timestamp}`)
}

export async function appendEntry(
  chain: readonly ChainEntry[],
  reading: Reading,
  timestamp: string = new Date().toISOString(),
): Promise<ChainEntry[]> {
  const prev = chain[chain.length - 1]
  const prevHash = prev ? prev.hash : GENESIS_HASH
  const hash = await entryHash(prevHash, reading, timestamp)
  return [...chain, { index: chain.length, timestamp, reading, prevHash, hash }]
}

export async function buildChain(readings: readonly Reading[], timestamps?: readonly string[]) {
  let chain: ChainEntry[] = []
  for (const [i, r] of readings.entries()) {
    chain = await appendEntry(chain, r, timestamps?.[i] ?? r.date)
  }
  return chain
}

export type ChainFailure =
  | 'index-mismatch' // reordenada o entrada borrada: los índices dejan de ser 0..n-1
  | 'broken-link' // prevHash no coincide con el hash de la entrada previa
  | 'hash-mismatch' // el contenido de la entrada fue alterado

export interface ChainVerification {
  valid: boolean
  /** Índice (posición) de la primera entrada inconsistente. */
  brokenAt?: number
  reason?: ChainFailure
}

/**
 * Recalcula toda la cadena. Detecta: lectura alterada, entradas reordenadas y
 * entradas borradas en medio. NO detecta el borrado de las últimas entradas por
 * sí sola (una cadena más corta sigue siendo coherente): para eso sirve el sello
 * firmado, que fija `headHash` y el número de entradas (ver verify.ts).
 */
export async function verifyChain(chain: readonly ChainEntry[]): Promise<ChainVerification> {
  let expectedPrev = GENESIS_HASH
  for (const [i, e] of chain.entries()) {
    if (e.index !== i) return { valid: false, brokenAt: i, reason: 'index-mismatch' }
    if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: i, reason: 'broken-link' }
    const recomputed = await entryHash(e.prevHash, e.reading, e.timestamp)
    if (recomputed !== e.hash) return { valid: false, brokenAt: i, reason: 'hash-mismatch' }
    expectedPrev = e.hash
  }
  return { valid: true }
}
