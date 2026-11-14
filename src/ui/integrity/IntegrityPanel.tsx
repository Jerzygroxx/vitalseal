import { useId, useRef, useState } from 'react'
import { Copy, RefreshCw, RotateCcw } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import type { TamperKind } from '../../store/integrity-store'
import { VerificationResult } from './VerificationResult'

export interface IntegrityPanelProps {
  verification: ReportVerification | null
  sealCode: string | null
  tampered: TamperKind | null
  /** Demo: simular manipulación. */
  onTamper: (kind: TamperKind) => void
  /** Demo: reiniciar. */
  onRestore: () => void
  /** Volver a verificar. */
  onVerify: () => void
}

const BUTTON_BASE =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50'
const SECONDARY_BUTTON = `${BUTTON_BASE} border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700`
const PRIMARY_BUTTON = `${BUTTON_BASE} border-cyan-400/60 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25`

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
 * Panel de integridad (T-03): estado del registro, comprobaciones, código de
 * sello y controles de demostración de manipulación.
 * Presentacional puro: recibe el resultado ya calculado y callbacks del padre.
 */
export function IntegrityPanel({
  verification,
  sealCode,
  tampered,
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
    <section
      aria-labelledby={titleId}
      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-slate-100"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        Integrity check
      </h2>

      <div className="mt-3">
        <VerificationResult verification={verification} />
      </div>

      {verification === null && (
        <div className="mt-3">
          <button type="button" className={PRIMARY_BUTTON} onClick={onVerify}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Verify again
          </button>
        </div>
      )}

      <section aria-labelledby={sealTitleId} className="mt-5">
        <h3 id={sealTitleId} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Seal code
        </h3>
        {sealCode !== null ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code
                ref={codeRef}
                className="rounded-lg bg-slate-950 px-2.5 py-1.5 font-mono text-sm break-all text-emerald-200"
              >
                {sealCode}
              </code>
              <button type="button" className={SECONDARY_BUTTON} onClick={handleCopy}>
                <Copy aria-hidden="true" className="size-4" />
                Copy seal code
              </button>
            </div>
            <p className="mt-2 max-w-prose text-xs text-slate-400">
              Send this short code to ground. Any later rewrite of the history produces a
              different code.
            </p>
            {copyStatus !== null && (
              <p role="status" aria-live="polite" className="mt-1 text-xs text-slate-300">
                {copyStatus === 'copied'
                  ? 'Copied to clipboard.'
                  : 'The code is selected. Press Ctrl+C (Cmd+C on a Mac) to copy it.'}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No seal code yet.</p>
        )}
      </section>

      <section
        aria-labelledby={demoTitleId}
        className="mt-5 rounded-lg border border-amber-400/30 bg-amber-500/5 p-3"
      >
        <h3 id={demoTitleId} className="text-xs font-semibold uppercase tracking-wide text-amber-300">
          Demo controls
        </h3>
        <p className="mt-1 text-xs text-amber-200/90">
          Demo only: simulates an attacker editing the stored record.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TAMPER_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() => onTamper(kind)}
            >
              {TAMPER_LABELS[kind]}
            </button>
          ))}
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={onRestore}
            disabled={tampered === null}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Restore data
          </button>
          <button type="button" className={SECONDARY_BUTTON} onClick={onVerify}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Verify again
          </button>
        </div>
        {tampered !== null && (
          <p className="mt-2 text-xs text-slate-300">
            Active demo tamper:{' '}
            <span className="font-semibold">{TAMPER_LABELS[tampered]}</span>
          </p>
        )}
      </section>
    </section>
  )
}
