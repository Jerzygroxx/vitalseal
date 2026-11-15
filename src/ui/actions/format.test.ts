import { describe, expect, it } from 'vitest'
import { countDone, formatClock, progressLabel } from './format'

/** ISO string for a local wall-clock time, so the test never depends on the TZ. */
function localIso(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
): string {
  return new Date(year, month - 1, day, hours, minutes, seconds).toISOString()
}

describe('progressLabel', () => {
  it('says nothing is done when the count is zero', () => {
    expect(progressLabel(0, 4)).toBe('No steps done yet')
  })

  it('counts the finished steps while some remain', () => {
    expect(progressLabel(2, 4)).toBe('2 of 4 steps done')
    expect(progressLabel(1, 3)).toBe('1 of 3 steps done')
  })

  it('switches to the all-done wording when every step is finished', () => {
    expect(progressLabel(4, 4)).toBe('All 4 steps done')
    expect(progressLabel(1, 1)).toBe('All 1 steps done')
  })

  it('prefers "no steps" over "all steps" for an empty list', () => {
    expect(progressLabel(0, 0)).toBe('No steps done yet')
  })
})

describe('formatClock', () => {
  it('prints the local time as 24 h HH:MM:SS', () => {
    expect(formatClock(localIso(2026, 11, 14, 14, 32, 5))).toBe('14:32:05')
  })

  it('zero-pads every field', () => {
    expect(formatClock(localIso(2026, 11, 14, 4, 5, 9))).toBe('04:05:09')
    expect(formatClock(localIso(2026, 11, 15, 0, 0, 0))).toBe('00:00:00')
    expect(formatClock(localIso(2026, 11, 15, 23, 59, 59))).toBe('23:59:59')
  })

  it('returns the placeholder for an unparseable ISO string', () => {
    expect(formatClock('not-a-date')).toBe('--:--:--')
    expect(formatClock('')).toBe('--:--:--')
    expect(formatClock('2026-13-45T99:99:99Z')).toBe('--:--:--')
  })
})

describe('countDone', () => {
  it('returns zero for no steps and for an empty list', () => {
    expect(countDone([])).toBe(0)
    expect(countDone([undefined, undefined])).toBe(0)
  })

  it('counts only the steps that have a timestamp', () => {
    const done = [localIso(2026, 11, 14, 9, 0, 0), undefined, localIso(2026, 11, 14, 9, 2, 0)]
    expect(countDone(done)).toBe(2)
  })

  it('counts every step when all are done', () => {
    const done = [localIso(2026, 11, 14, 9, 0, 0), localIso(2026, 11, 14, 9, 1, 0)]
    expect(countDone(done)).toBe(2)
  })
})
