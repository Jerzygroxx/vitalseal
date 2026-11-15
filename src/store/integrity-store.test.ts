import { beforeEach, describe, expect, it } from 'vitest'
import { generateSynthetic } from '../data/synthetic'
import { useIntegrityStore } from './integrity-store'

const readings = generateSynthetic({ days: 12 })
const s = () => useIntegrityStore.getState()

beforeEach(async () => {
  await s().init(readings)
})

describe('integrity store (demo flow)', () => {
  it('arranca íntegro y con código de sello', () => {
    expect(s().verification?.valid).toBe(true)
    expect(s().code).toMatch(/^VS1-0012-/)
  })
  for (const kind of ['alter', 'reorder', 'delete'] as const) {
    it(`simulateTamper(${kind}) => el panel lo detecta; restore => vuelve a válido`, async () => {
      await s().simulateTamper(kind)
      expect(s().tampered).toBe(kind)
      expect(s().verification?.valid).toBe(false)
      expect(s().verification?.problems.length).toBeGreaterThan(0)
      await s().restore()
      expect(s().verification?.valid).toBe(true)
      expect(s().tampered).toBeNull()
    })
  }
  it('añadir una lectura mantiene la integridad y cambia el sello', async () => {
    const before = s().code
    await s().addReading({ ...readings[0]!, id: 'new-1', date: '2026-12-01T00:00:00Z' })
    expect(s().verification?.valid).toBe(true)
    expect(s().code).not.toBe(before)
    expect(s().code).toMatch(/^VS1-0013-/)
  })
})
