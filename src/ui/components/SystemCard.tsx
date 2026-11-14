import { useId } from 'react'
import type { SystemStatus } from '../../domain/types'
import { StatusBadge } from './StatusBadge'

export interface SystemCardProps {
  system: SystemStatus
}

const isExternalLink = (value: string): boolean => value.startsWith('https://')

/**
 * Detalle de un sistema (T-02): etiqueta, semáforo, score, indicadores fuera
 * de rango, acción concreta y evidencia. Componente de presentación puro.
 */
export function SystemCard({ system }: SystemCardProps) {
  const titleId = useId()
  const hasIndicators = system.indicators.length > 0

  return (
    <article
      aria-labelledby={titleId}
      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="text-base font-semibold text-slate-100">
          {system.label}
        </h3>
        <StatusBadge status={system.status} />
      </header>

      <p className="mt-2 text-sm text-slate-400">
        Score{' '}
        <span className="font-mono text-base font-semibold text-slate-100">
          {Math.round(system.score)}/100
        </span>
      </p>

      <section className="mt-3" aria-label="Indicators outside range">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Indicators</h4>
        {hasIndicators ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
            {system.indicators.map((indicator) => (
              <li key={indicator}>{indicator}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-400">No indicators outside range.</p>
        )}
      </section>

      <section className="mt-3" aria-label="Recommended action">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Action</h4>
        <p className="mt-1 text-sm text-slate-200">{system.action}</p>
      </section>

      {system.evidence.length > 0 && (
        <section className="mt-3" aria-label="Evidence">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidence</h4>
          <ul className="mt-1 space-y-1 text-xs text-slate-400">
            {system.evidence.map((item) => (
              <li key={item} className="break-words">
                {isExternalLink(item) ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
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
