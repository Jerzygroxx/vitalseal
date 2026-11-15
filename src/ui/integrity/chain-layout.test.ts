import { describe, expect, it } from 'vitest'
import type { ReportVerification } from '../../crypto/verify'
import { chainModel, ellipseArc, entryCountOf, nodeState } from './chain-layout'

const intact: ReportVerification = {
  valid: true,
  chain: { valid: true },
  headMatches: true,
  signatureValid: true,
  problems: [],
}

const brokenAt = (index: number): ReportVerification => ({
  valid: false,
  chain: { valid: false, brokenAt: index, reason: 'hash-mismatch' },
  headMatches: true,
  signatureValid: true,
  problems: ['x'],
})

describe('nodeState', () => {
  it('is pending before any verification', () => {
    expect(nodeState(3, null)).toBe('pending')
  })

  it('seals every node of a valid chain', () => {
    expect(nodeState(0, intact)).toBe('sealed')
    expect(nodeState(20, intact)).toBe('sealed')
  })

  it('marks the break and distrusts everything after it', () => {
    const verification = brokenAt(10)
    expect(nodeState(9, verification)).toBe('sealed')
    expect(nodeState(10, verification)).toBe('broken')
    expect(nodeState(11, verification)).toBe('untrusted')
  })

  it('distrusts all nodes when the chain is invalid without a position', () => {
    const malformed: ReportVerification = { ...intact, valid: false, chain: { valid: false } }
    expect(nodeState(0, malformed)).toBe('untrusted')
  })
})

describe('chainModel', () => {
  it('draws one node per entry when the count is known', () => {
    const model = chainModel(intact, 21)
    expect(model.nodes).toHaveLength(21)
    expect(model.total).toBe(21)
    expect(model.estimated).toBe(false)
    expect(model.nodes[0]?.index).toBe(0)
  })

  it('falls back to an illustrative chain without a count', () => {
    const model = chainModel(brokenAt(10))
    expect(model.estimated).toBe(true)
    expect(model.nodes.some((node) => node.state === 'broken')).toBe(true)
  })

  it('shows the most recent entries when there are too many', () => {
    const model = chainModel(intact, 100, 40)
    expect(model.nodes).toHaveLength(40)
    expect(model.nodes[0]?.index).toBe(60)
    expect(model.nodes[39]?.index).toBe(99)
  })

  it('moves the window back so the break stays visible', () => {
    const model = chainModel(brokenAt(12), 100, 40)
    expect(model.nodes).toHaveLength(40)
    expect(model.nodes.find((node) => node.state === 'broken')?.index).toBe(12)
  })

  it('handles an empty record', () => {
    expect(chainModel(intact, 0).nodes).toHaveLength(0)
  })
})

describe('ellipseArc', () => {
  it('returns the requested number of points on the ellipse', () => {
    const points = ellipseArc(21, 100, 50, 80, 30, 116, 308)
    expect(points).toHaveLength(21)
    for (const point of points) {
      const value = ((point.x - 100) / 80) ** 2 + ((point.y - 50) / 30) ** 2
      expect(value).toBeCloseTo(1, 5)
    }
  })

  it('spaces points evenly by arc length', () => {
    const points = ellipseArc(12, 0, 0, 300, 100, 116, 308)
    const gaps = points.slice(1).map((point, i) => Math.hypot(point.x - points[i]!.x, point.y - points[i]!.y))
    const min = Math.min(...gaps)
    const max = Math.max(...gaps)
    // Chords of equal arcs differ slightly with curvature, never by much.
    expect(max / min).toBeLessThan(1.25)
  })

  it('handles zero and one point', () => {
    expect(ellipseArc(0, 0, 0, 1, 1, 0, 90)).toEqual([])
    expect(ellipseArc(1, 0, 0, 1, 1, 0, 90)).toHaveLength(1)
  })
})

describe('entryCountOf', () => {
  it('counts entries in a report', () => {
    expect(entryCountOf('{"entries":[1,2,3]}')).toBe(3)
  })

  it('returns undefined for anything unreadable', () => {
    expect(entryCountOf('not json')).toBeUndefined()
    expect(entryCountOf('null')).toBeUndefined()
    expect(entryCountOf('{"entries":"x"}')).toBeUndefined()
  })
})
