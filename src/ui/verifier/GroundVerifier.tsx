import { useId, useState } from 'react'
import { FileJson, RadioTower, ShieldCheck } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import { ChainOrbit } from '../integrity/ChainOrbit'
import { VerificationResult } from '../integrity/VerificationResult'
import { entryCountOf } from '../integrity/chain-layout'

export type VerifyOutcome =
  | { kind: 'result'; verification: ReportVerification }
  | { kind: 'error'; message: string }

export interface GroundVerifierProps {
  onVerify: (reportJson: string) => Promise<VerifyOutcome>
  /** Si existe, se muestra el botón "Load sample report". */
  sampleReportJson?: string
}

const STEPS = [
  'Paste the signed report received from the crew.',
  'Run the verification. Nothing leaves this page.',
  'Read the result: chain, seal and signature.',
]

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
  /** Nº de entradas del reporte verificado (solo para dibujar la cadena). */
  const [entryCount, setEntryCount] = useState<number | undefined>(undefined)
  const [pending, setPending] = useState(false)

  async function handleVerify() {
    setPending(true)
    try {
      setOutcome(await onVerify(reportJson))
      setEntryCount(entryCountOf(reportJson))
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
    <section aria-labelledby={titleId} className="grid gap-5 text-fg lg:grid-cols-2">
      <header className="glass hud flex items-start gap-4 p-5 sm:p-6 lg:col-span-2">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ice-300/40 bg-ice-400/12 text-ice-200"
        >
          <RadioTower className="size-5.5" />
        </span>
        <div>
          <p className="eyebrow">Independent check on the ground</p>
          <h2 id={titleId} className="mt-1 text-2xl leading-8 font-semibold">
            Ground Control Verifier
          </h2>
          <p className="mt-2 max-w-prose text-sm text-fg-muted">
            Paste a signed report received from the crew. This page checks the hash chain and
            the signature; it does not need the crew&apos;s device.
          </p>
        </div>
      </header>

      <div className="glass p-5">
        <label htmlFor={inputId} className="eyebrow flex items-center gap-2">
          <FileJson aria-hidden="true" className="size-4 text-ice-300" />
          Signed report (JSON)
        </label>
        <textarea
          id={inputId}
          value={reportJson}
          onChange={(event) => setReportJson(event.target.value)}
          rows={14}
          spellCheck={false}
          className="field mt-3 resize-y font-mono text-xs leading-5"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={handleVerify} disabled={pending}>
            <ShieldCheck aria-hidden="true" className="size-4" />
            {pending ? 'Verifying…' : 'Verify report'}
          </button>
          {sampleReportJson !== undefined && (
            <button
              type="button"
              className="btn"
              onClick={() => setReportJson(sampleReportJson)}
              disabled={pending}
            >
              Load sample report
            </button>
          )}
        </div>
      </div>

      <div className="glass p-5">
        <p className="eyebrow">Result</p>

        {outcome === null && (
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm text-fg-muted">
                <span
                  aria-hidden="true"
                  className="num flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs font-semibold text-ice-200"
                >
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {outcome?.kind === 'error' && (
          <div
            role="alert"
            className="mt-3 rounded-2xl border border-alert/55 bg-alert/14 p-4 text-sm text-alert-soft"
          >
            <p className="font-semibold">Could not verify the report</p>
            <p className="mt-1 break-words text-fg">{outcome.message}</p>
          </div>
        )}

        {outcome?.kind === 'result' && (
          <div className="mt-3 space-y-4">
            <VerificationResult verification={outcome.verification} />
            <ChainOrbit verification={outcome.verification} entryCount={entryCount} />
          </div>
        )}
      </div>
    </section>
  )
}
