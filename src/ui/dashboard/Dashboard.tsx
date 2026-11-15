import { useState } from 'react'
import { ClipboardCheck, Earth, ListChecks, Rocket, ShieldCheck, WifiOff } from 'lucide-react'
import { playbookFor } from '../../domain/playbooks'
import type { Status, SystemId, TriageResult } from '../../domain/types'
import { BodyMap } from '../body-map/BodyMap'
import { StatusBadge } from '../components/StatusBadge'
import { SystemCard } from '../components/SystemCard'
import { distanceLabel, escalationLabel, formatLatency } from '../components/format'
import { ActionSection } from './ActionSection'

export type DashboardTarget = 'check' | 'integrity' | 'ground'

export interface DashboardProps {
  triage: TriageResult
  /** Lets the big buttons at the top open another section of the app. */
  onNavigate?: (target: DashboardTarget) => void
}

/** Selección inicial: primer sistema que no esté verde; si todos lo están, el primero. */
function defaultSelection(triage: TriageResult): SystemId | null {
  const firstAttention = triage.systems.find((system) => system.status !== 'green')
  return (firstAttention ?? triage.systems[0])?.id ?? null
}

function attentionSummary(triage: TriageResult): string {
  const total = triage.systems.length
  const attention = triage.systems.filter((system) => system.status !== 'green').length
  if (total === 0) return 'No system data available.'
  if (attention === 0) return `All ${total} systems within range.`
  return `${attention} of ${total} systems need attention.`
}

const HEADLINE: Record<Status, string> = {
  green: 'All clear',
  amber: 'Needs attention',
  red: 'Act now',
}

const VALUE_CHIPS = [
  { icon: ListChecks, text: 'Step-by-step actions' },
  { icon: ShieldCheck, text: 'Tamper-evident record' },
  { icon: WifiOff, text: 'Works offline' },
]

/**
 * Dashboard: a plain-language headline with the next thing to do, the link to
 * ground, the body map with the selected system, the quick-response checklist
 * and a grid with every system.
 */
export function Dashboard({ triage, onNavigate }: DashboardProps) {
  const [selected, setSelected] = useState<SystemId | null>(() => defaultSelection(triage))

  const selectedSystem =
    triage.systems.find((system) => system.id === selected) ?? triage.systems[0]
  const { escalation } = triage
  const firstAttention = triage.systems.find((system) => system.status !== 'green')

  const goToActions = () => {
    if (firstAttention) setSelected(firstAttention.id)
    window.setTimeout(() => {
      document.getElementById('action-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <div className="space-y-5 text-fg">
      <header className="glass hud grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="eyebrow">Crew health today</p>
          <h2 className="mt-1 text-3xl leading-9 font-semibold text-fg sm:text-4xl sm:leading-10">
            {HEADLINE[triage.overall]}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={triage.overall} size="lg" />
            <p className="text-sm text-fg-muted">{attentionSummary(triage)}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {firstAttention ? (
              <button type="button" onClick={goToActions} className="btn btn-primary min-h-12 px-5 text-base">
                <ListChecks aria-hidden="true" className="size-5" />
                Do this now: {firstAttention.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate?.('check')}
                className="btn btn-primary min-h-12 px-5 text-base"
              >
                <ClipboardCheck aria-hidden="true" className="size-5" />
                Run today&rsquo;s check
              </button>
            )}
            {firstAttention && (
              <button type="button" onClick={() => onNavigate?.('check')} className="btn min-h-12 px-4">
                <ClipboardCheck aria-hidden="true" className="size-5" />
                Daily check
              </button>
            )}
            <button type="button" onClick={() => onNavigate?.('integrity')} className="btn min-h-12 px-4">
              <ShieldCheck aria-hidden="true" className="size-5" />
              Seal and verify
            </button>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="What VitalSeal gives the crew">
            {VALUE_CHIPS.map((chip) => (
              <li
                key={chip.text}
                className="flex items-center gap-1.5 rounded-full border border-line bg-space-900/60 px-3 py-1 text-xs text-fg-muted"
              >
                <chip.icon aria-hidden="true" className="size-3.5 text-ice-300" />
                {chip.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="well p-4">
          {/* Enlace nave -> Tierra: el pulso es decorativo; los datos van en el texto. */}
          <div aria-hidden="true" className="flex items-center gap-3 text-ice-300">
            <Rocket className="size-5 shrink-0" />
            <div className="relative h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--color-ice-400)_0_6px,transparent_6px_14px)]">
              <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-300 shadow-[0_0_10px_2px_rgb(249_197_127/0.7)] motion-safe:animate-signal" />
            </div>
            <Earth className="size-5 shrink-0" />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="eyebrow">Distance</dt>
              <dd className="mt-1 text-base font-semibold text-fg">
                {distanceLabel(escalation.distance)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Latency</dt>
              <dd className="num mt-1 font-mono text-base font-semibold text-ember-300">
                {formatLatency(escalation.latencySeconds)}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="eyebrow">Contact with ground</dt>
              <dd className="mt-1 text-base font-semibold text-fg">
                {escalationLabel(escalation.level)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <section aria-label="Body systems map" className="glass p-4 sm:p-5 lg:col-span-5">
          <p className="eyebrow">Tap a body system</p>
          <div className="mt-2">
            <BodyMap systems={triage.systems} selected={selected} onSelect={setSelected} />
          </div>
        </section>

        <section aria-label="Selected system detail" className="space-y-5 lg:col-span-7">
          {selectedSystem ? (
            <>
              {/* The wrapper stops the card's h-full from stretching to the whole grid row. */}
              <div>
                <SystemCard system={selectedSystem} showAction={selectedSystem.status === 'green'} />
              </div>
              <ActionSection system={selectedSystem} distance={escalation.distance} />
            </>
          ) : (
            <p className="glass p-5 text-sm text-fg-muted">No system data available.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="system-breakdown-heading">
        <h2 id="system-breakdown-heading" className="glass inline-block px-4 py-2 text-lg font-semibold text-fg">
          All systems
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {triage.systems.map((system) => {
            const next = playbookFor(system.id, system.status, escalation.distance)?.doNow[0]
            return (
              <SystemCard
                key={system.id}
                system={system}
                variant="compact"
                actionText={next ? `First step: ${next}` : undefined}
              />
            )
          })}
        </div>
        {triage.systems.length === 0 && (
          <p className="glass mt-3 p-4 text-sm text-fg-muted">No system data available.</p>
        )}
      </section>
    </div>
  )
}
