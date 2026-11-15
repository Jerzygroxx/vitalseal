import type { SignedReport } from '../../domain/types'

/** The JSON the crew sends to ground: the signed report with the entries as currently stored. */
export function reportToJson(report: SignedReport): string {
  return JSON.stringify(report, null, 2)
}

/** File name that carries the seal's entry count and date, e.g. vitalseal-report-22-entries-2026-11-15.json */
export function reportFilename(report: Pick<SignedReport, 'generatedAt' | 'entries'>): string {
  const day = report.generatedAt.slice(0, 10)
  return `vitalseal-report-${report.entries.length}-entries-${day}.json`
}

/** Saves text as a file through a temporary link (works offline, nothing is uploaded). */
export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
