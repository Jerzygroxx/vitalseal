import type { Status } from '../../domain/types'

/**
 * Visual vocabulary for the three statuses, in one place.
 * Status is never colour-only: each one also has a glyph, a text label
 * (see format.ts) and, in the body map, a distinct fill pattern.
 * Colours come from the theme tokens in index.css.
 */
export interface StatusTone {
  /** CSS colour (theme token) for strokes, icons and borders. */
  color: string
  /** Lighter tint for text on dark surfaces. */
  soft: string
  /** Text glyph used where an icon component is not practical (SVG, legends). */
  glyph: string
  /** Tailwind classes for a tinted chip: border + background + text. */
  chip: string
  /** Tailwind text colour class. */
  text: string
  /** Tailwind background class for solid dots and meter fills. */
  solid: string
}

export const STATUS_TONES: Record<Status, StatusTone> = {
  green: {
    color: 'var(--color-ok)',
    soft: 'var(--color-ok-soft)',
    glyph: '✓',
    chip: 'border-ok/45 bg-ok/12 text-ok-soft',
    text: 'text-ok',
    solid: 'bg-ok',
  },
  amber: {
    color: 'var(--color-watch)',
    soft: 'var(--color-watch-soft)',
    glyph: '!',
    chip: 'border-watch/50 bg-watch/12 text-watch-soft',
    text: 'text-watch',
    solid: 'bg-watch',
  },
  red: {
    color: 'var(--color-alert)',
    soft: 'var(--color-alert-soft)',
    glyph: '✕',
    chip: 'border-alert/55 bg-alert/14 text-alert-soft',
    text: 'text-alert',
    solid: 'bg-alert',
  },
}

export const NO_DATA_TONE: StatusTone = {
  color: 'var(--color-nodata)',
  soft: 'var(--color-fg-muted)',
  glyph: '–',
  chip: 'border-line-strong bg-space-700/60 text-fg-muted',
  text: 'text-fg-dim',
  solid: 'bg-nodata',
}

export function toneOf(status: Status | undefined): StatusTone {
  return status === undefined ? NO_DATA_TONE : STATUS_TONES[status]
}
