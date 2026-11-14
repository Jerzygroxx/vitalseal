import { useId } from 'react'
import { ArrowRight } from 'lucide-react'
import type { SystemStatus } from '../../domain/types'
import { StatusBadge } from './StatusBadge'
import { STATUS_TONES } from './status-tone'
import { SYSTEM_ICONS } from './system-icons'

export interface SystemCardProps {
  system: SystemStatus
  /** `compact` omite la evidencia y usa un medidor lineal (rejilla de sistemas). */
  variant?: 'detail' | 'compact'
}

const isExternalLink = (value: string): boolean => value.startsWith('https://')

const RING_R = 30
const RING_LENGTH = 2 * Math.PI * RING_R

/**
 * Detalle de un sistema (T-02): etiqueta, semáforo, score, indicadores fuera
 * de rango, acción concreta y evidencia. Componente de presentación puro.
 */
export function SystemCard({ system, variant = 'detail' }: SystemCardProps) {
  const titleId = useId()
  const hasIndicators = system.indicators.length > 0
  const tone = STATUS_TONES[system.status]
  const Icon = SYSTEM_ICONS[system.id]
  const score = Math.round(system.score)
  const fraction = Math.min(1, Math.max(0, system.score / 100))
  const compact = variant === 'compact'

  return (
    <article
      aria-labelledby={titleId}
      className={`glass flex h-full flex-col ${compact ? 'p-4' : 'hud p-5 sm:p-6'}`}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-xl border ${tone.chip} ${
            compact ? 'size-9' : 'size-11'
          }`}
        >
          <Icon className={compact ? 'size-4.5' : 'size-5.5'} />
        </span>
        <div className="min-w-0 flex-1">
          {!compact && <p className="eyebrow">Selected system</p>}
          <h3
            id={titleId}
            className={`font-semibold text-fg ${compact ? 'text-base leading-5' : 'text-xl leading-7'}`}
          >
            {system.label}
          </h3>
          <div className="mt-2">
            <StatusBadge status={system.status} />
          </div>
        </div>

        {!compact && (
          <div className="relative size-20 shrink-0">
            <svg viewBox="0 0 72 72" aria-hidden="true" className="size-full -rotate-90">
              <circle cx="36" cy="36" r={RING_R} fill="none" stroke="var(--color-space-600)" strokeWidth="5" />
              <circle
                cx="36"
                cy="36"
                r={RING_R}
                fill="none"
                stroke={tone.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${RING_LENGTH * fraction} ${RING_LENGTH}`}
              />
            </svg>
            <p className="absolute inset-0 flex flex-col items-center justify-center text-fg-muted">
              <span className="sr-only">Score </span>
              <span className="num font-mono text-xl leading-none font-semibold text-fg">{score}</span>
              <span className="num mt-0.5 text-[0.6875rem] leading-none">/ 100</span>
            </p>
          </div>
        )}
      </header>

      {compact && (
        <div className="mt-3">
          <p className="flex items-baseline justify-between text-sm text-fg-muted">
            Score
            <span className="num font-mono text-base font-semibold text-fg">{score}/100</span>
          </p>
          <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-space-600">
            <div className={`h-full rounded-full ${tone.solid}`} style={{ width: `${fraction * 100}%` }} />
          </div>
        </div>
      )}

      <section className={compact ? 'mt-3' : 'mt-5'} aria-label="Indicators outside range">
        <h4 className="eyebrow">Indicators</h4>
        {hasIndicators ? (
          <ul className="mt-1.5 space-y-1.5 text-sm text-fg">
            {system.indicators.map((indicator) => (
              <li key={indicator} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-[0.45rem] size-1.5 shrink-0 rotate-45 ${tone.solid}`}
                />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm text-fg-muted">No indicators outside range.</p>
        )}
      </section>

      <section
        className={`${compact ? 'mt-3' : 'well mt-5 border-l-2 border-l-ice-400 p-3.5'}`}
        aria-label="Recommended action"
      >
        <h4 className="eyebrow flex items-center gap-1.5">
          {!compact && <ArrowRight aria-hidden="true" className="size-3.5 text-ice-300" />}
          Action
        </h4>
        <p className={`mt-1.5 text-fg ${compact ? 'text-sm' : 'text-[0.9375rem] leading-6'}`}>
          {system.action}
        </p>
      </section>

      {!compact && system.evidence.length > 0 && (
        <section className="mt-5" aria-label="Evidence">
          <h4 className="eyebrow">Evidence</h4>
          <ul className="mt-1.5 space-y-1 text-xs leading-5 text-fg-muted">
            {system.evidence.map((item) => (
              <li key={item} className="break-words">
                {isExternalLink(item) ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ice-300 underline underline-offset-2 hover:text-ice-100"
                  >
                    {item}
                  </a>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
