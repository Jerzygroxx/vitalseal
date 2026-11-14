import type { ReportVerification } from '../../crypto/verify'
import { chainModel, ellipseArc, type ChainModel, type NodeState, type Point } from './chain-layout'

export interface ChainOrbitProps {
  verification: ReportVerification | null
  /** Number of stored entries. Without it the orbit is only illustrative. */
  entryCount?: number
}

interface Dims {
  width: number
  height: number
  cx: number
  cy: number
  rx: number
  ry: number
}

const WIDE: Dims = { width: 720, height: 292, cx: 360, cy: 130, rx: 318, ry: 98 }
const COMPACT: Dims = { width: 360, height: 336, cx: 180, cy: 150, rx: 150, ry: 116 }

const LINK_STYLE: Record<NodeState, { stroke: string; dash?: string; width: number }> = {
  sealed: { stroke: 'var(--color-ice-400)', width: 1.6 },
  pending: { stroke: 'var(--color-fg-dim)', dash: '2 4', width: 1.2 },
  untrusted: { stroke: 'var(--color-watch)', dash: '2 4', width: 1.2 },
  broken: { stroke: 'var(--color-alert)', width: 2.2 },
}

function Node({ point, state, head }: { point: Point; state: NodeState; head: boolean }) {
  const { x, y } = point
  if (state === 'broken') {
    return (
      <g className="motion-safe:animate-breathe">
        <rect
          x={x - 9.5}
          y={y - 9.5}
          width={19}
          height={19}
          rx={3}
          transform={`rotate(45 ${x} ${y})`}
          fill="var(--color-space-950)"
          stroke="var(--color-alert)"
          strokeWidth={2.2}
        />
        <path
          d={`M${x - 4.5} ${y - 4.5}L${x + 4.5} ${y + 4.5}M${x + 4.5} ${y - 4.5}L${x - 4.5} ${y + 4.5}`}
          stroke="var(--color-alert-soft)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (state === 'sealed') {
    return (
      <g>
        {head && (
          <circle cx={x} cy={y} r={12} fill="none" stroke="var(--color-ember-300)" strokeWidth={1.4} />
        )}
        <circle cx={x} cy={y} r={6.5} fill="var(--color-space-950)" stroke="var(--color-ice-300)" strokeWidth={1.6} />
        <circle cx={x} cy={y} r={2.6} fill="var(--color-ice-200)" />
      </g>
    )
  }
  return (
    <circle
      cx={x}
      cy={y}
      r={6}
      fill="var(--color-space-950)"
      stroke={state === 'untrusted' ? 'var(--color-watch)' : 'var(--color-fg-dim)'}
      strokeWidth={1.5}
      strokeDasharray="2.2 2.6"
    />
  )
}

function OrbitSvg({ model, dims, className }: { model: ChainModel; dims: Dims; className: string }) {
  const { nodes } = model
  const points = ellipseArc(nodes.length, dims.cx, dims.cy, dims.rx, dims.ry, 116, 308)
  const last = nodes.length - 1

  const labelAt = (point: Point, offset: number): Point => {
    const nx = (point.x - dims.cx) / (dims.rx * dims.rx)
    const ny = (point.y - dims.cy) / (dims.ry * dims.ry)
    const length = Math.hypot(nx, ny) || 1
    return { x: point.x + (nx / length) * offset, y: point.y + (ny / length) * offset }
  }

  return (
    <svg viewBox={`0 0 ${dims.width} ${dims.height}`} aria-hidden="true" className={className}>
      {/* Guide orbit. */}
      <ellipse
        cx={dims.cx}
        cy={dims.cy}
        rx={dims.rx}
        ry={dims.ry}
        fill="none"
        stroke="var(--color-ice-300)"
        strokeOpacity={0.14}
        strokeDasharray="1 7"
        strokeLinecap="round"
      />

      {points.map((point, i) => {
        if (i === 0) return null
        const from = points[i - 1]!
        const state = nodes[i]!.state
        const style = LINK_STYLE[state]
        if (state === 'broken') {
          // Broken link: two stubs with a visible gap between them.
          const dx = point.x - from.x
          const dy = point.y - from.y
          return (
            <g key={i} stroke={style.stroke} strokeWidth={style.width} strokeLinecap="round">
              <line x1={from.x} y1={from.y} x2={from.x + dx * 0.3} y2={from.y + dy * 0.3} />
              <line x1={point.x - dx * 0.3} y1={point.y - dy * 0.3} x2={point.x} y2={point.y} />
            </g>
          )
        }
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={point.x}
            y2={point.y}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeDasharray={style.dash}
            strokeLinecap="round"
          />
        )
      })}

      {points.map((point, i) => {
        const node = nodes[i]!
        const broken = node.state === 'broken'
        const labelled = broken || node.index % 5 === 0 || i === last
        const label = labelAt(point, broken ? 25 : 20)
        return (
          <g key={node.index}>
            <Node point={point} state={node.state} head={i === last} />
            {labelled && (
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={broken ? 14 : 12}
                fontWeight={broken ? 700 : 500}
                fontFamily="var(--font-mono)"
                fill={broken ? 'var(--color-alert-soft)' : 'var(--color-fg-muted)'}
              >
                #{node.index}
              </text>
            )}
          </g>
        )
      })}

      {points.length > 1 && (
        <g
          fontSize={11}
          fontWeight={600}
          letterSpacing="0.14em"
          fill="var(--color-fg-muted)"
          textAnchor="middle"
        >
          <text x={points[0]!.x + 6} y={points[0]!.y + 34}>
            {nodes[0]!.index === 0 ? 'FIRST' : 'EARLIER'}
          </text>
          <text x={points[last]!.x - 6} y={points[last]!.y + 34} fill="var(--color-ember-300)">
            HEAD
          </text>
        </g>
      )}
    </svg>
  )
}

function centerCopy(model: ChainModel, verification: ReportVerification | null) {
  if (verification === null) return { line: 'Not verified yet', tone: 'text-fg-muted' }
  if (model.brokenAt !== undefined) {
    return { line: `Chain breaks at entry #${model.brokenAt}`, tone: 'text-alert-soft' }
  }
  if (!verification.chain.valid) return { line: 'Chain could not be read', tone: 'text-alert-soft' }
  if (!verification.valid) return { line: 'Links hold, seal does not match', tone: 'text-alert-soft' }
  return { line: 'Every link holds', tone: 'text-ok-soft' }
}

/**
 * "Seal orbit": one node per stored entry, linked in order around an orbit.
 * A manipulation shows as a broken link, a marked node and an untrusted tail.
 * The drawing is decorative (aria-hidden); the same facts are given as text.
 */
export function ChainOrbit({ verification, entryCount }: ChainOrbitProps) {
  const model = chainModel(verification, entryCount)
  const copy = centerCopy(model, verification)
  const broken = model.brokenAt !== undefined
  const windowed = model.nodes.length < model.total

  return (
    <figure className="@container m-0">
      <div className="relative">
        <OrbitSvg model={model} dims={WIDE} className="h-auto w-full @max-xl:hidden" />
        <OrbitSvg model={model} dims={COMPACT} className="mx-auto h-auto w-full max-w-sm @xl:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-[44.6%] flex -translate-y-1/2 flex-col items-center px-16 text-center">
          <p className="eyebrow">Hash chain</p>
          {model.estimated ? (
            <p className="mt-1 text-sm text-fg-muted">Illustrative chain</p>
          ) : (
            <p className="mt-0.5 text-sm text-fg-muted">
              <span className="num font-mono text-2xl font-semibold text-fg">{model.total}</span>{' '}
              {model.total === 1 ? 'entry' : 'entries'}
            </p>
          )}
          <p className={`mt-0.5 text-sm font-semibold ${copy.tone}`}>{copy.line}</p>
        </div>
      </div>

      <figcaption className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="var(--color-ice-300)" strokeWidth="1.6" />
            <circle cx="8" cy="8" r="2.2" fill="var(--color-ice-200)" />
          </svg>
          Linked entry
        </span>
        {broken && (
          <>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1.5" transform="rotate(45 8 8)" fill="none" stroke="var(--color-alert)" strokeWidth="1.6" />
                <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke="var(--color-alert-soft)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              First inconsistent entry
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                <circle cx="8" cy="8" r="5.5" fill="none" stroke="var(--color-watch)" strokeWidth="1.5" strokeDasharray="2.2 2.4" />
              </svg>
              Not trustworthy after the break
            </span>
          </>
        )}
        {windowed && (
          <span>
            Showing entries #{model.nodes[0]?.index}–#{model.nodes[model.nodes.length - 1]?.index}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
