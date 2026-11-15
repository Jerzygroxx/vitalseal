import type { ChainEntry, SignedReport } from '../domain/types'
import { GENESIS_HASH } from './chain'
import { canonical, toBase64, utf8 } from './encoding'

const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' } as const
const SIGN_PARAMS = { name: 'ECDSA', hash: 'SHA-256' } as const

export interface SigningKeys {
  /**
   * Clave privada NO extraíble: el navegador permite firmar con ella pero JavaScript
   * no puede leerla ni exportarla (ni siquiera un XSS podría robarla, solo usarla
   * mientras la página siga abierta). Por eso nunca se guarda en localStorage.
   */
  privateKey: CryptoKey
  /** JWK serializado de la clave pública (se incluye en el reporte para verificar). */
  publicKey: string
}

export async function generateSigningKeys(): Promise<SigningKeys> {
  const pair = await crypto.subtle.generateKey(ECDSA, false, ['sign', 'verify'])
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  return { privateKey: pair.privateKey, publicKey: canonical(jwk) }
}

/** Mensaje firmado: fija versión, fecha, cabeza de la cadena y nº de entradas. */
export function signedPayload(r: Pick<SignedReport, 'version' | 'generatedAt' | 'headHash'> & { count: number }) {
  return canonical({ version: r.version, generatedAt: r.generatedAt, headHash: r.headHash, count: r.count })
}

export async function signReport(
  entries: readonly ChainEntry[],
  keys: SigningKeys,
  generatedAt: string = new Date().toISOString(),
): Promise<SignedReport> {
  const last = entries[entries.length - 1]
  const headHash = last ? last.hash : GENESIS_HASH
  const payload = signedPayload({ version: 1, generatedAt, headHash, count: entries.length })
  const sig = await crypto.subtle.sign(SIGN_PARAMS, keys.privateKey, utf8(payload))
  return {
    version: 1,
    generatedAt,
    entries: [...entries],
    headHash,
    signature: toBase64(sig),
    publicKey: keys.publicKey,
  }
}
