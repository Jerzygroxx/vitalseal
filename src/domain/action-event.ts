import type { Playbook } from './playbooks'
import type { ActionEvent, Distance, Reading } from './types'

/**
 * Builds the sealed event record: the latest vitals (so the record is complete)
 * plus the steps followed with the time each one was marked done.
 */
export function buildEventReading(
  latest: Reading,
  playbook: Playbook,
  doneAt: readonly (string | undefined)[],
  distance: Distance,
  savedAt: string,
): Reading {
  const event: ActionEvent = {
    system: playbook.system,
    status: playbook.status,
    distance,
    title: playbook.title,
    steps: playbook.doNow.map((text, i) => {
      const at = doneAt[i]
      return at ? { text, doneAt: at } : { text }
    }),
    savedAt,
  }
  return {
    ...latest,
    id: `evt-${playbook.system}-${savedAt}`,
    date: savedAt,
    source: 'manual',
    symptoms: [...latest.symptoms],
    event,
  }
}

export const isEventReading = (r: Reading): r is Reading & { event: ActionEvent } => r.event !== undefined
