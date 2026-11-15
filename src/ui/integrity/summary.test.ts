import { describe, expect, it } from 'vitest'
import type { ReportVerification } from '../../crypto/verify'
import { summarize } from './summary'

/** Reporte válido de partida; cada test cambia solo el campo que le interesa. */
const okVerification = (): ReportVerification => ({
  valid: true,
  chain: { valid: true },
  headMatches: true,
  signatureValid: true,
  problems: [],
})

describe('summarize', () => {
  it('sin verificar (null) no inventa comprobaciones', () => {
    expect(summarize(null)).toEqual({
      tone: 'unknown',
      title: 'Not verified yet',
      checks: [],
    })
  })

  it('todo correcto => Record intact con las tres comprobaciones en verde', () => {
    const summary = summarize(okVerification())

    expect(summary.tone).toBe('ok')
    expect(summary.title).toBe('Record intact')
    expect(summary.checks).toEqual([
      { label: 'Hash chain', ok: true },
      { label: 'Head matches seal', ok: true },
      { label: 'Signature', ok: true },
    ])
  })

  it('cadena rota => Tampering detected y solo falla Hash chain', () => {
    const summary = summarize({
      ...okVerification(),
      valid: false,
      chain: { valid: false, brokenAt: 4, reason: 'hash-mismatch' },
      problems: ['Chain broken at entry 4: the content of an entry was altered.'],
    })

    expect(summary.tone).toBe('bad')
    expect(summary.title).toBe('Tampering detected')
    expect(summary.checks).toEqual([
      { label: 'Hash chain', ok: false },
      { label: 'Head matches seal', ok: true },
      { label: 'Signature', ok: true },
    ])
  })

  it('firma inválida => Tampering detected y solo falla Signature', () => {
    const summary = summarize({
      ...okVerification(),
      valid: false,
      signatureValid: false,
      problems: ['Signature is invalid for this report.'],
    })

    expect(summary.tone).toBe('bad')
    expect(summary.checks).toEqual([
      { label: 'Hash chain', ok: true },
      { label: 'Head matches seal', ok: true },
      { label: 'Signature', ok: false },
    ])
  })

  it('cabeza distinta al sello => falla Head matches seal', () => {
    const summary = summarize({
      ...okVerification(),
      valid: false,
      headMatches: false,
      problems: ['Head hash does not match the last entry.'],
    })

    expect(summary.tone).toBe('bad')
    expect(summary.checks[1]).toEqual({ label: 'Head matches seal', ok: false })
  })

  it('el estado grande sigue el campo valid del verificador', () => {
    const summary = summarize({ ...okVerification(), valid: false })

    expect(summary.tone).toBe('bad')
    expect(summary.title).toBe('Tampering detected')
  })
})
