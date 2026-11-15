import { ShieldCheck, ShieldQuestionMark, ShieldX, type LucideIcon } from 'lucide-react'
import type { ReportVerification } from '../../crypto/verify'
import { CheckRow } from './CheckRow'
import { summarize, type SummaryTone } from './summary'

interface ToneStyle {
  icon: LucideIcon
  /** Card: border + tint. Colour is never the only signal (icon shape + text). */
  card: string
  /** Icon badge: a different shape per verdict (circle / octagon / dashed circle). */
  badge: string
  title: string
  note: string
}

const TONE_STYLES: Record<SummaryTone, ToneStyle> = {
  ok: {
    icon: ShieldCheck,
    card: 'border-ok/50 bg-ok/10',
    badge: 'rounded-full bg-ok text-space-950',
    title: 'text-ok-soft',
    note: 'Nothing was changed since it was sealed.',
  },
  bad: {
    icon: ShieldX,
    card: 'border-alert/60 bg-alert/12',
    badge: 'ig-octagon bg-alert text-space-950',
    title: 'text-alert-soft',
    note: 'The record no longer matches its signed seal. Do not rely on it.',
  },
  unknown: {
    icon: ShieldQuestionMark,
    card: 'border-line-strong bg-space-700/50',
    badge: 'rounded-full border-2 border-dashed border-line-strong text-fg-muted',
    title: 'text-fg',
    note: 'Run a check to compare the record with its seal.',
  },
}

export interface VerificationResultProps {
  verification: ReportVerification | null
}

/**
 * Shared result block for `IntegrityPanel` and `GroundVerifier`: one big verdict
 * (shaped icon + plain words + colour), the three checks and any problems.
 * Presentation only: it reads what the verifier already computed.
 */
export function VerificationResult({ verification }: VerificationResultProps) {
  const summary = summarize(verification)
  const tone = TONE_STYLES[summary.tone]
  const Icon = tone.icon
  const problems = verification?.problems ?? []
  const brokenAt = verification?.chain.brokenAt

  return (
    <div className="space-y-3">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-4 rounded-3xl border p-4 sm:gap-5 sm:p-5 ${tone.card}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-16 shrink-0 items-center justify-center sm:size-20 ${tone.badge}`}
        >
          <Icon className="size-9 sm:size-11" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p
            className={`font-display text-[1.75rem] leading-8 font-semibold tracking-tight text-balance sm:text-4xl sm:leading-10 ${tone.title}`}
          >
            {summary.title}
          </p>
          <p className="mt-1 text-sm leading-5 text-fg-muted sm:text-base sm:leading-6">{tone.note}</p>
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
        <p className="text-sm text-fg-muted sm:text-base">
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
                <span className="min-w-0 [overflow-wrap:anywhere]">{problem}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
