import { ArrowLeft } from 'lucide-react'
import type { FlowMode } from '../../domain/situations'
import type { Distance, Status, SystemId, TriageResult } from '../../domain/types'
import { ActionSection } from '../dashboard/ActionSection'

export interface PlanViewProps {
  system: SystemId
  mode: FlowMode
  triage: TriageResult
  distance: Distance
  onBack: () => void
}

/**
 * Checklist for one system. Emergency opens the urgent (red) steps; "something feels off"
 * uses the system's current status, or the calm (amber) steps if it is green.
 */
export function PlanView({ system, mode, triage, distance, onBack }: PlanViewProps) {
  const current = triage.systems.find((s) => s.id === system)
  if (!current) return null
  const status: Exclude<Status, 'green'> =
    mode === 'emergency' ? 'red' : current.status === 'green' ? 'amber' : current.status
  return (
    <div className="space-y-4 text-fg">
      <button type="button" onClick={onBack} className="btn min-h-11 px-3">
        <ArrowLeft aria-hidden="true" className="size-4" /> Back
      </button>
      <ActionSection system={{ ...current, status }} distance={distance} />
    </div>
  )
}
