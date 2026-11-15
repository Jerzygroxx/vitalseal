import { useMemo } from 'react'
import { buildEventReading } from '../../domain/action-event'
import { playbookFor } from '../../domain/playbooks'
import type { Distance, SystemStatus } from '../../domain/types'
import { playbookKey, useActionStore } from '../../store/action-store'
import { useAppStore } from '../../store/app-store'
import { useIntegrityStore } from '../../store/integrity-store'
import { ActionPlan } from '../actions/ActionPlan'

export interface ActionSectionProps {
  system: SystemStatus
  distance: Distance
}

/**
 * Connects the quick-response checklist of the selected body system to the stores:
 * progress with times lives in the action store, and "Save event record" appends
 * the record (latest vitals + steps with times) to the sealed hash chain.
 */
export function ActionSection({ system, distance }: ActionSectionProps) {
  const playbook = playbookFor(system.id, system.status, distance)
  const key = playbookKey(system.id, system.status)
  const stored = useActionStore((s) => s.doneAt[key])
  const saved = useActionStore((s) => s.saved[key] ?? false)
  const toggleStep = useActionStore((s) => s.toggleStep)
  const markSaved = useActionStore((s) => s.markSaved)
  const length = playbook?.doNow.length ?? 0

  const doneAt = useMemo(() => {
    const out: (string | undefined)[] = Array.from({ length }, () => undefined)
    stored?.forEach((t, i) => {
      if (i < length) out[i] = t
    })
    return out
  }, [stored, length])

  if (!playbook) return null

  const handleSave = () => {
    const readings = useAppStore.getState().readings
    const latest = readings[readings.length - 1]
    if (!latest) return
    const record = buildEventReading(latest, playbook, doneAt, distance, new Date().toISOString())
    void useIntegrityStore
      .getState()
      .addReading(record)
      .then(() => markSaved(key))
  }

  return (
    <div id="action-plan" className="scroll-mt-28">
      <ActionPlan
        playbook={playbook}
        distance={distance}
        doneAt={doneAt}
        onToggleStep={(i) => toggleStep(key, i, length)}
        saved={saved}
        onSave={handleSave}
      />
    </div>
  )
}
