import { ShieldCheck, ShieldQuestionMark, ShieldX, type LucideIcon } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import { CheckRow } from './CheckRow'
import { summarize, type SummaryTone } from './summary'

interface ToneStyle {
  icon: LucideIcon
  /** Borde + fondo + texto: el color nunca es el único indicador (hay icono y texto). */
  classes: string
  note: string
}

const TONE_STYLES: Record<SummaryTone, ToneStyle> = {
  ok: {
    icon: ShieldCheck,
    classes: 'border-ok/45 bg-ok/12 text-ok-soft',
    note: 'The record matches its signed seal.',
  },
  bad: {
    icon: ShieldX,
    classes: 'border-alert/55 bg-alert/14 text-alert-soft',
    note: 'The record no longer matches its signed seal.',
  },
  unknown: {
    icon: ShieldQuestionMark,
    classes: 'border-line-strong bg-space-700/60 text-fg-muted',
    note: 'Run a verification to compare the record with its seal.',
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
  const { icon: Icon, classes, note } = TONE_STYLES[summary.tone]
  const problems = verification?.problems ?? []
  const brokenAt = verification?.chain.brokenAt

  return (
    <div className="space-y-3">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${classes}`}
      >
        <Icon aria-hidden="true" className="size-9 shrink-0" strokeWidth={1.6} />
        <div className="min-w-0">
          <p className="font-display text-xl leading-7 font-semibold">{summary.title}</p>
          <p className="text-sm text-fg-muted">{note}</p>
        </div>
      </div>

      {summary.checks.length > 0 && (
        <ul aria-label="Verification checks" className="grid gap-2 sm:grid-cols-3">
          {summary.checks.map((check) => (
            <CheckRow key={check.label} label={check.label} ok={check.ok} />
          ))}
        </ul>
      )}

      {brokenAt !== undefined && (
        <p className="text-sm text-fg-muted">
          First inconsistent entry:{' '}
          <span className="num font-mono font-semibold text-fg">#{brokenAt}</span>
        </p>
      )}

      {problems.length > 0 && (
        <section aria-label="Problems found" className="well border-l-2 border-l-alert p-3.5">
          <h3 className="eyebrow">Problems found</h3>
          <ul className="mt-1.5 space-y-1.5 text-sm text-fg">
            {problems.map((problem) => (
              <li key={problem} className="flex gap-2">
                <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rotate-45 bg-alert" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
