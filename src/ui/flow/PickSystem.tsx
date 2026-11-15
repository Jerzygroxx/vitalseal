import { ArrowLeft } from 'lucide-react'
import { SITUATIONS, SYSTEM_ORDER, type FlowMode } from '../../domain/situations'
import type { SystemId, TriageResult } from '../../domain/types'
import { StatusBadge } from '../components/StatusBadge'
import { SYSTEM_ICONS } from '../components/system-icons'

export interface PickSystemProps {
  mode: FlowMode
  triage: TriageResult
  onPick: (system: SystemId) => void
  onBack: () => void
}

/** Big tiles: "Something feels off" (calm wording) and "Emergency" (urgent wording). */
export function PickSystem({ mode, triage, onPick, onBack }: PickSystemProps) {
  const emergency = mode === 'emergency'
  return (
    <div className="space-y-4 text-fg">
      <button type="button" onClick={onBack} className="btn min-h-11 px-3">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back
      </button>
      <header>
        <p className="eyebrow">{emergency ? 'Emergency' : 'Something feels off'}</p>
        <h2 className="mt-1 text-3xl leading-9 font-semibold sm:text-4xl">
          {emergency ? 'What is happening?' : 'What is bothering you?'}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          {emergency
            ? 'Pick the closest one. You get the steps right away, and every step is recorded.'
            : 'Pick the closest one. You get simple steps to follow.'}
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SYSTEM_ORDER.map((id) => {
          const Icon = SYSTEM_ICONS[id]
          const text = SITUATIONS[mode][id]
          const status = triage.systems.find((s) => s.id === id)?.status
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                className={`glass flex min-h-24 w-full items-center gap-4 p-4 text-left transition-colors hover:border-ice-300/70 ${
                  emergency ? 'border-alert/55' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${
                    emergency ? 'border-alert/55 bg-alert/14 text-alert-soft' : 'border-line-strong bg-space-700/60 text-ice-200'
                  }`}
                >
                  <Icon className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-6 font-semibold">{text.title}</span>
                  {!emergency && <span className="mt-0.5 block text-sm text-fg-muted">{text.hint}</span>}
                </span>
                {!emergency && status && status !== 'green' && (
                  <span className="shrink-0">
                    <StatusBadge status={status} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
