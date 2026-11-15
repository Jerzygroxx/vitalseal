import { CheckCircle2, ListChecks } from 'lucide-react'
import type { TriageResult } from '../../domain/types'
import { StatusBadge } from '../components/StatusBadge'

export interface CheckInResultProps {
  triage: TriageResult
  onPlan: (systemIndex: number) => void
  onHome: () => void
}

/** What the check-in found, in one screen: all clear, or the first thing to do. */
export function CheckInResult({ triage, onPlan, onHome }: CheckInResultProps) {
  const attention = triage.systems.filter((s) => s.status !== 'green')
  const firstIndex = triage.systems.findIndex((s) => s.status !== 'green')
  return (
    <div className="glass hud space-y-5 p-6 text-fg sm:p-8">
      <header>
        <p className="eyebrow">Check-in saved and sealed</p>
        <h2 className="mt-1 text-3xl leading-9 font-semibold sm:text-4xl">
          {attention.length === 0 ? 'All clear' : 'Here is what to do'}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge status={triage.overall} size="lg" />
          <p className="text-sm text-fg-muted">
            {attention.length === 0
              ? 'Every system is within range.'
              : `${attention.length} of ${triage.systems.length} systems need attention.`}
          </p>
        </div>
      </header>
      {attention.length > 0 && (
        <ul className="space-y-2">
          {attention.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-space-800/50 p-3">
              <StatusBadge status={s.status} />
              <span className="font-medium">{s.label}</span>
              <span className="text-sm text-fg-muted">{s.indicators[0]}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        {firstIndex >= 0 && (
          <button type="button" onClick={() => onPlan(firstIndex)} className="btn btn-primary min-h-12 px-5 text-base">
            <ListChecks aria-hidden="true" className="size-5" /> Do this now: {triage.systems[firstIndex]!.label}
          </button>
        )}
        <button type="button" onClick={onHome} className="btn min-h-12 px-5 text-base">
          <CheckCircle2 aria-hidden="true" className="size-5" /> Back to home
        </button>
      </div>
    </div>
  )
}
