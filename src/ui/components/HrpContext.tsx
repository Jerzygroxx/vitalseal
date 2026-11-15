import { useId } from 'react'
import { BookOpenText, ExternalLink } from 'lucide-react'
import { SYSTEM_SOURCES } from '../../domain/evidence'
import type { SystemId } from '../../domain/types'

/**
 * Contexto de las fuentes oficiales (NASA HRP y CSA) del sistema seleccionado.
 * Plegado por defecto para no cargar la pantalla; el resumen es visible.
 */
export function HrpContext({ systemId }: { systemId: SystemId }) {
  const headingId = useId()
  const entries = SYSTEM_SOURCES[systemId]
  if (entries.length === 0) return null

  return (
    <details className="well mt-5 p-3.5" aria-labelledby={headingId}>
      <summary
        id={headingId}
        className="eyebrow flex cursor-pointer items-center gap-2 rounded -outline-offset-2 select-none"
      >
        <BookOpenText aria-hidden="true" className="size-3.5 text-ice-300" />
        Official sources
        <span className="num rounded-full border border-line px-2 py-0.5 normal-case tracking-normal text-fg-muted">
          {entries.length}
        </span>
      </summary>

      <ul className="mt-3 space-y-4">
        {entries.map((entry) => (
          <li key={entry.url} className="space-y-1.5">
            <p className="text-sm leading-5 font-medium text-fg">
              <span className="mr-2 rounded border border-line px-1.5 py-0.5 text-[0.6875rem] font-semibold text-ice-300">
                {entry.agency}
              </span>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ice-300 underline underline-offset-2 hover:text-ice-100"
              >
                {entry.title}
                <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
            <p className="text-sm leading-5 text-fg-muted">{entry.summary}</p>
            <ul className="space-y-1 text-xs leading-5 text-fg-muted">
              {entry.actions.map((action) => (
                <li key={action} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-ice-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            {entry.note && <p className="text-xs leading-5 text-fg-muted italic">VitalSeal: {entry.note}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.6875rem] leading-4 text-fg-muted">
        Summaries are our own wording. Not an official NASA statement. Not a medical device.
      </p>
    </details>
  )
}
