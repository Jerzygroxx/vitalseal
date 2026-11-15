import { useId, useRef, useState } from 'react'
import { Copy, FlaskConical, RadioTower, RefreshCw, RotateCcw, WifiOff } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import type { TamperKind } from '../../store/integrity-store'
import { ChainOrbit } from './ChainOrbit'
import { ReportExport } from './ReportExport'
import { StepCard } from './StepCard'
import { VerificationResult } from './VerificationResult'

export interface IntegrityPanelProps {
  verification: ReportVerification | null
  sealCode: string | null
  tampered: TamperKind | null
  /** Opcional: nº de entradas guardadas, para dibujar un nodo por lectura. */
  entryCount?: number
  /** Signed report as JSON (as currently stored), for "Send to ground". */
  reportJson?: string | null
  /** File name for the downloaded report. */
  reportFilename?: string
  /** Demo: simular manipulación. */
  onTamper: (kind: TamperKind) => void
  /** Demo: reiniciar. */
  onRestore: () => void
  /** Volver a verificar. */
  onVerify: () => void
}

const TAMPER_KINDS = ['alter', 'reorder', 'delete'] as const

const TAMPER_LABELS: Record<TamperKind, string> = {
  alter: 'Alter a reading',
  reorder: 'Reorder entries',
  delete: 'Delete an entry',
}

interface CopyResult {
  code: string
  status: 'copied' | 'manual'
}

/** Fallback si el portapapeles falla: selecciona el texto para copiarlo a mano. */
function selectText(element: HTMLElement | null) {
  const selection = window.getSelection()
  if (!element || !selection) return
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * Integrity tab (T-03, redesigned in T-08): one big verdict, the hash chain,
 * the three steps that take the record to ground, and a clearly separate demo
 * area to simulate tampering.
 * Presentation only: it receives the computed result and callbacks from the parent.
 */
export function IntegrityPanel({
  verification,
  sealCode,
  tampered,
  entryCount,
  reportJson = null,
  reportFilename = 'vitalseal-report.json',
  onTamper,
  onRestore,
  onVerify,
}: IntegrityPanelProps) {
  const titleId = useId()
  const pathTitleId = useId()
  const demoTitleId = useId()
  const verdictRef = useRef<HTMLDivElement | null>(null)
  const codeRef = useRef<HTMLElement | null>(null)
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null)

  const copyStatus =
    copyResult !== null && copyResult.code === sealCode ? copyResult.status : null

  async function handleCopy() {
    if (sealCode === null) return
    try {
      await navigator.clipboard.writeText(sealCode)
      setCopyResult({ code: sealCode, status: 'copied' })
    } catch {
      // Sin permiso o sin API de portapapeles: seleccionamos el código.
      selectText(codeRef.current)
      setCopyResult({ code: sealCode, status: 'manual' })
    }
  }

  /** The demo buttons sit below the verdict: bring the verdict back into view. */
  function showVerdict() {
    verdictRef.current?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <section aria-labelledby={titleId} className="grid gap-4 text-fg sm:gap-5">
      {/* 1. The verdict, then the chain that backs it. */}
      <div ref={verdictRef} className="glass hud scroll-mt-28 p-4 sm:p-6 lg:p-8">
        <h2 id={titleId} className="text-base font-medium text-ice-200 sm:text-lg">
          Can you trust this record?
        </h2>
        <div className="mt-3 grid items-center gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
          <div>
            <VerificationResult verification={verification} />
            {verification === null && (
              <button type="button" className="btn btn-primary mt-3 min-h-13 w-full text-base sm:w-auto sm:px-6" onClick={onVerify}>
                <RefreshCw aria-hidden="true" className="size-5" />
                Verify again
              </button>
            )}
            <p className="mt-4 max-w-prose text-sm leading-5 text-fg-muted sm:text-base sm:leading-6">
              Each entry is locked to the one before it, and the whole chain is signed. Change,
              move or remove one and the check fails.
            </p>
          </div>
          <ChainOrbit verification={verification} entryCount={entryCount} />
        </div>
      </div>

      {/* 2. How the record reaches ground, in three steps. */}
      <section aria-labelledby={pathTitleId}>
        <h3 id={pathTitleId} className="eyebrow px-1 text-ice-200">
          How it reaches ground
        </h3>
        <div className="mt-2 grid gap-3 sm:gap-4 lg:grid-cols-3">
          <StepCard step={1} title="Sealed on board">
            {sealCode !== null ? (
              <>
                <p className="eyebrow text-ember-300">Seal code</p>
                <div className="well mt-1.5 border-ember-300/40 px-3 py-3.5 text-center">
                  <code
                    ref={codeRef}
                    className="num font-mono text-xl leading-8 font-semibold tracking-[0.06em] [overflow-wrap:anywhere] text-ember-200 sm:text-2xl"
                  >
                    {sealCode}
                  </code>
                </div>
                <p className="mt-2 text-sm leading-5 text-fg-muted">
                  A short fingerprint of the whole record. Any rewrite gives a different code.
                </p>
                <div className="mt-auto pt-4">
                  <button type="button" className="btn btn-warm min-h-12 w-full text-base" onClick={handleCopy}>
                    <Copy aria-hidden="true" className="size-5" />
                    Copy seal code
                  </button>
                </div>
                <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-fg-muted">
                  {copyStatus === 'copied' && 'Copied to clipboard.'}
                  {copyStatus === 'manual' && 'Code selected. Press Ctrl+C (Cmd+C on a Mac).'}
                </p>
              </>
            ) : (
              <p className="text-sm text-fg-muted sm:text-base">No seal code yet.</p>
            )}
          </StepCard>

          <StepCard step={2} title="Send to ground">
            <ReportExport reportJson={reportJson} filename={reportFilename} />
          </StepCard>

          <StepCard step={3} title="Ground verifies">
            <p className="text-sm leading-5 text-fg-muted sm:text-base sm:leading-6">
              Ground loads the report in the <strong className="font-semibold text-fg">Ground Control</strong>{' '}
              tab and runs the same three checks, without the crew&rsquo;s device.
            </p>
            <ul className="mt-auto grid gap-2 pt-4 text-sm leading-5 font-medium text-fg">
              <li className="well flex min-h-12 items-center gap-3 px-3 py-2">
                <RadioTower aria-hidden="true" className="size-5 shrink-0 text-ice-300" />
                Chain, seal and signature
              </li>
              <li className="well flex min-h-12 items-center gap-3 px-3 py-2">
                <WifiOff aria-hidden="true" className="size-5 shrink-0 text-ice-300" />
                Works offline, nothing is uploaded
              </li>
            </ul>
          </StepCard>
        </div>
      </section>

      {/* 3. Demo only: simulate tampering. Visually secondary and labelled. */}
      <section aria-labelledby={demoTitleId} className="ig-demo p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="ig-demo-tag">
            <FlaskConical aria-hidden="true" className="size-3.5" />
            Demo
          </span>
          <h3 id={demoTitleId} className="font-display text-lg leading-7 font-semibold text-fg">
            Try to break the record
          </h3>
        </div>
        <p className="mt-1.5 max-w-prose text-sm leading-5 text-fg-muted">
          Simulation only. Pretend someone edited the stored record, then watch the verdict change.
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {TAMPER_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={tampered === kind}
              className={`btn min-h-12 text-base ${tampered === kind ? 'border-watch bg-watch/14 text-watch-soft' : ''}`}
              onClick={() => {
                onTamper(kind)
                showVerdict()
              }}
            >
              {TAMPER_LABELS[kind]}
            </button>
          ))}
        </div>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            className="btn min-h-12 text-base"
            onClick={() => {
              onRestore()
              showVerdict()
            }}
            disabled={tampered === null}
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            Restore data
          </button>
          <button
            type="button"
            className="btn min-h-12 text-base"
            onClick={() => {
              onVerify()
              showVerdict()
            }}
          >
            <RefreshCw aria-hidden="true" className="size-5" />
            Verify again
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-2.5 min-h-5 text-sm text-fg-muted">
          {tampered !== null && (
            <>
              Simulated change active:{' '}
              <span className="font-semibold text-watch-soft">{TAMPER_LABELS[tampered]}</span>
            </>
          )}
        </p>
      </section>
    </section>
  )
}
