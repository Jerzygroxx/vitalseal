import { CircleCheck, OctagonX, TriangleExclamationPoint, type LucideIcon } from 'lucide-react'
import type { Status } from '../../domain/types'
import { STATUS_TONES } from '../components/status-tone'

/** One shape per status (same vocabulary as StatusBadge): circle, triangle, octagon. */
const RING_ICONS: Record<Status, LucideIcon> = {
  green: CircleCheck,
  amber: TriangleExclamationPoint,
  red: OctagonX,
}

const RADIUS = 84
const LENGTH = 2 * Math.PI * RADIUS

/** 60 tick marks around the dial; every fifth one is longer (decorative). */
const TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = (index * Math.PI) / 30
  const inner = index % 5 === 0 ? 62 : 66
  return {
    x1: 100 + inner * Math.cos(angle),
    y1: 100 + inner * Math.sin(angle),
    x2: 100 + 70 * Math.cos(angle),
    y2: 100 + 70 * Math.sin(angle),
    major: index % 5 === 0,
  }
})

export interface StatusRingProps {
  status: Status
  /** 0-100. Drawn as the filled part of the ring and as the big number. */
  score: number
  /** Short caption under the number, e.g. "lowest score". */
  caption: string
  /** Full sentence for screen readers (the ring is exposed as one image). */
  label: string
  className?: string
}

/**
 * Overall status dial for the home screen. Status is carried by the icon shape,
 * the number and the text next to it; colour only reinforces it.
 */
export function StatusRing({ status, score, caption, label, className = '' }: StatusRingProps) {
  const tone = STATUS_TONES[status]
  const Icon = RING_ICONS[status]
  const value = Math.max(0, Math.min(100, Math.round(score)))
  const filled = (value / 100) * LENGTH

  return (
    <div role="img" aria-label={label} className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="size-full" style={{ color: tone.color }}>
        {/* Soft glow behind the dial. */}
        <circle cx={100} cy={100} r={74} fill="currentColor" opacity={0.07} />
        <g stroke="var(--color-ice-300)" strokeLinecap="round">
          {TICKS.map((tick, index) => (
            <line
              key={index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              strokeWidth={tick.major ? 1.4 : 0.8}
              strokeOpacity={tick.major ? 0.5 : 0.22}
            />
          ))}
        </g>
        <circle cx={100} cy={100} r={RADIUS} fill="none" stroke="var(--color-line-strong)" strokeWidth={11} />
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${LENGTH}`}
          transform="rotate(-90 100 100)"
          className="home-ring-arc"
          style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
        />
      </svg>

      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className="size-[14%]" style={{ color: tone.color }} />
        <span className="num mt-[2%] font-display text-[2.5rem] leading-none font-semibold text-fg">
          {value}
        </span>
        <span className="mt-1 text-[0.625rem] leading-3 font-semibold tracking-[0.14em] text-fg-muted uppercase">
          {caption}
        </span>
      </div>
    </div>
  )
}
