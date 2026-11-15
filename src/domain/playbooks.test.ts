import { describe, expect, it } from 'vitest'
import { ALL_PLAYBOOK_SYSTEMS, PLAYBOOK_NOTE, playbookFor } from './playbooks'
import type { Distance } from './types'

const DISTANCES: Distance[] = ['leo', 'moon', 'mars']

function everyText(): string {
  const out: string[] = [PLAYBOOK_NOTE]
  for (const sys of ALL_PLAYBOOK_SYSTEMS) {
    for (const st of ['amber', 'red'] as const) {
      const p = playbookFor(sys, st, 'mars')!
      out.push(p.title, p.recheck, ...p.doNow, ...p.record, ...Object.values(p.escalate))
    }
  }
  return out.join('\n')
}

describe('playbooks', () => {
  it('returns nothing for a green system', () => {
    for (const sys of ALL_PLAYBOOK_SYSTEMS) expect(playbookFor(sys, 'green', 'mars')).toBeNull()
  })

  it('every system has an amber and a red playbook with 3 to 6 ordered steps', () => {
    for (const sys of ALL_PLAYBOOK_SYSTEMS) {
      for (const st of ['amber', 'red'] as const) {
        const p = playbookFor(sys, st, 'moon')!
        expect(p.system).toBe(sys)
        expect(p.doNow.length).toBeGreaterThanOrEqual(3)
        expect(p.doNow.length).toBeLessThanOrEqual(6)
        expect(p.record.length).toBeGreaterThanOrEqual(3)
        expect(p.recheck.length).toBeGreaterThan(10)
      }
    }
  })

  it('red playbooks start by stopping and asking a crewmate to stay', () => {
    for (const sys of ALL_PLAYBOOK_SYSTEMS) {
      expect(playbookFor(sys, 'red', 'mars')!.doNow[0]).toMatch(/stop what you are doing/i)
    }
  })

  it('has escalation text for every distance and mentions the 22 minute delay for Mars', () => {
    const p = playbookFor('cardio', 'red', 'mars')!
    for (const d of DISTANCES) expect(p.escalate[d].length).toBeGreaterThan(10)
    expect(p.escalate.mars).toMatch(/22 minutes/)
    expect(p.escalate.leo).toMatch(/real-time/)
  })

  it('links only official https sources', () => {
    for (const sys of ALL_PLAYBOOK_SYSTEMS) {
      const p = playbookFor(sys, 'amber', 'mars')!
      expect(p.sources.length).toBeGreaterThan(0)
      for (const url of p.sources) expect(url).toMatch(/^https:\/\/(www\.nasa\.gov|www\.asc-csa\.gc\.ca)\//)
    }
  })

  it('stays at first-aid level: no drug names, no doses, no medical-claim words', () => {
    const text = everyText()
    expect(text).not.toMatch(/diagnos|\btreat\b|\bcure\b|prescri/i)
    expect(text).not.toMatch(/ibuprofen|aspirin|acetaminophen|paracetamol|antibiotic|morphine|\b\d+\s?mg\b/i)
  })

  it('always carries the not-validated note', () => {
    expect(PLAYBOOK_NOTE).toMatch(/not validated by a flight surgeon/i)
    expect(playbookFor('radiation', 'red', 'leo')!.note).toBe(PLAYBOOK_NOTE)
  })
})
