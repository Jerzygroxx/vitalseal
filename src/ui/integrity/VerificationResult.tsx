import { ShieldCheck, ShieldQuestionMark, ShieldX, type LucideIcon } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import { CheckRow } from './CheckRow'
import { summarize, type SummaryTone } from './summary'

interface ToneStyle {
  icon: LucideIcon
  /** Borde + fondo + texto: el color nunca es el único indicador (hay icono y texto). */
  classes: string
}

const TONE_STYLES: Record<SummaryTone, ToneStyle> = {
  ok: {
    icon: ShieldCheck,
    classes: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
  },
  bad: {
    icon: ShieldX,
    classes: 'border-red-400/40 bg-red-500/15 text-red-300',
  },
  unknown: {
    icon: ShieldQuestionMark,
    classes: 'border-slate-600 bg-slate-800/60 text-slate-300',
  },
}

export interface VerificationResultProps {
  verification: ReportVerification | null
}

/**
 * Bloque de resultado compartido por `IntegrityPanel` y `GroundVerifier` (T-03):
 * banner con icono + texto + color, las tres comprobaciones y los problemas.
 * Presentacional puro: solo lee el resultado que ya calculó el verificador.
 */
export function VerificationResult({ verification }: VerificationResultProps) {
  const summary = summarize(verification)
  const { icon: Icon, classes } = TONE_STYLES[summary.tone]
  const problems = verification?.problems ?? []
  const brokenAt = verification?.chain.brokenAt

  return (
    <div className="space-y-3">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${classes}`}
      >
        <Icon aria-hidden="true" className="size-6 shrink-0" />
        <p className="text-lg font-semibold">{summary.title}</p>
      </div>

      {summary.checks.length > 0 && (
        <ul
          aria-label="Verification checks"
          className="space-y-1.5 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3"
        >
          {summary.checks.map((check) => (
            <CheckRow key={check.label} label={check.label} ok={check.ok} />
          ))}
        </ul>
      )}

      {brokenAt !== undefined && (
        <p className="text-sm text-slate-300">
          First inconsistent entry:{' '}
          <span className="font-mono font-semibold text-slate-100">#{brokenAt}</span>
        </p>
      )}

      {problems.length > 0 && (
        <section aria-label="Problems found">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Problems found
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
