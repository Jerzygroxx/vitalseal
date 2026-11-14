import type { Distance } from '../../domain/types'
import type { BodySpec } from './planet'

/**
 * Scene composition per mission distance (pure, unit-tested).
 *
 * The farther the crew, the smaller the Earth:
 * - LEO:  the Earth fills the frame; its limb arcs through the viewing window.
 * - Moon: the Earth is a mid-sized globe above a lunar horizon.
 * - Mars: the Earth is a pale blue dot above a Martian horizon.
 */

/** The clear "viewing window" of the layout, in canvas pixels. */
export interface Focus {
  /** Vertical centre of the window. */
  y: number
  /** Height of the window. */
  height: number
}

export interface PaleDot {
  /** Canvas pixels. */
  x: number
  y: number
  r: number
}

export interface Scene {
  bodies: BodySpec[]
  /** Where the Earth is, as fractions of the frame (CSS overlays / zoom origin). */
  earthAt: { x: number; y: number }
  /** Earth drawn as a simple dot (Mars only), with its Moon beside it. */
  dot?: PaleDot
}

export const SCENE_ORDER: readonly Distance[] = ['leo', 'moon', 'mars']

/** Fallback when the layout window cannot be measured. */
export function defaultFocus(w: number, h: number): Focus {
  return { y: Math.min(h * 0.26, w * 0.2 + 90), height: Math.min(h * 0.24, 200) }
}

export function composeScene(
  distance: Distance,
  w: number,
  h: number,
  focus: Focus = defaultFocus(w, h),
): Scene {
  const narrow = w < h
  const span = Math.max(w, h * 1.15)
  const earthX = narrow ? 0.76 : 0.79

  if (distance === 'leo') {
    const r = span * 1.5
    const apexX = 0.34
    const apexY = focus.y - focus.height * 0.3
    return {
      earthAt: { x: apexX, y: Math.min(1, (apexY + h * 0.5) / h) },
      bodies: [
        {
          kind: 'earth',
          cx: w * apexX,
          cy: apexY + r,
          r,
          sun: [0.75, 0.25, -0.3],
          yaw: 0.9,
          pitch: 0.35,
        },
      ],
    }
  }

  if (distance === 'moon') {
    const limbR = span * 2.1
    return {
      earthAt: { x: earthX, y: focus.y / h },
      bodies: [
        {
          kind: 'earth',
          cx: w * earthX,
          cy: focus.y,
          r: Math.max(26, Math.min(focus.height * 0.4, w * 0.16)),
          sun: [0.62, 0.3, 0.62],
          yaw: 2.2,
          pitch: 0.25,
        },
        {
          kind: 'moon',
          cx: w * 0.58,
          cy: h * (narrow ? 0.88 : 0.8) + limbR,
          r: limbR,
          sun: [0.62, 0.5, 0.3],
          yaw: 0.4,
          pitch: 0.2,
          gain: 0.62,
        },
      ],
    }
  }

  const limbR = span * 1.9
  return {
    earthAt: { x: earthX, y: focus.y / h },
    dot: { x: w * earthX, y: focus.y, r: Math.max(1.6, Math.min(w, h) * 0.0034) },
    bodies: [
      {
        kind: 'mars',
        cx: w * 0.4,
        cy: h * (narrow ? 0.88 : 0.8) + limbR,
        r: limbR,
        sun: [0.7, 0.42, 0.2],
        yaw: 1.3,
        pitch: -0.2,
        gain: 0.85,
      },
    ],
  }
}

/**
 * Render scale: device pixels per CSS pixel, capped by a pixel budget so the
 * one-off procedural pass stays cheap (smaller budget on phones).
 */
export function renderScale(cssW: number, cssH: number, dpr: number): number {
  const budget = cssW < 768 ? 520_000 : 1_000_000
  const fit = Math.sqrt(budget / Math.max(1, cssW * cssH))
  return Math.max(0.35, Math.min(dpr, 2, fit))
}

/**
 * Zoom applied to a scene layer that is not the active one, so switching
 * distance reads as travelling away from / back towards the Earth.
 */
export function layerZoom(layer: Distance, active: Distance): number {
  const d = SCENE_ORDER.indexOf(layer) - SCENE_ORDER.indexOf(active)
  if (d === 0) return 1
  // A nearer scene than the active one shrinks away; a farther one waits zoomed in.
  return d < 0 ? 0.72 : 1.35
}
