import { useState } from 'react'
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

/**
 * Dashboard (T-02): estado general, línea de escalación, body map + detalle
 * del sistema seleccionado y rejilla con todos los sistemas.
 */
export function Dashboard({ triage }: DashboardProps) {
  const [selected, setSelected] = useState<SystemId | null>(() => defaultSelection(triage))

  const selectedSystem =
    triage.systems.find((system) => system.id === selected) ?? triage.systems[0]
  const { escalation } = triage

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 text-slate-100">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Crew health status</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-400">Overall</span>
          <StatusBadge status={triage.overall} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300">
          <span>
            Comm delay:{' '}
            <span className="font-medium text-slate-100">{distanceLabel(escalation.distance)}</span>
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>
            Latency:{' '}
            <span className="font-medium text-slate-100">
              {formatLatency(escalation.latencySeconds)}
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>
            Escalation:{' '}
            <span className="font-medium text-slate-100">{escalationLabel(escalation.level)}</span>
          </span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-label="Body systems map"
          className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 lg:col-span-1"
        >
          <BodyMap systems={triage.systems} selected={selected} onSelect={setSelected} />
        </section>

        <section aria-label="Selected system detail" className="lg:col-span-2">
          {selectedSystem ? (
            <SystemCard system={selectedSystem} />
          ) : (
            <p className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
              No system data available.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="system-breakdown-heading">
        <h2 id="system-breakdown-heading" className="text-lg font-semibold text-slate-100">
          System breakdown
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {triage.systems.map((system) => (
            <SystemCard key={system.id} system={system} />
          ))}
        </div>
        {triage.systems.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">No system data available.</p>
        )}
      </section>

      <footer className="border-t border-slate-800 pt-4 text-xs text-slate-400">
        Research prototype, not a medical device. Not affiliated with NASA.
      </footer>
    </div>
  )
}
