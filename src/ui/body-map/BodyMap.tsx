import { useId, type KeyboardEvent, type ReactNode, type SVGAttributes } from 'react'
import type { SystemId, SystemStatus, Status } from '../../domain/types'
import { statusLabel } from '../components/format'
import { toneOf } from '../components/status-tone'

export interface BodyMapProps {
  systems: SystemStatus[]
  selected?: SystemId | null
  onSelect?: (id: SystemId) => void
}

const ZONE_ORDER: SystemId[] = ['neuro', 'cardio', 'metabolic', 'musculoskeletal', 'radiation']

/** Etiqueta de respaldo si el sistema no viene en `systems`. */
const ZONE_LABELS: Record<SystemId, string> = {
  neuro: 'Neuro / behavioral',
  cardio: 'Cardiovascular',
  metabolic: 'Metabolic',
  musculoskeletal: 'Musculoskeletal',
  radiation: 'Radiation / immune',
}

/** Dónde vive cada zona en la figura (texto de la leyenda). */
const ZONE_PLACES: Record<SystemId, string> = {
  neuro: 'Head',
  cardio: 'Chest',
  metabolic: 'Core',
  musculoskeletal: 'Limbs',
  radiation: 'Outer halo',
}

type PatternKey = Status | 'none'

type ShapeProps = SVGAttributes<SVGElement>
/** Geometría de una zona: se pinta varias veces (relleno, trama, foco). */
type Geometry = (props: ShapeProps) => ReactNode

interface ZoneProps {
  id: SystemId
  system: SystemStatus | undefined
  selected: boolean
  onSelect?: (id: SystemId) => void
  /** Centro del distintivo con el glifo de estado. */
  glyphX: number
  glyphY: number
  patternPrefix: string
  /** Zona de solo trazo (halo): sin relleno ni trama. */
  outline?: boolean
  geometry: Geometry
  /** Detalle decorativo dentro de la zona (hereda `color` del estado). */
  detail?: ReactNode
}

/**
 * Zona operable: `role="button"` + teclado (Enter/Espacio).
 * El estado se comunica con color + trama + glifo + texto (aria-label y leyenda).
 */
function Zone({
  id,
  system,
  selected,
  onSelect,
  glyphX,
  glyphY,
  patternPrefix,
  outline = false,
  geometry,
  detail,
}: ZoneProps) {
  const status = system?.status
  const tone = toneOf(status)
  const statusText = status === undefined ? 'No data' : statusLabel(status)
  const label = system?.label ?? ZONE_LABELS[id]
  const pattern: PatternKey = status ?? 'none'

  const activate = () => onSelect?.(id)

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate()
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${statusText}`}
      aria-pressed={selected}
      onClick={activate}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer outline-none"
      style={{
        color: tone.color,
        filter: selected ? `drop-shadow(0 0 7px ${tone.color})` : undefined,
      }}
    >
      {outline ? (
        <>
          {geometry({
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: selected ? 3 : 1.6,
            strokeDasharray: '2 8',
            strokeLinecap: 'round',
            className:
              'motion-safe:animate-halo group-hover:[stroke-width:3] group-focus-visible:stroke-white group-focus-visible:[stroke-width:3.5]',
          })}
          {/* Trazo transparente: amplía el área clicable del halo. */}
          {geometry({ fill: 'none', stroke: 'transparent', strokeWidth: 22 })}
        </>
      ) : (
        <>
          {geometry({
            fill: 'currentColor',
            fillOpacity: selected ? 0.3 : 0.14,
            className: 'transition-[fill-opacity] group-hover:[fill-opacity:0.3]',
          })}
          {geometry({ fill: `url(#${patternPrefix}-${pattern})`, pointerEvents: 'none' })}
          {geometry({
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: selected ? 2.6 : 1.4,
            strokeLinejoin: 'round',
            className: 'group-focus-visible:stroke-white group-focus-visible:[stroke-width:3]',
          })}
        </>
      )}
      {detail}
      <g aria-hidden="true" pointerEvents="none">
        <circle
          cx={glyphX}
          cy={glyphY}
          r={10.5}
          fill="var(--color-space-950)"
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <text
          x={glyphX}
          y={glyphY + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={700}
          fill={tone.soft}
        >
          {tone.glyph}
        </text>
      </g>
    </g>
  )
}

/**
 * Segmento de extremidad: cápsula cónica entre dos articulaciones
 * (radio `ra` en el origen, `rb` en el extremo).
 */
function segment(ax: number, ay: number, ra: number, bx: number, by: number, rb: number): Geometry {
  const length = Math.hypot(bx - ax, by - ay) || 1
  const nx = -(by - ay) / length
  const ny = (bx - ax) / length
  const f = (value: number) => value.toFixed(2)
  const d =
    `M${f(ax + nx * ra)} ${f(ay + ny * ra)}` +
    `L${f(bx + nx * rb)} ${f(by + ny * rb)}` +
    `A${rb} ${rb} 0 0 1 ${f(bx - nx * rb)} ${f(by - ny * rb)}` +
    `L${f(ax - nx * ra)} ${f(ay - ny * ra)}` +
    `A${ra} ${ra} 0 0 1 ${f(ax + nx * ra)} ${f(ay + ny * ra)}Z`
  return (props) => <path d={d} {...props} />
}

/** Un lado del cuerpo (izquierda del espectador); el otro se obtiene por espejo. */
const SIDE: Geometry[] = [
  segment(107, 124, 11.5, 95, 181, 8), // upper arm
  segment(95, 187, 7.5, 89, 243, 5.5), // forearm
  segment(88.5, 251, 6, 87, 267, 4.5), // hand
  segment(155, 287, 13.5, 152, 364, 9.5), // thigh
  segment(152, 374, 9, 151, 444, 6), // shin
  (props) => <path d="M140 452H162Q166 452 166 456V464H133Q133 454 140 452Z" {...props} />, // foot
]

const JOINTS: [number, number][] = [
  [107, 122],
  [95, 184],
  [89, 247],
  [155, 285],
  [152, 369],
  [151, 448],
]

/** Etiquetas numeradas del plano: [zona, x, y, origen x, origen y]. */
const CALLOUTS: [SystemId, number, number, number, number][] = [
  ['neuro', 252, 38, 202, 50],
  ['cardio', 44, 150, 122, 150],
  ['metabolic', 296, 216, 200, 216],
  ['musculoskeletal', 44, 330, 143, 330],
  ['radiation', 92, 86, 66, 60],
]

const MIRROR = 'matrix(-1 0 0 1 340 0)'

const limbsGeometry: Geometry = (props) => (
  <>
    <g>{SIDE.map((shape, index) => <g key={index}>{shape(props)}</g>)}</g>
    <g transform={MIRROR}>{SIDE.map((shape, index) => <g key={index}>{shape(props)}</g>)}</g>
  </>
)

const headGeometry: Geometry = (props) => (
  <path
    d="M170 24C191 24 203 39 203 59C203 78 192 93 170 93C148 93 137 78 137 59C137 39 149 24 170 24Z"
    {...props}
  />
)

const chestGeometry: Geometry = (props) => (
  <path
    d="M134 106H206L226 114Q231 117 229 125L217 172Q215 180 205 180H135Q125 180 123 172L111 125Q109 117 114 114Z"
    {...props}
  />
)

const coreGeometry: Geometry = (props) => (
  <path d="M135 186H205L199 239Q198 248 188 248H152Q142 248 141 239Z" {...props} />
)

const haloGeometry: Geometry = (props) => <ellipse cx={170} cy={238} rx={164} ry={234} {...props} />

/** Marcas cada 15° sobre el halo (decorativas). */
const HALO_TICKS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * Math.PI) / 12
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x1: 170 + 152 * cos,
    y1: 238 + 222 * sin,
    x2: 170 + (index % 6 === 0 ? 142 : 147) * cos,
    y2: 238 + (index % 6 === 0 ? 212 : 217) * sin,
  }
})

/**
 * BodyMap (T-02): figura técnica original en SVG, tipo plano de ingeniería.
 * Componente tonto: solo recibe `SystemStatus[]` y no conoce el motor de reglas.
 */
export function BodyMap({ systems, selected = null, onSelect }: BodyMapProps) {
  const byId = new Map<SystemId, SystemStatus>(systems.map((system) => [system.id, system]))
  const prefix = `bm${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const zone = (id: SystemId) => ({
    id,
    system: byId.get(id),
    selected: selected === id,
    onSelect,
    patternPrefix: prefix,
  })

  return (
    <figure className="m-0">
      <svg
        viewBox="-12 -8 364 492"
        role="group"
        aria-label="Body systems status map"
        className="mx-auto h-auto w-full max-w-[380px]"
      >
        <defs>
          {/* Tramas por estado: refuerzan el color para quien no lo distingue. */}
          <pattern id={`${prefix}-green`} width="6" height="6" patternUnits="userSpaceOnUse" />
          <pattern
            id={`${prefix}-amber`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-watch)" strokeWidth="1.6" opacity="0.5" />
          </pattern>
          <pattern id={`${prefix}-red`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 0L7 7M7 0L0 7" stroke="var(--color-alert)" strokeWidth="1.2" opacity="0.6" />
          </pattern>
          <pattern id={`${prefix}-none`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.9" fill="var(--color-nodata)" opacity="0.6" />
          </pattern>
          <pattern id={`${prefix}-grid`} width="17" height="17" patternUnits="userSpaceOnUse">
            <circle cx="8.5" cy="8.5" r="0.7" fill="var(--color-ice-300)" opacity="0.28" />
          </pattern>
          <clipPath id={`${prefix}-clip`}>
            <ellipse cx={170} cy={238} rx={150} ry={220} />
          </clipPath>
          <linearGradient id={`${prefix}-scan`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-ice-300)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-ice-300)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--color-ice-300)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Plano de fondo: retícula, eje y líneas de referencia (decorativo). */}
        <g aria-hidden="true" pointerEvents="none">
          <ellipse cx={170} cy={238} rx={150} ry={220} fill={`url(#${prefix}-grid)`} />
          <ellipse
            cx={170}
            cy={238}
            rx={150}
            ry={220}
            fill="none"
            stroke="var(--color-ice-300)"
            strokeOpacity={0.18}
          />
          <g stroke="var(--color-ice-300)" strokeOpacity={0.3} strokeWidth={0.8}>
            <line x1={170} y1={8} x2={170} y2={470} strokeDasharray="10 4 2 4" />
            <line x1={62} y1={120} x2={278} y2={120} strokeDasharray="3 5" />
            <line x1={70} y1={284} x2={270} y2={284} strokeDasharray="3 5" />
            <line x1={104} y1={370} x2={236} y2={370} strokeDasharray="3 5" />
            {HALO_TICKS.map((tick, index) => (
              <line key={index} {...tick} strokeOpacity={0.5} />
            ))}
          </g>
          {/* Piezas neutras: cuello y pelvis. */}
          <g fill="var(--color-space-700)" stroke="var(--color-fg-dim)" strokeWidth={1.1} strokeOpacity={0.8}>
            <path d="M160 93H180L184 105H156Z" />
            <ellipse cx={170} cy={101} rx={19} ry={4.5} />
            <path d="M144 254H196L203 276Q170 292 137 276Z" />
            <path d="M170 256V284" strokeDasharray="2 3" />
          </g>
          {/* Líneas de referencia numeradas (mismo número que la leyenda). */}
          {CALLOUTS.map(([id, x, y, fromX, fromY]) => (
            <g key={id}>
              <line
                x1={fromX}
                y1={fromY}
                x2={x}
                y2={y}
                stroke="var(--color-ice-300)"
                strokeOpacity={0.55}
                strokeWidth={0.9}
              />
              <circle cx={fromX} cy={fromY} r={1.8} fill="var(--color-ice-300)" />
              <circle
                cx={x}
                cy={y}
                r={9.5}
                fill="var(--color-space-900)"
                stroke="var(--color-ice-300)"
                strokeOpacity={0.7}
              />
              <text
                x={x}
                y={y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={600}
                fontFamily="var(--font-mono)"
                fill="var(--color-ice-100)"
              >
                {ZONE_ORDER.indexOf(id) + 1}
              </text>
            </g>
          ))}
          {/* Marcas de registro en las esquinas. */}
          <path
            d="M-6 8V-2H4M336 -2H346V8M346 468V478H336M4 478H-6V468"
            fill="none"
            stroke="var(--color-ice-300)"
            strokeOpacity={0.5}
          />
          <g clipPath={`url(#${prefix}-clip)`}>
            <rect
              x={20}
              y={18}
              width={300}
              height={2}
              fill={`url(#${prefix}-scan)`}
              opacity={0}
              className="motion-safe:animate-scan"
              style={{ ['--scan-travel' as string]: '440px' }}
            />
          </g>
        </g>

        {/* Halo exterior: radiación / inmune. */}
        <Zone {...zone('radiation')} glyphX={287} glyphY={74} outline geometry={haloGeometry} />

        {/* Extremidades: musculoesquelético (brazos y piernas). */}
        <Zone
          {...zone('musculoskeletal')}
          glyphX={153.5}
          glyphY={322}
          geometry={limbsGeometry}
          detail={
            <g aria-hidden="true" pointerEvents="none">
              {[undefined, MIRROR].map((transform) => (
                <g key={transform ?? 'left'} transform={transform}>
                  {JOINTS.map(([x, y]) => (
                    <g key={`${x}-${y}`}>
                      <circle cx={x} cy={y} r={5} fill="var(--color-space-950)" stroke="currentColor" strokeWidth={1.2} />
                      <circle cx={x} cy={y} r={1.4} fill="currentColor" />
                    </g>
                  ))}
                </g>
              ))}
            </g>
          }
        />

        {/* Cabeza: neuro / conductual. Casco sin rostro. */}
        <Zone
          {...zone('neuro')}
          glyphX={170}
          glyphY={44}
          geometry={headGeometry}
          detail={
            <g aria-hidden="true" pointerEvents="none" fill="none" stroke="currentColor" strokeWidth={1}>
              <path d="M144 62Q170 54 196 62V70Q170 82 144 70Z" strokeOpacity={0.75} />
              <path d="M150 66H190" strokeOpacity={0.4} strokeDasharray="2 3" />
            </g>
          }
        />

        {/* Tórax: cardiovascular. */}
        <Zone
          {...zone('cardio')}
          glyphX={170}
          glyphY={130}
          geometry={chestGeometry}
          detail={
            <g aria-hidden="true" pointerEvents="none" fill="none" stroke="currentColor">
              <path d="M130 118H210" strokeOpacity={0.45} strokeWidth={1} />
              <path
                d="M128 160H148L153 150L160 170L166 154L170 160H212"
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeOpacity={0.9}
              />
            </g>
          }
        />

        {/* Abdomen: metabólico. */}
        <Zone
          {...zone('metabolic')}
          glyphX={170}
          glyphY={216}
          geometry={coreGeometry}
          detail={
            <g aria-hidden="true" pointerEvents="none" fill="none" stroke="currentColor" strokeOpacity={0.5}>
              <path d="M141 200Q170 208 199 200" />
              <path d="M143 234Q170 226 197 234" />
            </g>
          }
        />
      </svg>

      <figcaption className="mt-4">
        <ul className="grid gap-1.5 text-sm">
          {ZONE_ORDER.map((id) => {
            const system = byId.get(id)
            const status = system?.status
            const tone = toneOf(status)
            const statusText = status === undefined ? 'No data' : statusLabel(status)
            const active = selected === id

            return (
              <li
                key={id}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 ${
                  active ? 'border-line-strong bg-space-700/70' : 'border-transparent'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${tone.chip}`}
                >
                  {tone.glyph}
                </span>
                <span aria-hidden="true" className="num w-4 font-mono text-xs text-ice-200">
                  {ZONE_ORDER.indexOf(id) + 1}
                </span>
                <span className="min-w-0 flex-1 text-fg-muted">
                  {system?.label ?? ZONE_LABELS[id]}
                  <span className="ml-2 text-xs text-fg-dim">{ZONE_PLACES[id]}</span>
                </span>
                <span className={`text-xs font-semibold tracking-[0.1em] uppercase ${tone.text}`}>
                  {statusText}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-fg-dim">
          Select a zone on the figure to see its detail. Fill pattern, glyph and label repeat the
          status shown by colour.
        </p>
      </figcaption>
    </figure>
  )
}
