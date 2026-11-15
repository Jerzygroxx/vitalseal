import { create } from 'zustand'

/**
 * Progress of the quick-response checklists, per playbook (`system:status`).
 * Each step keeps the ISO time it was marked done. Changing a step after the
 * record was saved clears `saved`, because the saved record no longer matches.
 */
interface ActionState {
  doneAt: Record<string, (string | undefined)[]>
  saved: Record<string, boolean>
  toggleStep: (key: string, index: number, length: number, nowIso?: string) => void
  markSaved: (key: string) => void
  reset: () => void
}

export const playbookKey = (system: string, status: string) => `${system}:${status}`

export const useActionStore = create<ActionState>((set, get) => ({
  doneAt: {},
  saved: {},

  toggleStep: (key, index, length, nowIso = new Date().toISOString()) => {
    const current = get().doneAt[key] ?? Array.from({ length }, () => undefined)
    const next = current.slice(0, length)
    while (next.length < length) next.push(undefined)
    next[index] = next[index] ? undefined : nowIso
    set({ doneAt: { ...get().doneAt, [key]: next }, saved: { ...get().saved, [key]: false } })
  },

  markSaved: (key) => set({ saved: { ...get().saved, [key]: true } }),

  reset: () => set({ doneAt: {}, saved: {} }),
}))
