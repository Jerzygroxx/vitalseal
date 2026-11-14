import { useId, useRef, useState } from 'react'
import { Copy, Fingerprint, FlaskConical, RefreshCw, RotateCcw } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import type { TamperKind } from '../../store/integrity-store'
import { ChainOrbit } from './ChainOrbit'
import { VerificationResult } from './VerificationResult'

export interface IntegrityPanelProps {
  verification: ReportVerification | null
  sealCode: string | null
  tampered: TamperKind | null
  /** Opcional: nº de entradas guardadas, para dibujar un nodo por lectura. */
  entryCount?: number
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
 * Panel de integridad (T-03): estado del registro, cadena de hashes, código de
 * sello y controles de demostración de manipulación.
 * Presentacional puro: recibe el resultado ya calculado y callbacks del padre.
 */
export function IntegrityPanel({
  verification,
  sealCode,
  tampered,
  entryCount,
  onTamper,
  onRestore,
  onVerify,
}: IntegrityPanelProps) {
  const titleId = useId()
  const sealTitleId = useId()
  const demoTitleId = useId()
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

  return (
    <section aria-labelledby={titleId} className="grid gap-5 text-fg lg:grid-cols-12">
      <div className="glass hud p-5 sm:p-6 lg:col-span-7">
        <p className="eyebrow">Tamper-evident record</p>
        <h2 id={titleId} className="mt-1 text-2xl leading-8 font-semibold">
          Integrity check
        </h2>
        <p className="mt-2 max-w-prose text-sm text-fg-muted">
          Every reading is hashed together with the one before it, and the whole chain is signed.
          Change, move or remove one entry and the links stop matching.
        </p>

        <div className="mt-4">
          <ChainOrbit verification={verification} entryCount={entryCount} />
        </div>

        <div className="mt-5">
          <VerificationResult verification={verification} />
        </div>

        {verification === null && (
          <div className="mt-3">
            <button type="button" className="btn btn-primary" onClick={onVerify}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Verify again
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5 lg:col-span-5">
        <section aria-labelledby={sealTitleId} className="glass p-5">
          <h3 id={sealTitleId} className="eyebrow flex items-center gap-2">
            <Fingerprint aria-hidden="true" className="size-4 text-ember-300" />
            Seal code
          </h3>
          {sealCode !== null ? (
            <>
              <div className="well mt-3 border-ember-300/35 px-4 py-4 text-center">
                <code
                  ref={codeRef}
                  className="num font-mono text-lg leading-8 font-semibold tracking-[0.06em] [overflow-wrap:anywhere] text-ember-200 sm:text-xl"
                >
                  {sealCode}
                </code>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-warm" onClick={handleCopy}>
                  <Copy aria-hidden="true" className="size-4" />
                  Copy seal code
                </button>
                {copyStatus !== null && (
                  <p role="status" aria-live="polite" className="text-xs text-fg-muted">
                    {copyStatus === 'copied'
                      ? 'Copied to clipboard.'
                      : 'The code is selected. Press Ctrl+C (Cmd+C on a Mac) to copy it.'}
                  </p>
                )}
              </div>
              <p className="mt-3 max-w-prose text-xs leading-5 text-fg-muted">
                Send this short code to ground. Any later rewrite of the history produces a
                different code.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">No seal code yet.</p>
          )}
        </section>

        <section
          aria-labelledby={demoTitleId}
          className="glass border-watch/35 bg-[linear-gradient(180deg,rgb(255_201_77/0.07),transparent_60%),rgb(6_10_20/0.84)] p-5"
        >
          <h3 id={demoTitleId} className="eyebrow flex items-center gap-2 text-watch-soft">
            <FlaskConical aria-hidden="true" className="size-4 text-watch" />
            Demo controls
          </h3>
          <p className="mt-1.5 text-sm text-fg-muted">
            Demo only: simulates an attacker editing the stored record.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {TAMPER_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={tampered === kind}
                className={`btn ${tampered === kind ? 'border-watch bg-watch/14 text-watch-soft' : ''}`}
                onClick={() => onTamper(kind)}
              >
                {TAMPER_LABELS[kind]}
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn" onClick={onRestore} disabled={tampered === null}>
              <RotateCcw aria-hidden="true" className="size-4" />
              Restore data
            </button>
            <button type="button" className="btn" onClick={onVerify}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Verify again
            </button>
          </div>
          {tampered !== null && (
            <p className="mt-3 text-xs text-fg-muted">
              Active demo tamper:{' '}
              <span className="font-semibold text-watch-soft">{TAMPER_LABELS[tampered]}</span>
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
