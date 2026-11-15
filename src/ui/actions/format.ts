/**
 * Pure text helpers for the action plan card (T-05). No React, no domain logic:
 * they only turn step counts and ISO timestamps into short English labels.
 */

/** "No steps done yet" / "2 of 4 steps done" / "All 4 steps done". */
export function progressLabel(done: number, total: number): string {
  if (done === 0) return 'No steps done yet'
  if (done === total) return `All ${total} steps done`
  return `${done} of ${total} steps done`
}

/**
 * Local wall-clock time for a step marked done: "HH:MM:SS" (24 h, zero-padded).
 * An unparseable ISO string renders "--:--:--" so the card never shows "NaN".
 */
export function formatClock(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--:--:--'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/** How many steps carry a "done" timestamp (undefined means not done yet). */
export function countDone(doneAt: (string | undefined)[]): number {
  let done = 0
  for (const at of doneAt) {
    if (at !== undefined) done += 1
  }
  return done
}
