import { fromBase64, toBase64, utf8 } from './encoding'

/**
 * Vault local cifrado.
 *
 * - La clave AES-GCM de 256 bits se DERIVA de la passphrase con PBKDF2-SHA256 y una
 *   sal aleatoria por vault. Las iteraciones altas encarecen cada intento de
 *   adivinar la passphrase (fuerza bruta offline) y se guardan junto al vault.
 * - AES-GCM cifra y además autentica: si alguien modifica el texto cifrado o la
 *   passphrase es incorrecta, el descifrado falla (no devuelve basura).
 * - Nunca se guarda la passphrase ni la clave derivada; solo sal, iv y texto cifrado.
 */
export const DEFAULT_PBKDF2_ITERATIONS = 600_000

export interface VaultBlob {
  v: 1
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string // base64
  iv: string // base64 (12 bytes, nuevo en cada cifrado)
  ciphertext: string // base64
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey('raw', utf8(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false, // no extraíble
    ['encrypt', 'decrypt'],
  )
}

export async function encryptVault(
  data: unknown,
  passphrase: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, iterations)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8(JSON.stringify(data)))
  return {
    v: 1, kdf: 'PBKDF2-SHA256', iterations,
    salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(ct),
  }
}

export class VaultError extends Error {}

export async function decryptVault<T = unknown>(blob: VaultBlob, passphrase: string): Promise<T> {
  try {
    const key = await deriveKey(passphrase, fromBase64(blob.salt), blob.iterations)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(blob.iv) }, key, fromBase64(blob.ciphertext))
    return JSON.parse(new TextDecoder().decode(pt)) as T
  } catch {
    // Mensaje único a propósito: no distinguimos "passphrase mala" de "vault corrupto".
    throw new VaultError('Could not unlock the vault: wrong passphrase or corrupted data.')
  }
}
