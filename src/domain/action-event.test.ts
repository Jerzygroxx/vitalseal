import { describe, expect, it } from 'vitest'
import { appendEntry, buildChain, verifyChain } from '../crypto/chain'
import { generateSigningKeys, signReport } from '../crypto/sign'
import { verifyReport } from '../crypto/verify'
import { buildEventReading, isEventReading } from './action-event'
import { playbookFor } from './playbooks'
import { generateSynthetic } from '../data/synthetic'

const readings = generateSynthetic()
const latest = readings[readings.length - 1]!
const playbook = playbookFor('cardio', 'red', 'mars')!

describe('event record', () => {
  it('keeps the latest vitals and records each step with its time', () => {
    const doneAt = ['2026-11-15T14:00:05.000Z', undefined, '2026-11-15T14:01:10.000Z']
    const r = buildEventReading(latest, playbook, doneAt, 'mars', '2026-11-15T14:02:00.000Z')
    expect(r.heartRate).toBe(latest.heartRate)
    expect(r.spo2).toBe(latest.spo2)
    expect(isEventReading(r)).toBe(true)
    expect(r.event!.steps.length).toBe(playbook.doNow.length)
    expect(r.event!.steps[0]).toEqual({ text: playbook.doNow[0], doneAt: doneAt[0] })
    expect(r.event!.steps[1]).toEqual({ text: playbook.doNow[1] })
    expect(r.event!.savedAt).toBe('2026-11-15T14:02:00.000Z')
    expect(r.date).toBe('2026-11-15T14:02:00.000Z')
  })

  it('does not mutate the latest reading', () => {
    const before = JSON.stringify(latest)
    buildEventReading(latest, playbook, [], 'leo', '2026-11-15T14:02:00.000Z')
    expect(JSON.stringify(latest)).toBe(before)
  })

  it('enters the hash chain and the signed report, and tampering with it is detected', async () => {
    const base = await buildChain(readings)
    const ev = buildEventReading(latest, playbook, ['2026-11-15T14:00:05.000Z'], 'mars', '2026-11-15T14:02:00.000Z')
    const chain = await appendEntry(base, ev, ev.date)
    expect((await verifyChain(chain)).valid).toBe(true)

    const keys = await generateSigningKeys()
    const report = await signReport(chain, keys)
    expect((await verifyReport(report)).valid).toBe(true)

    // an attacker edits the time a step was done
    const forged = structuredClone(report)
    forged.entries[forged.entries.length - 1]!.reading.event!.steps[0]!.doneAt = '2026-11-15T13:00:00.000Z'
    const v = await verifyReport(forged)
    expect(v.valid).toBe(false)
  })
})
