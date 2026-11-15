import { create } from 'zustand'
import type { FlowMode } from '../domain/situations'
import type { SystemId } from '../domain/types'

export type Tab = 'home' | 'details' | 'integrity' | 'ground'

/** Where the guided assistant is inside the Home tab. */
export type Flow =
  | { name: 'home' }
  | { name: 'checkin' }
  | { name: 'result' }
  | { name: 'pick'; mode: FlowMode }
  | { name: 'plan'; system: SystemId; mode: FlowMode }

interface UiState {
  tab: Tab
  flow: Flow
  setTab: (tab: Tab) => void
  /** Opens a step of the guided flow and shows the Home tab. */
  go: (flow: Flow) => void
}

export const useUiStore = create<UiState>((set) => ({
  tab: 'home',
  flow: { name: 'home' },
  setTab: (tab) => set(tab === 'home' ? { tab, flow: { name: 'home' } } : { tab }),
  go: (flow) => set({ tab: 'home', flow }),
}))
