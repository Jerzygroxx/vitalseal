import { describe, expect, it } from 'vitest'
import type { SignedReport } from '../../domain/types'
import { reportFilename, reportToJson } from './export'

const report = {
  version: 1,
  generatedAt: '2026-11-15T14:30:00.000Z',
  entries: [{}, {}, {}],
  headHash: 'abc',
  signature: 'sig',
  publicKey: '{}',
} as unknown as SignedReport

describe('report export', () => {
  it('names the file with entry count and date', () => {
    expect(reportFilename(report)).toBe('vitalseal-report-3-entries-2026-11-15.json')
  })

  it('serialises to JSON that parses back to the same report', () => {
    expect(JSON.parse(reportToJson(report))).toEqual(report)
  })
})
