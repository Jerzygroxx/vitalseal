/**
 * Utilidades de codificación para la capa de confianza.
 *
 * `canonical()` produce un JSON determinista (claves ordenadas). Es imprescindible:
 * si dos serializaciones del mismo objeto difieren en el orden de claves, el hash
 * cambiaría y la verificación fallaría sin que nadie haya manipulado nada.
 */
export function canonical(value: unknown): string {
  return JSON.stringify(sortDeep(value))
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key]
      if (v !== undefined) out[key] = sortDeep(v)
    }
    return out
  }
  return value
}

const encoder = new TextEncoder()
export const utf8 = (s: string): Uint8Array<ArrayBuffer> => encoder.encode(s)

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', utf8(text)))
}
