import type { SignedReport } from '../domain/types'
import { GENESIS_HASH, verifyChain, type ChainVerification } from './chain'
import { fromBase64, utf8 } from './encoding'
import { signedPayload } from './sign'

export interface ReportVerification {
  /** true solo si cadena, cabeza y firma son válidas. */
  valid: boolean
  chain: ChainVerification
  /** headHash declarado = hash de la última entrada (o génesis si no hay entradas). */
  headMatches: boolean
  signatureValid: boolean
  /** Motivo legible si algo falla (para el panel de integridad). */
  problems: string[]
}

const REASONS = {
  'index-mismatch': 'entries were reordered or one was deleted',
  'broken-link': 'a link in the chain does not match its predecessor',
  'hash-mismatch': 'the content of an entry was altered',
} as const

/**
 * Verifica un reporte firmado de forma independiente (la usa también el
 * "Ground Control Verifier"). Nunca lanza: entrada corrupta => valid=false.
 */
export async function verifyReport(report: SignedReport): Promise<ReportVerification> {
  const problems: string[] = []
  let chain: ChainVerification = { valid: false }
  let headMatches = false
  let signatureValid = false

  try {
    chain = await verifyChain(report.entries)
    if (!chain.valid && chain.reason) {
      problems.push(`Chain broken at entry ${chain.brokenAt}: ${REASONS[chain.reason]}.`)
    }

    const last = report.entries[report.entries.length - 1]
    headMatches = report.headHash === (last ? last.hash : GENESIS_HASH)
    if (!headMatches) {
      problems.push('Head hash does not match the last entry (entries may have been removed or replaced).')
    }

    const jwk = JSON.parse(report.publicKey) as JsonWebKey
    const publicKey = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
    )
    // La firma cubre headHash y count declarados; si borraron entradas del final,
    // `count` ya no coincide con el firmado y la verificación falla.
    const payload = signedPayload({
      version: report.version, generatedAt: report.generatedAt,
      headHash: report.headHash, count: report.entries.length,
    })
    signatureValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, publicKey, fromBase64(report.signature), utf8(payload),
    )
    if (!signatureValid) problems.push('Signature is invalid for this report.')
  } catch {
    problems.push('Report is malformed and could not be verified.')
  }

  return { valid: chain.valid && headMatches && signatureValid, chain, headMatches, signatureValid, problems }
}
