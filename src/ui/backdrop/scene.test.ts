import { describe, expect, it } from 'vitest'
import { CEILING, fbm, noise3, rollOff } from './planet'
import { composeScene, layerZoom, renderScale } from './scene'

const earthRadius = (distance: 'leo' | 'moon' | 'mars', w: number, h: number): number => {
  const scene = composeScene(distance, w, h)
  const earth = scene.bodies.find((body) => body.kind === 'earth')
  return earth?.r ?? scene.dot?.r ?? 0
}

describe('composeScene', () => {
  it.each([
    [1280, 800],
    [375, 812],
  ])('makes the Earth smaller as the crew gets farther (%i x %i)', (w, h) => {
    const leo = earthRadius('leo', w, h)
    const moon = earthRadius('moon', w, h)
    const mars = earthRadius('mars', w, h)
    expect(leo).toBeGreaterThan(Math.max(w, h))
    expect(moon).toBeLessThan(Math.min(w, h) / 2)
    expect(moon).toBeGreaterThan(mars * 5)
    expect(mars).toBeLessThan(6)
  })

  it('puts the Earth inside the viewing window at Moon and Mars distance', () => {
    const focus = { y: 180, height: 200 }
    const moon = composeScene('moon', 1280, 800, focus).bodies[0]!
    expect(moon.cy - moon.r).toBeGreaterThanOrEqual(focus.y - focus.height / 2)
    expect(moon.cy + moon.r).toBeLessThanOrEqual(focus.y + focus.height / 2)
    expect(composeScene('mars', 1280, 800, focus).dot?.y).toBe(focus.y)
  })

  it('uses a different foreground body per distance', () => {
    expect(composeScene('leo', 1280, 800).bodies.map((b) => b.kind)).toEqual(['earth'])
    expect(composeScene('moon', 1280, 800).bodies.map((b) => b.kind)).toEqual(['earth', 'moon'])
    expect(composeScene('mars', 1280, 800).bodies.map((b) => b.kind)).toEqual(['mars'])
  })
})

describe('renderScale', () => {
  it('never exceeds the device pixel ratio or 2', () => {
    expect(renderScale(320, 480, 1)).toBeLessThanOrEqual(1)
    expect(renderScale(320, 480, 3)).toBeLessThanOrEqual(2)
  })

  it('keeps the canvas within the pixel budget', () => {
    const desktop = renderScale(2560, 1440, 2)
    expect(2560 * 1440 * desktop * desktop).toBeLessThanOrEqual(1_000_001)
    const phone = renderScale(390, 844, 3)
    expect(390 * 844 * phone * phone).toBeLessThanOrEqual(520_001)
  })
})

describe('layerZoom', () => {
  it('leaves the active layer untouched', () => {
    expect(layerZoom('moon', 'moon')).toBe(1)
  })

  it('shrinks nearer scenes and enlarges farther ones', () => {
    expect(layerZoom('leo', 'mars')).toBeLessThan(1)
    expect(layerZoom('mars', 'leo')).toBeGreaterThan(1)
  })
})

describe('procedural noise', () => {
  it('is deterministic and stays within [0, 1)', () => {
    for (let i = 0; i < 200; i++) {
      const x = i * 0.37 - 20
      const value = noise3(x, x * 1.7, -x * 0.3)
      expect(value).toBe(noise3(x, x * 1.7, -x * 0.3))
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
      const fractal = fbm(x, 2, 3, 5)
      expect(fractal).toBeGreaterThanOrEqual(0)
      expect(fractal).toBeLessThan(1)
    }
  })
})

describe('rollOff', () => {
  it('leaves mid-tones alone and never reaches the ceiling', () => {
    expect(rollOff(100)).toBe(100)
    expect(rollOff(260)).toBeGreaterThan(165)
    expect(rollOff(260)).toBeLessThan(CEILING)
    expect(rollOff(5000)).toBeLessThanOrEqual(CEILING)
  })

  it('is monotonic', () => {
    let previous = -1
    for (let value = 0; value <= 600; value += 7) {
      const next = rollOff(value)
      expect(next).toBeGreaterThanOrEqual(previous)
      previous = next
    }
  })
})
