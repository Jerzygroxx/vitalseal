import { useState } from 'react'
import { Earth, Rocket } from 'lucide-react'
import type { SystemId, TriageResult } from '../../domain/types'
import { BodyMap } from '../body-map/BodyMap'
import { StatusBadge } from '../components/StatusBadge'
import { SystemCard } from '../components/SystemCard'
import { distanceLabel, escalationLabel, formatLatency } from '../components/format'

export interface DashboardProps {
  triage: TriageResult
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

/**
 * Dashboard (T-02): estado general, enlace de comunicación y escalación,
 * body map + detalle del sistema seleccionado y rejilla con todos los sistemas.
 */
export function Dashboard({ triage }: DashboardProps) {
  const [selected, setSelected] = useState<SystemId | null>(() => defaultSelection(triage))

  const selectedSystem =
    triage.systems.find((system) => system.id === selected) ?? triage.systems[0]
  const { escalation } = triage

  return (
    <div className="space-y-5 text-fg">
      <header className="glass hud grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center">
        <div>
          <p className="eyebrow">Latest reading · rule-based triage</p>
          <h2 className="mt-1 text-2xl leading-8 font-semibold text-fg sm:text-[1.75rem]">
            Crew health status
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-fg-muted">Overall</span>
            <StatusBadge status={triage.overall} size="lg" />
          </div>
          <p className="mt-3 text-sm text-fg-muted">{attentionSummary(triage)}</p>
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
              <dt className="eyebrow">Comm delay</dt>
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
              <dt className="eyebrow">Escalation</dt>
              <dd className="mt-1 text-base font-semibold text-fg">
                {escalationLabel(escalation.level)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <section aria-label="Body systems map" className="glass p-4 sm:p-5 lg:col-span-5">
          <p className="eyebrow">Body systems map</p>
          <div className="mt-2">
            <BodyMap systems={triage.systems} selected={selected} onSelect={setSelected} />
          </div>
        </section>

        <section aria-label="Selected system detail" className="lg:sticky lg:top-32 lg:col-span-7 lg:self-start">
          {selectedSystem ? (
            <SystemCard system={selectedSystem} />
          ) : (
            <p className="glass p-5 text-sm text-fg-muted">No system data available.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="system-breakdown-heading">
        <h2 id="system-breakdown-heading" className="glass inline-block px-4 py-2 text-lg font-semibold text-fg">
          System breakdown
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {triage.systems.map((system) => (
            <SystemCard key={system.id} system={system} variant="compact" />
          ))}
        </div>
        {triage.systems.length === 0 && (
          <p className="glass mt-3 p-4 text-sm text-fg-muted">No system data available.</p>
        )}
      </section>
    </div>
  )
}
