import { useEffect, useRef, useState } from 'react'
import type { Distance } from '../../domain/types'
import { drawStars, renderBodies } from './planet'
import { SCENE_ORDER, composeScene, layerZoom, renderScale, type Focus } from './scene'

export interface SpaceBackdropProps {
  /** Mission distance: decides how big the Earth is in the frame. */
  distance: Distance
}

interface Frame {
  /** Canvas size in device pixels. */
  w: number
  h: number
  scale: number
  focus: Focus | undefined
  /** Changes whenever the canvases must be repainted. */
  key: string
}

/** Marks the clear "viewing window" in the layout (see App.tsx). */
export const BACKDROP_FOCUS_ATTR = 'data-backdrop-focus'

function measure(): Frame {
  const cssW = window.innerWidth
  const cssH = window.innerHeight
  const scale = renderScale(cssW, cssH, window.devicePixelRatio || 1)
  const el = document.querySelector(`[${BACKDROP_FOCUS_ATTR}]`)
  let focus: Focus | undefined
  if (el) {
    const rect = el.getBoundingClientRect()
    if (rect.height > 0) {
      focus = {
        y: Math.round((rect.top + window.scrollY + rect.height / 2) * scale),
        height: Math.round(rect.height * scale),
      }
    }
  }
  const w = Math.round(cssW * scale)
  const h = Math.round(cssH * scale)
  return { w, h, scale, focus, key: `${w}x${h}@${focus?.y ?? 0}/${focus?.height ?? 0}` }
}

/** Deterministic positions for the few stars that twinkle (CSS only). */
const TWINKLES = [
  [8, 9, 0], [19, 22, 2.1], [31, 6, 4.2], [44, 15, 1.3], [57, 8, 3.4], [66, 24, 0.6],
  [73, 5, 5.1], [86, 17, 2.7], [93, 30, 1.9], [12, 34, 3.9], [52, 31, 4.8], [38, 40, 0.9],
] as const

const ZOOM_ORIGIN: Record<Distance, string> = {
  leo: '34% 120%',
  moon: '79% 26%',
  mars: '79% 26%',
}

/**
 * Full-viewport illustrated backdrop: star field + one procedurally rendered
 * scene per mission distance. Purely decorative (aria-hidden, no pointer
 * events). Each scene is painted once into a canvas; after that everything is
 * compositor-only CSS (cross-fade, zoom, slow drift), so there is no per-frame
 * JavaScript. All motion is disabled under prefers-reduced-motion.
 */
export function SpaceBackdrop({ distance }: SpaceBackdropProps) {
  const starsRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRefs = useRef<Partial<Record<Distance, HTMLCanvasElement | null>>>({})
  const [frame, setFrame] = useState<Frame | null>(null)
  /** frame.key for which each scene has been painted. */
  const [painted, setPainted] = useState<Partial<Record<Distance, string>>>({})

  // Measure on mount and on meaningful resizes (ignore mobile URL-bar jitter).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let last = measure()
    // A hidden page or background tab can report a 0x0 viewport: painting then throws and
    // would take the whole app down, so wait for a real size instead.
    setFrame(last.w > 0 && last.h > 0 ? last : null)
    const onResize = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => {
        const next = measure()
        if (next.w <= 0 || next.h <= 0) return
        const sameWidth = next.w === last.w
        const smallHeightChange = Math.abs(next.h - last.h) < 140 * next.scale
        if (sameWidth && smallHeightChange && next.focus?.y === last.focus?.y) return
        last = next
        setFrame(next)
      }, 250)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [])

  // Stars: one cheap draw per frame size.
  useEffect(() => {
    const canvas = starsRef.current
    if (!frame || !canvas) return
    canvas.width = frame.w
    canvas.height = frame.h
    drawStars(canvas)
  }, [frame])

  // Paint the active scene if it has not been painted for this frame yet.
  useEffect(() => {
    const canvas = canvasRefs.current[distance]
    if (!frame || !canvas || painted[distance] === frame.key) return
    canvas.width = frame.w
    canvas.height = frame.h
    const scene = composeScene(distance, frame.w, frame.h, frame.focus)
    const key = frame.key
    return renderBodies(canvas, scene.bodies, {
      after: (ctx) => {
        const dot = scene.dot
        if (!dot) return
        // The Earth from Mars: a pale blue dot, with the Moon as a fainter speck.
        const glow = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r * 9)
        glow.addColorStop(0, 'rgba(150,200,255,0.5)')
        glow.addColorStop(0.25, 'rgba(120,180,255,0.16)')
        glow.addColorStop(1, 'rgba(120,180,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.r * 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgb(188,222,255)'
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(214,214,208,0.8)'
        ctx.beginPath()
        ctx.arc(dot.x + dot.r * 5.5, dot.y - dot.r * 2.2, dot.r * 0.42, 0, Math.PI * 2)
        ctx.fill()
      },
      onDone: () => setPainted((previous) => ({ ...previous, [distance]: key })),
    })
  }, [distance, frame, painted])

  const earthAt = frame
    ? composeScene(distance, frame.w, frame.h, frame.focus).earthAt
    : { x: 0.79, y: 0.26 }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-space-950">
      <canvas ref={starsRef} className="absolute inset-0 h-full w-full object-cover" />

      {TWINKLES.map(([x, y, delay]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-[3px] rounded-full bg-ice-100 motion-safe:animate-twinkle"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
        />
      ))}

      {SCENE_ORDER.map((id) => {
        const active = id === distance
        const ready = frame !== null && painted[id] === frame.key
        return (
          <div
            key={id}
            className="absolute inset-0 transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-[opacity,transform]"
            style={{
              opacity: active && ready ? 1 : 0,
              transform: `scale(${layerZoom(id, distance)})`,
              transformOrigin: ZOOM_ORIGIN[id],
            }}
          >
            <canvas
              ref={(element) => {
                canvasRefs.current[id] = element
              }}
              className={`absolute inset-0 h-full w-full object-cover ${
                id === 'leo' ? 'origin-[34%_100%] motion-safe:animate-drift' : ''
              }`}
            />
          </div>
        )
      })}

      {/* Reticle so the pale blue dot is not lost among the stars. */}
      <div
        className="absolute size-14 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000"
        style={{
          left: `${earthAt.x * 100}%`,
          top: `${earthAt.y * 100}%`,
          opacity: distance === 'mars' ? 0.75 : 0,
        }}
      >
        <svg viewBox="0 0 56 56" className="size-full text-ice-300 motion-safe:animate-breathe">
          <circle cx="28" cy="28" r="17" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          <path d="M28 2v8M28 46v8M2 28h8M46 28h8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Scrim: keeps the viewing window clear and calms everything under the content. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(2_4_10/0.5)_0,rgb(2_4_10/0)_12rem,rgb(2_4_10/0)_22rem,rgb(2_4_10/0.5)_34rem)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_55%,rgb(2_4_10/0.6))]" />
    </div>
  )
}
