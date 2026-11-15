import { beforeAll, describe, expect, it } from 'vitest'
import { generateSynthetic } from '../data/synthetic'
import type { ChainEntry, SignedReport } from '../domain/types'
import { appendEntry, buildChain, GENESIS_HASH, verifyChain } from './chain'
import { canonical } from './encoding'
import { matchesSealCode, sealCode } from './seal-code'
import { generateSigningKeys, signReport, type SigningKeys } from './sign'
import { decryptVault, encryptVault, VaultError } from './vault'
import { verifyReport } from './verify'

const readings = generateSynthetic({ days: 10 })
let chain: ChainEntry[]
let keys: SigningKeys
let report: SignedReport

beforeAll(async () => {
  chain = await buildChain(readings)
  keys = await generateSigningKeys()
  report = await signReport(chain, keys, '2026-11-14T12:00:00.000Z')
})

const clone = <T>(x: T): T => structuredClone(x)

describe('canonical()', () => {
  it('no depende del orden de claves', () => {
    expect(canonical({ a: 1, b: { y: 2, x: 3 } })).toBe(canonical({ b: { x: 3, y: 2 }, a: 1 }))
  })
})

describe('hash chain', () => {
  it('una cadena íntegra es válida y enlaza desde el génesis', async () => {
    expect(chain[0]?.prevHash).toBe(GENESIS_HASH)
    expect(await verifyChain(chain)).toEqual({ valid: true })
  })
  it('es determinista', async () => {
    expect((await buildChain(readings)).map((e) => e.hash)).toEqual(chain.map((e) => e.hash))
  })
  it('appendEntry enlaza con la entrada previa', async () => {
    const next = await appendEntry(chain, readings[0]!, '2026-11-15T00:00:00.000Z')
    expect(next).toHaveLength(chain.length + 1)
    expect(next[next.length - 1]?.prevHash).toBe(chain[chain.length - 1]?.hash)
    expect((await verifyChain(next)).valid).toBe(true)
  })

  it('DETECTA una lectura alterada', async () => {
    const t = clone(chain)
    t[4]!.reading.spo2 = 99
    const r = await verifyChain(t)
    expect(r).toMatchObject({ valid: false, brokenAt: 4, reason: 'hash-mismatch' })
  })
  it('DETECTA entradas reordenadas', async () => {
    const t = clone(chain)
    ;[t[2], t[3]] = [t[3]!, t[2]!]
    expect((await verifyChain(t)).valid).toBe(false)
  })
  it('DETECTA una entrada borrada en medio', async () => {
    const t = clone(chain)
    t.splice(5, 1)
    expect((await verifyChain(t)).valid).toBe(false)
  })
  it('alterar una entrada Y recalcular su hash rompe el enlace siguiente', async () => {
    const t = clone(chain)
    t[3]!.reading.heartRate = 200
    t[3]!.hash = 'f'.repeat(64)
    const r = await verifyChain(t)
    expect(r.valid).toBe(false)
  })
  it('LIMITACIÓN conocida: truncar la cola por sí solo no se detecta en la cadena', async () => {
    expect((await verifyChain(chain.slice(0, 6))).valid).toBe(true)
  })
})

describe('signed report', () => {
  it('un reporte intacto verifica', async () => {
    const v = await verifyReport(report)
    expect(v).toMatchObject({ valid: true, headMatches: true, signatureValid: true, problems: [] })
  })
  it('la clave privada no es extraíble', async () => {
    expect(keys.privateKey.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('jwk', keys.privateKey)).rejects.toThrow()
  })
  it('DETECTA la lectura alterada en el reporte', async () => {
    const t = clone(report)
    t.entries[1]!.reading.systolic = 90
    const v = await verifyReport(t)
    expect(v.valid).toBe(false)
    expect(v.chain.reason).toBe('hash-mismatch')
  })
  it('DETECTA la cola truncada gracias a la firma (headHash y count)', async () => {
    const t = clone(report)
    t.entries = t.entries.slice(0, 6)
    const v = await verifyReport(t)
    expect(v.valid).toBe(false)
    expect(v.headMatches).toBe(false)
  })
  it('DETECTA truncar y reescribir headHash (la firma ya no cuadra)', async () => {
    const t = clone(report)
    t.entries = t.entries.slice(0, 6)
    t.headHash = t.entries[5]!.hash
    const v = await verifyReport(t)
    expect(v.chain.valid).toBe(true)
    expect(v.headMatches).toBe(true)
    expect(v.signatureValid).toBe(false)
    expect(v.valid).toBe(false)
  })
  it('DETECTA una firma de otra clave (suplantación)', async () => {
    const other = await generateSigningKeys()
    const forged = await signReport(chain, other, report.generatedAt)
    const t = { ...clone(report), signature: forged.signature }
    expect((await verifyReport(t)).signatureValid).toBe(false)
  })
  it('un reporte corrupto no lanza: devuelve invalid', async () => {
    const t = { ...clone(report), publicKey: 'not json' }
    const v = await verifyReport(t)
    expect(v.valid).toBe(false)
    expect(v.problems.length).toBeGreaterThan(0)
  })
})

describe('seal code', () => {
  it('es corto, estable y cambia si cambia el historial', async () => {
    const code = await sealCode(report)
    expect(code).toMatch(/^VS1-0010-[0-9A-F]{16}-[0-9A-F]{8}$/)
    expect(await matchesSealCode(report, code.toLowerCase())).toBe(true)
    const t = clone(report)
    t.entries = t.entries.slice(0, 9)
    t.headHash = t.entries[8]!.hash
    expect(await matchesSealCode(t, code)).toBe(false)
  })
})

describe('vault AES-GCM', () => {
  const ITER = 1000 // solo para tests; en producción 600 000
  it('cifra y descifra con la passphrase correcta', async () => {
    const blob = await encryptVault({ readings: readings.slice(0, 2) }, 'correct horse', ITER)
    expect(blob.ciphertext).not.toContain('heartRate')
    expect(await decryptVault<{ readings: unknown[] }>(blob, 'correct horse')).toEqual({ readings: readings.slice(0, 2) })
  })
  it('sal e iv distintos en cada cifrado', async () => {
    const a = await encryptVault({ x: 1 }, 'pw', ITER)
    const b = await encryptVault({ x: 1 }, 'pw', ITER)
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ciphertext).not.toBe(b.ciphertext)
  })
  it('passphrase incorrecta => VaultError', async () => {
    const blob = await encryptVault({ x: 1 }, 'right', ITER)
    await expect(decryptVault(blob, 'wrong')).rejects.toBeInstanceOf(VaultError)
  })
  it('texto cifrado manipulado => VaultError (autenticación de AES-GCM)', async () => {
    const blob = await encryptVault({ x: 1 }, 'pw', ITER)
    const bytes = atob(blob.ciphertext).split('')
    bytes[0] = String.fromCharCode(bytes[0]!.charCodeAt(0) ^ 1)
    const tampered = { ...blob, ciphertext: btoa(bytes.join('')) }
    await expect(decryptVault(tampered, 'pw')).rejects.toBeInstanceOf(VaultError)
  })
})
