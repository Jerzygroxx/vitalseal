import type { KeyboardEvent, ReactNode } from 'react'
import type { SystemId, SystemStatus, Status } from '../../domain/types'
import { statusLabel } from '../components/format'

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

const STATUS_GLYPHS: Record<Status, string> = { green: '✓', amber: '!', red: '✕' }
const NO_DATA_GLYPH = '–'

interface ZoneTone {
  fill: string
  stroke: string
  glyph: string
  /** Clase del punto de la leyenda (el color nunca es el único indicador). */
  dot: string
}

const TONES: Record<Status, ZoneTone> = {
  green: { fill: '#10b981', stroke: '#34d399', glyph: '#a7f3d0', dot: 'bg-emerald-400' },
  amber: { fill: '#f59e0b', stroke: '#fbbf24', glyph: '#fde68a', dot: 'bg-amber-400' },
  red: { fill: '#ef4444', stroke: '#f87171', glyph: '#fecaca', dot: 'bg-red-400' },
}

const NO_DATA_TONE: ZoneTone = {
  fill: '#64748b',
  stroke: '#94a3b8',
  glyph: '#e2e8f0',
  dot: 'bg-slate-500',
}

interface ZonePaint {
  fill: string
  fillOpacity: number
  stroke: string
  strokeWidth: number
}

interface ZoneProps {
  id: SystemId
  system: SystemStatus | undefined
  selected: boolean
  onSelect?: (id: SystemId) => void
  glyphX: number
  glyphY: number
  children: (paint: ZonePaint) => ReactNode
}

/**
 * Zona operable: `role="button"` + teclado (Enter/Espacio).
 * El estado se comunica con color + glifo + texto (aria-label y leyenda).
 */
function Zone({ id, system, selected, onSelect, glyphX, glyphY, children }: ZoneProps) {
  const status = system?.status
  const tone = status === undefined ? NO_DATA_TONE : TONES[status]
  const statusText = status === undefined ? 'No data' : statusLabel(status)
  const glyph = status === undefined ? NO_DATA_GLYPH : STATUS_GLYPHS[status]
  const label = system?.label ?? ZONE_LABELS[id]

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
    >
      {children({
        fill: tone.fill,
        fillOpacity: selected ? 0.35 : 0.22,
        stroke: tone.stroke,
        strokeWidth: selected ? 3 : 1.5,
      })}
      <text
        x={glyphX}
        y={glyphY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={700}
        fill={tone.glyph}
        aria-hidden="true"
      >
        {glyph}
      </text>
    </g>
  )
}

const focusClass = 'group-focus-visible:stroke-white'

/**
 * BodyMap (T-02): esquema original en SVG. Componente tonto: solo recibe
 * `SystemStatus[]` y no conoce el motor de reglas.
 */
export function BodyMap({ systems, selected = null, onSelect }: BodyMapProps) {
  const byId = new Map<SystemId, SystemStatus>(systems.map((system) => [system.id, system]))

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 240 360"
        role="group"
        aria-label="Body systems status map"
        className="mx-auto h-auto w-full max-w-[260px]"
      >
        {/* Halo exterior: radiación / inmune. El trazo transparente amplía el área clicable. */}
        <Zone
          id="radiation"
          system={byId.get('radiation')}
          selected={selected === 'radiation'}
          onSelect={onSelect}
          glyphX={120}
          glyphY={322}
        >
          {(paint) => (
            <>
              <ellipse
                cx={120}
                cy={176}
                rx={112}
                ry={166}
                fill="none"
                stroke={paint.stroke}
                strokeWidth={paint.strokeWidth}
                strokeDasharray="6 6"
                className={focusClass}
              />
              <ellipse
                cx={120}
                cy={176}
                rx={112}
                ry={166}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
              />
            </>
          )}
        </Zone>

        {/* Cabeza: neuro / conductual. */}
        <Zone
          id="neuro"
          system={byId.get('neuro')}
          selected={selected === 'neuro'}
          onSelect={onSelect}
          glyphX={120}
          glyphY={46}
        >
          {(paint) => (
            <circle cx={120} cy={46} r={24} className={focusClass} {...paint} />
          )}
        </Zone>

        {/* Tórax: cardiovascular. */}
        <Zone
          id="cardio"
          system={byId.get('cardio')}
          selected={selected === 'cardio'}
          onSelect={onSelect}
          glyphX={120}
          glyphY={110}
        >
          {(paint) => (
            <rect
              x={86}
              y={80}
              width={68}
              height={60}
              rx={12}
              className={focusClass}
              {...paint}
            />
          )}
        </Zone>

        {/* Abdomen: metabólico. */}
        <Zone
          id="metabolic"
          system={byId.get('metabolic')}
          selected={selected === 'metabolic'}
          onSelect={onSelect}
          glyphX={120}
          glyphY={168}
        >
          {(paint) => (
            <rect
              x={90}
              y={146}
              width={60}
              height={44}
              rx={10}
              className={focusClass}
              {...paint}
            />
          )}
        </Zone>

        {/* Extremidades: musculoesquelético (brazos y piernas). */}
        <Zone
          id="musculoskeletal"
          system={byId.get('musculoskeletal')}
          selected={selected === 'musculoskeletal'}
          onSelect={onSelect}
          glyphX={105}
          glyphY={248}
        >
          {(paint) => (
            <>
              <rect x={56} y={86} width={22} height={74} rx={11} className={focusClass} {...paint} />
              <rect x={162} y={86} width={22} height={74} rx={11} className={focusClass} {...paint} />
              <rect x={94} y={198} width={22} height={100} rx={11} className={focusClass} {...paint} />
              <rect x={124} y={198} width={22} height={100} rx={11} className={focusClass} {...paint} />
            </>
          )}
        </Zone>
      </svg>

      <figcaption className="mt-3">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {ZONE_ORDER.map((id) => {
            const system = byId.get(id)
            const status = system?.status
            const tone = status === undefined ? NO_DATA_TONE : TONES[status]
            const statusText = status === undefined ? 'No data' : statusLabel(status)
            const glyph = status === undefined ? NO_DATA_GLYPH : STATUS_GLYPHS[status]

            return (
              <li key={id} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-slate-950 ${tone.dot}`}
                >
                  {glyph}
                </span>
                <span className="text-slate-300">{system?.label ?? ZONE_LABELS[id]}:</span>
                <span className="font-medium text-slate-100">{statusText}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Body diagram: original schematic SVG by Team Space Exploit (AI-assisted).
        </p>
      </figcaption>
    </figure>
  )
}
