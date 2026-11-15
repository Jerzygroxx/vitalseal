import { describe, expect, it } from 'vitest'
import { SITUATIONS, SYSTEM_ORDER } from './situations'

describe('situations', () => {
  it('covers every body system in both modes', () => {
    expect([...SYSTEM_ORDER].sort()).toEqual(['cardio', 'metabolic', 'musculoskeletal', 'neuro', 'radiation'])
    for (const mode of ['off', 'emergency'] as const) {
      for (const sys of SYSTEM_ORDER) {
        expect(SITUATIONS[mode][sys].title.length).toBeGreaterThan(5)
        expect(SITUATIONS[mode][sys].hint.length).toBeGreaterThan(3)
      }
    }
  })

  it('avoids medical-claim words', () => {
    const text = JSON.stringify(SITUATIONS)
    expect(text).not.toMatch(/diagnos|\btreat\b|\bcure\b|prescri/i)
  })
})
