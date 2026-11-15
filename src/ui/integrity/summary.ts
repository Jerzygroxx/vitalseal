import type { ReportVerification } from '../../crypto/verify'

/**
 * Resumen de presentación del resultado de `verifyReport` (T-03).
 * Función pura: no verifica nada, solo describe lo que el verificador ya dijo.
 * Los textos van en inglés como el resto de la UI.
 */

export type SummaryTone = 'unknown' | 'ok' | 'bad'

export interface SummaryCheck {
  /** Nombre de la comprobación. */
  label: string
  ok: boolean
}

export interface VerificationSummary {
  tone: SummaryTone
  title: string
  checks: SummaryCheck[]
}

/**
 * - `null` → aún no se ha verificado (no se inventan comprobaciones).
 * - `valid` → "Record intact"; cualquier otro caso → "Tampering detected".
 */
export function summarize(verification: ReportVerification | null): VerificationSummary {
  if (verification === null) {
    return { tone: 'unknown', title: 'Not verified yet', checks: [] }
  }

  return {
    tone: verification.valid ? 'ok' : 'bad',
    title: verification.valid ? 'Record intact' : 'Tampering detected',
    checks: [
      { label: 'Hash chain', ok: verification.chain.valid },
      { label: 'Head matches seal', ok: verification.headMatches },
      { label: 'Signature', ok: verification.signatureValid },
    ],
  }
}
