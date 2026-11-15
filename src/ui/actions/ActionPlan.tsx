import { useId } from 'react'
import { ArrowRight, Check, OctagonX, Save, ShieldCheck } from 'lucide-react'
import type { Playbook } from '../../domain/playbooks'
import type { Distance } from '../../domain/types'
import { StatusBadge } from '../components/StatusBadge'
import { countDone, formatClock, progressLabel } from './format'

export interface ActionPlanProps {
  playbook: Playbook
  distance: Distance
  /** ISO time each step was marked done, by step index. undefined = not done yet. Same length as playbook.doNow. */
  doneAt: (string | undefined)[]
  onToggleStep: (index: number) => void
  /** True once the event record was saved and sealed. */
  saved: boolean
  /** Saves the event record. */
  onSave: () => void
}

/** Distance names as this card labels them (kept local: the dashboard uses short LEO). */
const DISTANCE_NAMES: Record<Distance, string> = {
  leo: 'Low Earth orbit',
  moon: 'Moon',
  mars: 'Mars',
}

const DISTANCE_ORDER: Distance[] = ['leo', 'moon', 'mars']

/**
 * Action plan card (T-05): what to do now, step by step, with the time each
 * step was marked done. Purely presentational: the parent owns the state,
 * the timestamps and the save call. No domain or crypto logic lives here.
 *
 * Status is never colour-only: the chip carries an icon and a text label, and
 * every step exposes role="checkbox" + aria-checked to assistive tech.
 */
export function ActionPlan({ playbook, distance, doneAt, onToggleStep, saved, onSave }: ActionPlanProps) {
  const titleId = useId()
  const total = playbook.doNow.length
  const done = countDone(doneAt)
  const fraction = total === 0 ? 0 : Math.min(1, done / total)

  return (
    <article aria-labelledby={titleId} className="glass hud p-5 text-fg sm:p-6">
      <header>
        <p className="eyebrow">Do this now</p>
        <div className="mt-1 flex flex-wrap items-start gap-3">
          <h2 id={titleId} className="min-w-0 flex-1 text-xl leading-7 font-semibold text-fg">
            {playbook.title}
          </h2>
          <span className="shrink-0">
            <StatusBadge status={playbook.status} size="lg" />
          </span>
        </div>
        {playbook.status === 'red' && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-alert/55 bg-alert/14 px-3 py-2.5 text-sm leading-5 font-semibold text-alert-soft">
            <OctagonX aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>Urgent: act now, then record.</span>
          </p>
        )}
      </header>

      <div className="mt-4">
        <p className="text-sm font-medium text-fg-muted">{progressLabel(done, total)}</p>
        <div aria-hidden="true" className="mt-1.5 h-1 overflow-hidden rounded-full bg-space-600">
          <div
            className="h-full rounded-full bg-ice-400 motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>

      <ol aria-label="Steps to do now" className="mt-4 list-none space-y-2 p-0">
        {playbook.doNow.map((step, index) => {
          const at = doneAt[index]
          const isDone = at !== undefined
          return (
            <li key={`${playbook.system}-${index}`}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                onClick={() => onToggleStep(index)}
                className={`flex min-h-12 w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isDone
                    ? 'border-ice-400/45 bg-ice-400/10 hover:border-ice-300/70'
                    : 'border-line-strong bg-space-800/60 hover:border-ice-400/60 hover:bg-space-700/60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isDone
                      ? 'border-ice-400/60 bg-ice-400/15 text-ice-100'
                      : 'border-line-strong bg-space-700/60 text-fg-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-5 sm:text-[0.9375rem] sm:leading-6 ${
                      isDone ? 'text-fg-muted' : 'text-fg'
                    }`}
                  >
                    {step}
                  </span>
                  {at !== undefined && (
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ice-200">
                      <Check aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="num font-mono">done {formatClock(at)}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <section className="well mt-5 border-l-2 border-l-ice-400 p-3.5" aria-label="Then">
        <h3 className="eyebrow flex items-center gap-1.5">
          <ArrowRight aria-hidden="true" className="size-3.5 text-ice-300" />
          Then
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-fg sm:text-[0.9375rem]">{playbook.recheck}</p>
      </section>

      <section className="mt-5" aria-label="Contact ground">
        <h3 className="eyebrow">Contact ground</h3>
        <ul className="mt-1.5 space-y-2">
          {DISTANCE_ORDER.map((option) => {
            const current = option === distance
            return (
              <li
                key={option}
                className={`rounded-xl border p-3 ${
                  current ? 'border-ice-400/60 bg-ice-400/10' : 'border-line bg-space-800/40'
                }`}
              >
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold tracking-[0.08em] uppercase ${
                      current ? 'text-ice-100' : 'text-fg-dim'
                    }`}
                  >
                    {DISTANCE_NAMES[option]}
                  </span>
                  {current && (
                    <span className="rounded-full border border-ice-300/60 bg-ice-300/15 px-2 py-0.5 text-xs font-semibold text-ice-100">
                      Your distance
                    </span>
                  )}
                </p>
                <p className={`mt-1 text-sm leading-5 ${current ? 'text-fg' : 'text-fg-muted'}`}>
                  {playbook.escalate[option]}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-5" aria-label="What the record will hold">
        <h3 className="eyebrow">What the record will hold</h3>
        <ul className="mt-1.5 space-y-1.5 text-sm text-fg">
          {playbook.record.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rotate-45 bg-ice-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5">
        {saved ? (
          <div role="status" className="well flex items-start gap-3 border-l-2 border-l-ok p-3.5">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" />
            <p className="text-sm leading-5 font-semibold text-fg">
              Saved and sealed in the tamper-evident record.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={done === 0}
            className="btn btn-primary min-h-12 w-full"
          >
            <Save aria-hidden="true" className="size-4.5" />
            Save event record
          </button>
        )}
        <p className="mt-2 text-xs leading-5 text-fg-dim">Each step keeps the time you marked it.</p>
      </div>

      <footer className="mt-5 border-t border-line pt-3">
        <p className="text-xs leading-5 text-fg-dim">{playbook.note}</p>
        {playbook.sources.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {playbook.sources.map((url, index) => (
              <li key={`${index}-${url}`}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-ice-300 underline underline-offset-2 hover:text-ice-100"
                >
                  Official source {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </article>
  )
}
