import { beforeEach, describe, expect, it } from 'vitest'
import { playbookKey, useActionStore } from './action-store'

const key = playbookKey('cardio', 'red')

describe('action store', () => {
  beforeEach(() => useActionStore.getState().reset())

  it('marks a step with the given time and unmarks it on the second toggle', () => {
    const s = useActionStore.getState()
    s.toggleStep(key, 1, 4, '2026-11-15T14:00:00.000Z')
    expect(useActionStore.getState().doneAt[key]).toEqual([undefined, '2026-11-15T14:00:00.000Z', undefined, undefined])
    s.toggleStep(key, 1, 4, '2026-11-15T14:00:09.000Z')
    expect(useActionStore.getState().doneAt[key]![1]).toBeUndefined()
  })

  it('keeps the time of earlier steps when another one is marked', () => {
    const s = useActionStore.getState()
    s.toggleStep(key, 0, 3, '2026-11-15T14:00:00.000Z')
    s.toggleStep(key, 2, 3, '2026-11-15T14:01:00.000Z')
    expect(useActionStore.getState().doneAt[key]).toEqual(['2026-11-15T14:00:00.000Z', undefined, '2026-11-15T14:01:00.000Z'])
  })

  it('clears the saved flag when a step changes after saving', () => {
    const s = useActionStore.getState()
    s.toggleStep(key, 0, 3, '2026-11-15T14:00:00.000Z')
    s.markSaved(key)
    expect(useActionStore.getState().saved[key]).toBe(true)
    s.toggleStep(key, 1, 3, '2026-11-15T14:00:30.000Z')
    expect(useActionStore.getState().saved[key]).toBe(false)
  })

  it('keeps separate progress per playbook and resets everything', () => {
    const s = useActionStore.getState()
    s.toggleStep(playbookKey('cardio', 'red'), 0, 3, '2026-11-15T14:00:00.000Z')
    s.toggleStep(playbookKey('neuro', 'amber'), 0, 3, '2026-11-15T14:00:05.000Z')
    expect(Object.keys(useActionStore.getState().doneAt).length).toBe(2)
    s.reset()
    expect(useActionStore.getState().doneAt).toEqual({})
  })
})
