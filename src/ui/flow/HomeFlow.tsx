import { useEffect, useRef } from 'react'
import type { Reading } from '../../domain/types'
import { useAppStore } from '../../store/app-store'
import { useIntegrityStore } from '../../store/integrity-store'
import { useUiStore } from '../../store/ui-store'
import { CheckInWizard } from '../checkin/CheckInWizard'
import { HomeScreen } from '../home/HomeScreen'
import { CheckInResult } from './CheckInResult'
import { PickSystem } from './PickSystem'
import { PlanView } from './PlanView'

/**
 * The guided assistant inside the Home tab: how do you feel? -> quick check, something
 * feels off, or emergency -> steps to follow with times -> sealed record.
 */
export function HomeFlow() {
  const flow = useUiStore((s) => s.flow)
  const go = useUiStore((s) => s.go)
  const triage = useAppStore((s) => s.triage)
  const distance = useAppStore((s) => s.distance)
  const readings = useAppStore((s) => s.readings)
  const addReading = useAppStore((s) => s.addReading)
  const addToChain = useIntegrityStore((s) => s.addReading)

  // Each new screen of the flow starts at the top of the content, so on a phone the crew
  // does not have to scroll past the header and window view to reach the steps.
  const shown = useRef(flow.name)
  useEffect(() => {
    if (shown.current === flow.name) return
    shown.current = flow.name
    document.getElementById('main')?.scrollIntoView({ block: 'start' })
  }, [flow.name])

  if (!triage) return null
  const home = () => go({ name: 'home' })

  const submit = (r: Reading) => {
    addReading(r)
    void addToChain(r)
    go({ name: 'result' })
  }

  switch (flow.name) {
    case 'checkin':
      return <CheckInWizard defaults={readings[readings.length - 1]} onSubmit={submit} onCancel={home} />
    case 'result':
      return (
        <CheckInResult
          triage={triage}
          onPlan={(i) => go({ name: 'plan', system: triage.systems[i]!.id, mode: 'off' })}
          onHome={home}
        />
      )
    case 'pick':
      return (
        <PickSystem
          mode={flow.mode}
          triage={triage}
          onPick={(system) => go({ name: 'plan', system, mode: flow.mode })}
          onBack={home}
        />
      )
    case 'plan':
      return (
        <PlanView
          system={flow.system}
          mode={flow.mode}
          triage={triage}
          distance={distance}
          onBack={() => go(flow.mode === 'emergency' ? { name: 'pick', mode: 'emergency' } : { name: 'home' })}
        />
      )
    default:
      return (
        <HomeScreen
          triage={triage}
          distance={distance}
          onFine={() => go({ name: 'checkin' })}
          onOff={() => go({ name: 'pick', mode: 'off' })}
          onEmergency={() => go({ name: 'pick', mode: 'emergency' })}
          onSelectSystem={(system) => go({ name: 'plan', system, mode: 'off' })}
        />
      )
  }
}
