import type { SignedReport } from '../domain/types'
import { verifyReport, type ReportVerification } from './verify'

export type VerifyOutcome =
  | { kind: 'result'; verification: ReportVerification }
  | { kind: 'error'; message: string }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Valida la FORMA mínima de un reporte pegado por un humano antes de verificarlo.
 * No decide si es auténtico (eso lo hace verifyReport); solo evita que un JSON
 * cualquiera haga fallar la verificación con errores confusos.
 */
export function parseReport(json: string): SignedReport {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('That text is not valid JSON.')
  }
  if (!isObj(data)) throw new Error('The report must be a JSON object.')
  const { version, generatedAt, entries, headHash, signature, publicKey } = data
  if (version !== 1) throw new Error('Unsupported report version (expected 1).')
  if (typeof generatedAt !== 'string') throw new Error('Missing "generatedAt".')
  if (!Array.isArray(entries)) throw new Error('Missing "entries" list.')
  for (const e of entries) {
    if (!isObj(e) || typeof e.hash !== 'string' || typeof e.prevHash !== 'string' || !isObj(e.reading)) {
      throw new Error('One of the entries is malformed.')
    }
  }
  if (typeof headHash !== 'string') throw new Error('Missing "headHash".')
  if (typeof signature !== 'string') throw new Error('Missing "signature".')
  if (typeof publicKey !== 'string') throw new Error('Missing "publicKey".')
  return data as unknown as SignedReport
}

/** Punto de entrada del Ground Control Verifier. */
export async function verifyReportJson(json: string): Promise<VerifyOutcome> {
  try {
    return { kind: 'result', verification: await verifyReport(parseReport(json)) }
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Could not read the report.' }
  }
}
