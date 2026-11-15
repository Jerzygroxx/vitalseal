import { beforeAll, describe, expect, it } from 'vitest'
import { generateSynthetic } from '../data/synthetic'
import type { SignedReport } from '../domain/types'
import { buildChain } from './chain'
import { parseReport, verifyReportJson } from './parse-report'
import { generateSigningKeys, signReport } from './sign'

let report: SignedReport
beforeAll(async () => {
  const chain = await buildChain(generateSynthetic({ days: 8 }))
  report = await signReport(chain, await generateSigningKeys())
})

describe('parseReport / verifyReportJson', () => {
  it('un reporte válido pegado como texto verifica', async () => {
    const out = await verifyReportJson(JSON.stringify(report))
    expect(out.kind).toBe('result')
    if (out.kind === 'result') expect(out.verification.valid).toBe(true)
  })
  it('un reporte manipulado se reporta como inválido, no como error de formato', async () => {
    const t = structuredClone(report)
    t.entries[3]!.reading.heartRate = 190
    const out = await verifyReportJson(JSON.stringify(t))
    expect(out.kind).toBe('result')
    if (out.kind === 'result') expect(out.verification.valid).toBe(false)
  })
  it('texto que no es JSON => error legible', async () => {
    expect(await verifyReportJson('hello')).toEqual({ kind: 'error', message: 'That text is not valid JSON.' })
  })
  it('JSON con forma incorrecta => error legible', () => {
    expect(() => parseReport('[]')).toThrow(/object/)
    expect(() => parseReport(JSON.stringify({ ...report, version: 2 }))).toThrow(/version/)
    expect(() => parseReport(JSON.stringify({ ...report, entries: 'x' }))).toThrow(/entries/)
    expect(() => parseReport(JSON.stringify({ ...report, entries: [{}] }))).toThrow(/malformed/)
    const { signature: _s, ...noSig } = report
    expect(() => parseReport(JSON.stringify(noSig))).toThrow(/signature/)
  })
})
