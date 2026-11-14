import { useId, useState } from 'react'
import type { ReportVerification } from '../../crypto/verify'
import { VerificationResult } from '../integrity/VerificationResult'

export type VerifyOutcome =
  | { kind: 'result'; verification: ReportVerification }
  | { kind: 'error'; message: string }

export interface GroundVerifierProps {
  onVerify: (reportJson: string) => Promise<VerifyOutcome>
  /** Si existe, se muestra el botón "Load sample report". */
  sampleReportJson?: string
}

const BUTTON_BASE =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50'
const SECONDARY_BUTTON = `${BUTTON_BASE} border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700`
const PRIMARY_BUTTON = `${BUTTON_BASE} border-cyan-400/60 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25`

/**
 * Vista "Ground Control Verifier" (T-03): pega un reporte firmado recibido de
 * la tripulación y compruébalo sin necesidad de su dispositivo.
 * Presentacional puro: la verificación la hace `onVerify` (crypto/store).
 */
export function GroundVerifier({ onVerify, sampleReportJson }: GroundVerifierProps) {
  const titleId = useId()
  const inputId = useId()
  const [reportJson, setReportJson] = useState('')
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null)
  const [pending, setPending] = useState(false)

  async function handleVerify() {
    setPending(true)
    try {
      setOutcome(await onVerify(reportJson))
    } catch (error) {
      setOutcome({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error while verifying the report.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby={titleId} className="mx-auto w-full max-w-3xl space-y-4 text-slate-100">
      <header>
        <h2 id={titleId} className="text-lg font-semibold">
          Ground Control Verifier
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Paste a signed report received from the crew. This page checks the hash chain and
          the signature; it does not need the crew&apos;s device.
        </p>
      </header>

      <div>
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          Signed report (JSON)
        </label>
        <textarea
          id={inputId}
          value={reportJson}
          onChange={(event) => setReportJson(event.target.value)}
          rows={8}
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={PRIMARY_BUTTON} onClick={handleVerify} disabled={pending}>
            {pending ? 'Verifying…' : 'Verify report'}
          </button>
          {sampleReportJson !== undefined && (
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() => setReportJson(sampleReportJson)}
              disabled={pending}
            >
              Load sample report
            </button>
          )}
        </div>
      </div>

      {outcome?.kind === 'error' && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-200"
        >
          <p className="font-semibold">Could not verify the report</p>
          <p className="mt-1 break-words">{outcome.message}</p>
        </div>
      )}

      {outcome?.kind === 'result' && <VerificationResult verification={outcome.verification} />}
    </section>
  )
}
