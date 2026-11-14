import type { ReportVerification } from '../../crypto/verify'

/**
 * Geometry and node states for the "seal orbit" (hash-chain visualisation).
 * Pure functions: they only describe what the verifier already reported.
 */

export type NodeState =
  /** Entry verified and linked to its predecessor. */
  | 'sealed'
  /** First inconsistent entry reported by the verifier. */
  | 'broken'
  /** After a break (or in a malformed report) nothing downstream can be trusted. */
  | 'untrusted'
  /** Not verified yet. */
  | 'pending'

export interface ChainNode {
  /** Entry index in the chain (0 = first entry). */
  index: number
  state: NodeState
}

export interface ChainModel {
  nodes: ChainNode[]
  /** Total entries in the record (may exceed `nodes.length` when windowed). */
  total: number
  /** True when the entry count was not provided and the chain is only illustrative. */
  estimated: boolean
  brokenAt: number | undefined
}

/** Most nodes the orbit can show while staying legible on a phone. */
export const MAX_NODES = 40

export function nodeState(index: number, verification: ReportVerification | null): NodeState {
  if (verification === null) return 'pending'
  const { valid, brokenAt } = verification.chain
  if (valid) return 'sealed'
  if (brokenAt === undefined) return 'untrusted'
  if (index < brokenAt) return 'sealed'
  return index === brokenAt ? 'broken' : 'untrusted'
}

/**
 * Builds the list of nodes to draw. If there are more entries than fit, shows
 * the most recent ones, moving the window back if needed so the break is visible.
 */
export function chainModel(
  verification: ReportVerification | null,
  entryCount?: number,
  maxNodes: number = MAX_NODES,
): ChainModel {
  const brokenAt = verification?.chain.brokenAt
  const known = entryCount !== undefined && Number.isInteger(entryCount) && entryCount >= 0
  const total = known ? entryCount : brokenAt !== undefined ? brokenAt + 5 : 16
  const shown = Math.min(total, maxNodes)
  let start = total - shown
  if (brokenAt !== undefined && brokenAt < start + 2) start = Math.max(0, brokenAt - 2)

  const nodes: ChainNode[] = []
  for (let index = start; index < Math.min(total, start + shown); index++) {
    nodes.push({ index, state: nodeState(index, verification) })
  }
  return { nodes, total, estimated: !known, brokenAt }
}

export interface Point {
  x: number
  y: number
}

/**
 * `count` points evenly spaced by arc length along an open elliptical arc.
 * Angles in degrees, clockwise on screen, 0 = right, 90 = bottom.
 */
export function ellipseArc(
  count: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  spanDeg: number,
): Point[] {
  if (count <= 0) return []
  const at = (t: number): Point => {
    const angle = ((startDeg + spanDeg * t) * Math.PI) / 180
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }
  }
  if (count === 1) return [at(0.5)]

  const samples = 360
  const lengths = [0]
  let previous = at(0)
  for (let i = 1; i <= samples; i++) {
    const point = at(i / samples)
    lengths.push(lengths[i - 1]! + Math.hypot(point.x - previous.x, point.y - previous.y))
    previous = point
  }
  const totalLength = lengths[samples]!

  const points: Point[] = []
  let cursor = 0
  for (let n = 0; n < count; n++) {
    const target = (totalLength * n) / (count - 1)
    while (cursor < samples - 1 && lengths[cursor + 1]! < target) cursor++
    const segment = lengths[cursor + 1]! - lengths[cursor]!
    const within = segment > 0 ? (target - lengths[cursor]!) / segment : 0
    points.push(at((cursor + within) / samples))
  }
  return points
}

/** Number of entries in a pasted report, or undefined if it cannot be read. */
export function entryCountOf(reportJson: string): number | undefined {
  try {
    const parsed: unknown = JSON.parse(reportJson)
    if (typeof parsed !== 'object' || parsed === null) return undefined
    const entries = (parsed as { entries?: unknown }).entries
    return Array.isArray(entries) ? entries.length : undefined
  } catch {
    return undefined
  }
}
