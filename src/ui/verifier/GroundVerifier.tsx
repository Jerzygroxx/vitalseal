import { useId, useRef, useState, type ChangeEvent } from 'react'
import { FileUp, FlaskConical, RadioTower, ShieldCheck, WifiOff } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import { ChainOrbit } from '../integrity/ChainOrbit'
import { StepCard } from '../integrity/StepCard'
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

/**
 * Ground Control tab (T-03, redesigned in T-08): get the signed report (file or
 * paste), verify it, read one big verdict. It does not need the crew's device.
 * Presentation only: the verification itself is done by `onVerify` (crypto/store).
 */
export function GroundVerifier({ onVerify, sampleReportJson }: GroundVerifierProps) {
  const titleId = useId()
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)
  const [reportJson, setReportJson] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null)
  /** Entries in the verified report (only used to draw the chain). */
  const [entryCount, setEntryCount] = useState<number | undefined>(undefined)
  const [pending, setPending] = useState(false)

  const empty = reportJson.trim() === ''

  /** Reads the chosen .json file into the textarea. Nothing is uploaded. */
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setReportJson(typeof reader.result === 'string' ? reader.result : '')
      setSource(`Loaded ${file.name}.`)
    }
    reader.onerror = () => setSource(`Could not read ${file.name}. Paste the report instead.`)
    reader.readAsText(file)
    // Allow picking the same file again.
    input.value = ''
  }

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
      // On a phone the result is below the button: bring it into view.
      resultRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }

  return (
    <section aria-labelledby={titleId} className="grid gap-4 text-fg sm:gap-5 lg:grid-cols-2">
      <header className="glass hud flex items-center gap-4 p-4 sm:p-6 lg:col-span-2">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-ice-300/40 bg-ice-400/12 text-ice-200 sm:size-16"
        >
          <RadioTower className="size-7 sm:size-8" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-medium text-ice-200 sm:text-lg">Ground Control</p>
          <h2
            id={titleId}
            className="mt-0.5 text-[1.75rem] leading-8 font-semibold tracking-tight text-balance sm:text-4xl sm:leading-10"
          >
            Check the crew&rsquo;s report
          </h2>
          <p className="mt-1.5 flex items-center gap-2 text-sm leading-5 text-fg-muted sm:text-base">
            <WifiOff aria-hidden="true" className="size-4 shrink-0 text-ice-300" />
            Runs on this page. Nothing is uploaded.
          </p>
        </div>
      </header>

      <div className="grid content-start gap-4 sm:gap-5">
        <StepCard step={1} title="Get the report">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn min-h-13 w-full border-ice-300/60 text-base"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            <FileUp aria-hidden="true" className="size-5 text-ice-300" />
            Choose file
          </button>

          <label htmlFor={inputId} className="eyebrow mt-4 block">
            Or paste the signed report (JSON)
          </label>
          <textarea
            id={inputId}
            value={reportJson}
            onChange={(event) => {
              setReportJson(event.target.value)
              setSource(null)
            }}
            rows={7}
            spellCheck={false}
            placeholder="Paste the report here"
            className="field mt-1.5 resize-y font-mono text-xs leading-5"
          />
          <p role="status" aria-live="polite" className="mt-1.5 min-h-5 text-sm text-fg-muted">
            {source}
          </p>

          {sampleReportJson !== undefined && (
            <div className="ig-demo mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
              <span className="ig-demo-tag">
                <FlaskConical aria-hidden="true" className="size-3.5" />
                Demo
              </span>
              <p className="min-w-0 flex-1 basis-40 text-sm leading-5 text-fg-muted">
                No file at hand? Use this crew&rsquo;s current report.
              </p>
              <button
                type="button"
                className="btn min-h-12 w-full sm:w-auto"
                onClick={() => {
                  setReportJson(sampleReportJson)
                  setSource('Sample report loaded.')
                }}
                disabled={pending}
              >
                Load sample report
              </button>
            </div>
          )}
        </StepCard>

        <StepCard step={2} title="Verify">
          <button
            type="button"
            className="btn btn-primary min-h-16 w-full text-lg"
            onClick={handleVerify}
            disabled={pending}
          >
            <ShieldCheck aria-hidden="true" className="size-6" />
            {pending ? 'Verifying…' : 'Verify report'}
          </button>
          <p className="mt-2 text-sm leading-5 text-fg-muted">
            {empty
              ? 'Add a report in step 1 first.'
              : 'Checks the hash chain, the seal and the signature.'}
          </p>
        </StepCard>
      </div>

      <div ref={resultRef} className="scroll-mt-28">
        <StepCard step={3} title="Read the result" className="h-full">
          {outcome === null && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
              <ShieldCheck aria-hidden="true" className="size-12 text-fg-dim" strokeWidth={1.5} />
              <p className="font-display text-xl leading-7 font-semibold text-fg">No result yet</p>
              <p className="max-w-xs text-sm leading-5 text-fg-muted sm:text-base">
                The verdict appears here: record intact, or tampering detected.
              </p>
            </div>
          )}

          {outcome?.kind === 'error' && (
            <div
              role="alert"
              className="flex items-start gap-4 rounded-3xl border border-alert/60 bg-alert/12 p-4 sm:p-5"
            >
              <span
                aria-hidden="true"
                className="ig-octagon flex size-14 shrink-0 items-center justify-center bg-alert text-2xl font-bold text-space-950"
              >
                !
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-8 font-semibold text-alert-soft">
                  Could not read the report
                </p>
                <p className="mt-1 text-sm leading-5 [overflow-wrap:anywhere] text-fg sm:text-base">
                  {outcome.message}
                </p>
              </div>
            </div>
          )}

          {outcome?.kind === 'result' && (
            <div className="space-y-4">
              <VerificationResult verification={outcome.verification} />
              <ChainOrbit verification={outcome.verification} entryCount={entryCount} />
            </div>
          )}
        </StepCard>
      </div>
    </section>
  )
}
