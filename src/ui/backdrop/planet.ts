/**
 * Procedural planet renderer (Canvas 2D, no assets, no dependencies).
 *
 * Every pixel of every body is computed here from seeded value noise: there is
 * no photo, texture, map or traced outline anywhere. The "continents" are
 * fractal noise thresholds, so they do not match any real geography.
 *
 * The renderer runs once per scene and per viewport size, in small time slices
 * so it never blocks input, and it waits while the tab is hidden. After that
 * the result is a static bitmap: there is no per-frame JavaScript.
 */

export type BodyKind = 'earth' | 'moon' | 'mars'
export type Vec3 = readonly [number, number, number]

export interface BodySpec {
  kind: BodyKind
  /** Centre and radius in canvas pixels (the centre may be far off-canvas). */
  cx: number
  cy: number
  r: number
  /** Direction towards the sun in view space (x right, y up, z towards the viewer). */
  sun: Vec3
  /** Which part of the procedural surface faces the camera (radians). */
  yaw: number
  pitch: number
  /** Overall brightness multiplier (keeps foreground limbs unobtrusive). */
  gain?: number
}

/* ------------------------------------------------------------------ noise */

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const P = new Uint8Array(512)
const V = new Float32Array(256)
;(() => {
  const rand = mulberry32(20261114)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    base[i] = i
    V[i] = rand()
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const t = base[i]!
    base[i] = base[j]!
    base[j] = t
  }
  for (let i = 0; i < 512; i++) P[i] = base[i & 255]!
})()

/** Lattice hash in [0, 1). */
function hash3(ix: number, iy: number, iz: number): number {
  return V[P[P[P[ix & 255]! + (iy & 255)]! + (iz & 255)]!]!
}

/** Trilinear value noise in [0, 1). */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)
  const X = xi & 255
  const Y = yi & 255
  const Z = zi & 255
  const X1 = (X + 1) & 255
  const Y1 = (Y + 1) & 255
  const Z1 = (Z + 1) & 255
  const a = P[X]!
  const b = P[X1]!
  const aa = P[a + Y]!
  const ab = P[a + Y1]!
  const ba = P[b + Y]!
  const bb = P[b + Y1]!
  const c000 = V[P[aa + Z]!]!
  const c100 = V[P[ba + Z]!]!
  const c010 = V[P[ab + Z]!]!
  const c110 = V[P[bb + Z]!]!
  const c001 = V[P[aa + Z1]!]!
  const c101 = V[P[ba + Z1]!]!
  const c011 = V[P[ab + Z1]!]!
  const c111 = V[P[bb + Z1]!]!
  const x00 = c000 + (c100 - c000) * u
  const x10 = c010 + (c110 - c010) * u
  const x01 = c001 + (c101 - c001) * u
  const x11 = c011 + (c111 - c011) * u
  const y0 = x00 + (x10 - x00) * v
  const y1 = x01 + (x11 - x01) * v
  return y0 + (y1 - y0) * w
}

/** Fractal Brownian motion, normalised to [0, 1). */
export function fbm(x: number, y: number, z: number, octaves: number): number {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x, y, z)
    norm += amp
    amp *= 0.5
    x = x * 2.03 + 17.1
    y = y * 2.03 + 9.2
    z = z * 2.03 + 3.7
  }
  return sum / norm
}

function smooth(e0: number, e1: number, x: number): number {
  const t = x <= e0 ? 0 : x >= e1 ? 1 : (x - e0) / (e1 - e0)
  return t * t * (3 - 2 * t)
}

function normalize(v: Vec3): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

/* ---------------------------------------------------------------- shaders */

// Shader output registers (module-level to avoid per-pixel allocations).
let oR = 0
let oG = 0
let oB = 0

interface ShadeCtx {
  /** Noise octaves for the main relief (more when the body is large on screen). */
  oct: number
  /** Body radius in pixels: converts object-space distances to pixels. */
  r: number
  /** Feature-frequency multiplier: finer geography when the globe is huge on screen. */
  k: number
  /** Sun direction in object space (for crater relief). */
  sx: number
  sy: number
  sz: number
}

/**
 * Crater relief term for one lattice scale. Returns a signed brightness
 * offset: inner walls facing the sun brighten, the opposite walls darken.
 */
function craters(px: number, py: number, pz: number, g: number, c: ShadeCtx): number {
  const qx = px * g
  const qy = py * g
  const qz = pz * g
  const ix = Math.floor(qx)
  const iy = Math.floor(qy)
  const iz = Math.floor(qz)
  if (hash3(ix + 7, iy + 3, iz + 11) > 0.5) return 0
  const rad = 0.16 + 0.26 * hash3(ix + 19, iy + 5, iz + 2)
  const ox = qx - (ix + 0.5 + (hash3(ix + 1, iy, iz) - 0.5) * 0.36)
  const oy = qy - (iy + 0.5 + (hash3(ix, iy + 1, iz) - 0.5) * 0.36)
  const oz = qz - (iz + 0.5 + (hash3(ix, iy, iz + 1) - 0.5) * 0.36)
  const len = Math.hypot(ox, oy, oz)
  const d = len / rad
  if (d >= 1.3 || len === 0) return 0
  const facing = (ox * c.sx + oy * c.sy + oz * c.sz) / len
  if (d < 0.9) return -facing * 0.55 * smooth(0.15, 0.9, d) - 0.08
  return facing * 0.4 * (1 - smooth(0.9, 1.3, d))
}

function shadeEarth(px: number, py: number, pz: number, ndl: number, nz: number, c: ShadeCtx) {
  const k = c.k
  const h = fbm(px * 1.6 * k + 11.3, py * 1.6 * k + 4.7, pz * 1.6 * k + 7.1, c.oct)
  const land = smooth(0.508, 0.528, h)
  const lit = smooth(-0.08, 0.36, ndl)
  const night = 1 - smooth(-0.1, 0.1, ndl)

  let r: number
  let g: number
  let b: number

  // Ocean: deep navy to a lighter shelf near the coasts.
  const shelf = smooth(0.38, 0.51, h)
  const s2 = shelf * shelf
  r = 4 + 14 * s2
  g = 18 + 50 * s2
  b = 46 + 70 * s2

  if (land > 0) {
    const m = fbm(px * 2.3 * k + 31, py * 2.3 * k + 17, pz * 2.3 * k + 5, 3)
    const veg = smooth(0.42, 0.6, m)
    let lr = 150 + (40 - 150) * veg
    let lg = 126 + (78 - 126) * veg
    let lb = 86 + (42 - 86) * veg
    const rock = smooth(0.58, 0.68, h)
    lr += (104 - lr) * rock
    lg += (90 - lg) * rock
    lb += (78 - lb) * rock
    r += (lr - r) * land
    g += (lg - g) * land
    b += (lb - b) * land
  }

  // Polar ice.
  const ice = smooth(0.8, 0.9, Math.abs(py) + (h - 0.5) * 0.5)
  if (ice > 0) {
    r += (224 - r) * ice
    g += (234 - g) * ice
    b += (244 - b) * ice
  }

  // Sunlight, with a faint blue aerial haze on the day side.
  const light = 0.035 + lit * 1.08
  r = r * light + 8 * lit
  g = g * light + 18 * lit
  b = b * light + 38 * lit

  // Ocean glint.
  if (land < 1 && lit > 0) {
    const spec = Math.pow(Math.max(0, ndl * 0.6 + nz * 0.8 - 0.35), 6) * (1 - land) * 60
    r += spec
    g += spec
    b += spec
  }

  // Clouds: banded along latitude, warped by the terrain field.
  const wx = (h - 0.5) * 1.6
  const cn = fbm(px * 2.4 * k + wx + 50, py * 4.2 * k + 60, pz * 2.4 * k - wx + 70, Math.max(3, c.oct - 1))
  const cloud = smooth(0.545, 0.72, cn) * 0.92
  if (cloud > 0) {
    const twilight = Math.exp(-(((ndl - 0.05) / 0.13) ** 2))
    const cl = 0.035 + 0.965 * lit
    const cr = 232 * cl + 70 * twilight * lit
    const cg = 238 * cl + 22 * twilight * lit
    const cb = 246 * cl
    r += (cr - r) * cloud
    g += (cg - g) * cloud
    b += (cb - b) * cloud
  }

  // City lights on the night side: clustered on land, denser near coasts.
  if (night > 0.01 && land > 0.4) {
    const pop = fbm(px * 6.5 * k + 91, py * 6.5 * k + 23, pz * 6.5 * k + 57, 4)
    const coast = 1 - Math.min(1, Math.abs(h - 0.54) * 22)
    const density = Math.min(0.9, smooth(0.44, 0.62, pop) * 0.75 + coast * 0.5)
    const grid = Math.min(700, Math.max(30, c.r / 4.6))
    const qx = px * grid
    const qy = py * grid
    const qz = pz * grid
    const ix = Math.floor(qx)
    const iy = Math.floor(qy)
    const iz = Math.floor(qz)
    let lights = density * density * 0.09
    if (hash3(ix, iy, iz) < density * 0.6) {
      const d = Math.hypot(qx - ix - 0.5, qy - iy - 0.5, qz - iz - 0.5) * 1.7
      if (d < 1) lights += (0.5 + 0.7 * hash3(ix + 13, iy + 7, iz + 3)) * (1 - d) ** 1.3
    }
    lights *= night * land * (1 - cloud * 0.6)
    r += 255 * lights
    g += 184 * lights
    b += 102 * lights
  }

  // Atmosphere: a bright blue rim on the lit limb, a faint one at night.
  // (The rim is kept proportionally thinner when the globe is huge on screen.)
  const fres = (1 - nz) ** (3 + c.r / 420)
  const air = fres * (0.05 + 0.95 * smooth(-0.3, 0.3, ndl))
  const haze = Math.min(1, air * 0.9)
  r += (84 * air - r) * haze
  g += (164 * air - g) * haze
  b += (255 * air - b) * haze

  oR = r
  oG = g
  oB = b
}

function shadeMoon(px: number, py: number, pz: number, ndl: number, _nz: number, c: ShadeCtx) {
  const a = fbm(px * 1.3 + 3.1, py * 1.3 + 8.4, pz * 1.3 + 1.9, c.oct)
  const mare = smooth(0.5, 0.6, a)
  const fine = fbm(px * 22 + 5, py * 22 + 1, pz * 22 + 9, 3)
  let v = (150 - 74 * mare) * (0.82 + 0.36 * fine)
  let relief = 0
  const g1 = Math.max(6, c.r / 110)
  relief += craters(px, py, pz, g1, c)
  relief += craters(px + 0.37, py + 0.11, pz + 0.53, g1 * 2.7, c) * 0.7
  relief += craters(px + 0.71, py + 0.29, pz + 0.13, g1 * 6.5, c) * 0.45
  const lit = smooth(-0.04, 0.3, ndl)
  v *= Math.max(0, 0.012 + lit * (1 + relief))
  oR = v
  oG = v * 0.99
  oB = v * 0.97
}

function shadeMars(px: number, py: number, pz: number, ndl: number, nz: number, c: ShadeCtx) {
  const a = fbm(px * 1.5 + 6.2, py * 1.5 + 2.8, pz * 1.5 + 4.4, c.oct)
  const dark = smooth(0.5, 0.62, a)
  const dust = smooth(0.48, 0.7, fbm(px * 5 + 14, py * 5 + 6, pz * 5 + 21, 3)) * 0.5
  let r = 206 + (112 - 206) * dark
  let g = 104 + (52 - 104) * dark
  let b = 54 + (34 - 54) * dark
  r += (230 - r) * dust
  g += (142 - g) * dust
  b += (84 - b) * dust
  const cap = smooth(0.88, 0.95, Math.abs(py) + (a - 0.5) * 0.3)
  r += (232 - r) * cap
  g += (226 - g) * cap
  b += (220 - b) * cap
  const g1 = Math.max(6, c.r / 150)
  const relief =
    craters(px, py, pz, g1, c) * 0.3 + craters(px + 0.41, py + 0.17, pz + 0.63, g1 * 3.1, c) * 0.2
  const lit = smooth(-0.06, 0.34, ndl)
  const light = Math.max(0, 0.012 + lit * (1 + relief))
  const air = (1 - nz) ** 3 * lit * 0.5
  oR = r * light + 214 * air
  oG = g * light + 160 * air
  oB = b * light + 122 * air
}

const SHADERS: Record<BodyKind, typeof shadeEarth> = {
  earth: shadeEarth,
  moon: shadeMoon,
  mars: shadeMars,
}

/** Outer atmospheric glow: [r, g, b, strength]. The Moon has none. */
const GLOW: Record<BodyKind, readonly [number, number, number, number]> = {
  earth: [96, 172, 255, 0.9],
  mars: [214, 160, 122, 0.35],
  moon: [0, 0, 0, 0],
}

/* --------------------------------------------------------------- renderer */

/** Highlight roll-off: linear up to KNEE, then approaches CEILING without reaching it. */
const KNEE = 165
export const CEILING = 224

export function rollOff(value: number): number {
  if (value <= KNEE) return value
  return KNEE + (CEILING - KNEE) * (1 - Math.exp(-(value - KNEE) / (CEILING - KNEE)))
}

export interface RenderOptions {
  /** Called once the bitmap has been painted on the canvas. */
  onDone?: () => void
  /** Extra 2D drawing after the per-pixel pass (same context). */
  after?: (ctx: CanvasRenderingContext2D) => void
  /** Time budget per slice in ms. */
  sliceMs?: number
}

/**
 * Paints `bodies` (back to front) on the canvas. Work is split into short
 * slices and pauses while the document is hidden. Returns a cancel function.
 */
export function renderBodies(
  canvas: HTMLCanvasElement,
  bodies: readonly BodySpec[],
  options: RenderOptions = {},
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const w = canvas.width
  const h = canvas.height
  const image = ctx.createImageData(w, h)
  const data = image.data
  const sliceMs = options.sliceMs ?? 10
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined

  let bodyIndex = 0
  let row = -1
  let rowEnd = -1
  // Per-body derived values.
  let spec!: BodySpec
  let shade!: typeof shadeEarth
  let sun!: [number, number, number]
  let m!: number[]
  let sc!: ShadeCtx
  let glowPx = 0
  let gain = 1

  const setupBody = () => {
    spec = bodies[bodyIndex]!
    shade = SHADERS[spec.kind]
    sun = normalize(spec.sun)
    const cyw = Math.cos(spec.yaw)
    const syw = Math.sin(spec.yaw)
    const cp = Math.cos(spec.pitch)
    const sp = Math.sin(spec.pitch)
    // object = Rx(pitch) * Ry(yaw) * view
    m = [cyw, 0, syw, sp * syw, cp, -sp * cyw, -cp * syw, sp, cp * cyw]
    sc = {
      oct: Math.min(7, Math.max(3, Math.round(Math.log2(spec.r / 9)))),
      r: spec.r,
      k: Math.min(3.2, Math.max(1, spec.r / 560)),
      sx: m[0]! * sun[0] + m[1]! * sun[1] + m[2]! * sun[2],
      sy: m[3]! * sun[0] + m[4]! * sun[1] + m[5]! * sun[2],
      sz: m[6]! * sun[0] + m[7]! * sun[1] + m[8]! * sun[2],
    }
    glowPx = GLOW[spec.kind][3] > 0 ? Math.min(46, Math.max(5, spec.r * 0.035)) : 0
    gain = spec.gain ?? 1
    const reach = spec.r + glowPx * 4 + 1
    row = Math.max(0, Math.floor(spec.cy - reach))
    rowEnd = Math.min(h - 1, Math.ceil(spec.cy + reach))
  }

  const renderRow = (y: number) => {
    const { cx, cy, r } = spec
    const reach = r + glowPx * 4 + 1
    const dy = y + 0.5 - cy
    const half2 = reach * reach - dy * dy
    if (half2 <= 0) return
    const half = Math.sqrt(half2)
    const x0 = Math.max(0, Math.floor(cx - half))
    const x1 = Math.min(w - 1, Math.ceil(cx + half))
    const glow = GLOW[spec.kind]
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx
      const dist = Math.sqrt(dx * dx + dy * dy)
      let a: number
      if (dist <= r) {
        const nx = dx / r
        const ny = -dy / r
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
        const ndl = nx * sun[0] + ny * sun[1] + nz * sun[2]
        shade(
          m[0]! * nx + m[1]! * ny + m[2]! * nz,
          m[3]! * nx + m[4]! * ny + m[5]! * nz,
          m[6]! * nx + m[7]! * ny + m[8]! * nz,
          ndl,
          nz,
          sc,
        )
        a = 1
      } else if (glowPx > 0) {
        const edge = (dx * sun[0] - dy * sun[1]) / dist
        const day = 0.06 + 0.94 * smooth(-0.3, 0.3, edge)
        const fall = Math.exp(-(dist - r) / glowPx)
        a = fall * day * glow[3]
        if (a < 0.004) continue
        oR = glow[0]
        oG = glow[1]
        oB = glow[2]
      } else {
        // 1px anti-aliased edge for airless bodies.
        a = 1 - (dist - r)
        if (a <= 0) continue
        const k = 1 / dist
        const nx = dx * k
        const ny = -dy * k
        const ndl = nx * sun[0] + ny * sun[1]
        shade(
          m[0]! * nx + m[1]! * ny,
          m[3]! * nx + m[4]! * ny,
          m[6]! * nx + m[7]! * ny,
          ndl,
          0,
          sc,
        )
      }
      const i = (y * w + x) * 4
      // Soft shoulder: highlights roll off instead of clipping to white, which
      // also bounds how bright the backdrop can get behind the glass panels.
      const r8 = rollOff(oR) * gain
      const g8 = rollOff(oG) * gain
      const b8 = rollOff(oB) * gain
      const prevA = data[i + 3]! / 255
      if (a >= 1 || prevA === 0) {
        data[i] = r8 > 255 ? 255 : r8
        data[i + 1] = g8 > 255 ? 255 : g8
        data[i + 2] = b8 > 255 ? 255 : b8
        data[i + 3] = a >= 1 ? 255 : a * 255
      } else {
        // "over" compositing on what an earlier body already painted.
        const outA = a + prevA * (1 - a)
        data[i] = Math.min(255, (r8 * a + data[i]! * prevA * (1 - a)) / outA)
        data[i + 1] = Math.min(255, (g8 * a + data[i + 1]! * prevA * (1 - a)) / outA)
        data[i + 2] = Math.min(255, (b8 * a + data[i + 2]! * prevA * (1 - a)) / outA)
        data[i + 3] = outA * 255
      }
    }
  }

  const finish = () => {
    ctx.clearRect(0, 0, w, h)
    ctx.putImageData(image, 0, 0)
    options.after?.(ctx)
    options.onDone?.()
  }

  const step = () => {
    if (cancelled) return
    if (typeof document !== 'undefined' && document.hidden) {
      // Do not burn CPU in a background tab: resume when it is visible again.
      document.addEventListener('visibilitychange', step, { once: true })
      return
    }
    const start = performance.now()
    while (performance.now() - start < sliceMs) {
      if (row < 0 || row > rowEnd) {
        if (bodyIndex >= bodies.length) {
          finish()
          return
        }
        setupBody()
        bodyIndex++
        if (row > rowEnd) continue
      }
      renderRow(row)
      row++
    }
    timer = setTimeout(step, 0)
  }

  timer = setTimeout(step, 0)

  return () => {
    cancelled = true
    if (timer !== undefined) clearTimeout(timer)
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', step)
  }
}

/* ------------------------------------------------------------------ stars */

/** Static star field with a faint diagonal band. Drawn once per resize. */
export function drawStars(canvas: HTMLCanvasElement, seed = 7): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const rand = mulberry32(seed)
  ctx.clearRect(0, 0, w, h)

  // Faint galactic band: a few very soft blobs along a diagonal.
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const x = w * (0.15 + 0.8 * t) + (rand() - 0.5) * w * 0.08
    const y = h * (0.42 - 0.38 * t) + (rand() - 0.5) * h * 0.08
    const rad = Math.max(w, h) * (0.12 + rand() * 0.1)
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad)
    grad.addColorStop(0, 'rgba(120,150,210,0.05)')
    grad.addColorStop(1, 'rgba(120,150,210,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }

  const count = Math.round((w * h) / 1500)
  const unit = Math.max(1, w / 1280)
  for (let i = 0; i < count; i++) {
    let x = rand() * w
    let y = rand() * h
    // A third of the stars gather along the band.
    if (rand() < 0.33) {
      const t = rand()
      x = w * (0.1 + 0.9 * t) + (rand() + rand() - 1) * w * 0.14
      y = h * (0.45 - 0.42 * t) + (rand() + rand() - 1) * h * 0.14
    }
    const mag = rand() ** 3
    const size = (0.45 + mag * 1.25) * unit
    const tint = rand()
    const c = tint < 0.2 ? '255,222,190' : tint < 0.5 ? '190,214,255' : '236,242,255'
    ctx.fillStyle = `rgba(${c},${0.22 + mag * 0.75})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    if (mag > 0.72) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 5)
      grad.addColorStop(0, `rgba(${c},0.22)`)
      grad.addColorStop(1, `rgba(${c},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, size * 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
