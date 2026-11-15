import { useState } from 'react'
import { ClipboardCopy, Download } from 'lucide-react'
import { downloadText } from './export'

export interface ReportExportProps {
  /** Signed report as JSON text, or null while it is being prepared. */
  reportJson: string | null
  /** File name for the download. */
  filename: string
}

/**
 * Send to ground: the crew downloads the signed report (or copies it) and sends it over
 * whatever link the mission has. Ground loads it into the verifier.
 * Renders only the body of the step; the caller provides the step heading.
 */
export function ReportExport({ reportJson, filename }: ReportExportProps) {
  const [status, setStatus] = useState<'saved' | 'copied' | 'failed' | null>(null)

  function handleDownload() {
    if (reportJson === null) return
    downloadText(filename, reportJson)
    setStatus('saved')
  }

  async function handleCopy() {
    if (reportJson === null) return
    try {
      await navigator.clipboard.writeText(reportJson)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm leading-5 text-fg-muted sm:text-base sm:leading-6">
        Save the signed report and send it with your other data.
      </p>
      <div className="mt-auto grid gap-2.5 pt-4">
        <button
          type="button"
          className="btn btn-primary min-h-13 w-full text-base"
          onClick={handleDownload}
          disabled={reportJson === null}
        >
          <Download aria-hidden="true" className="size-5" />
          Download signed report
        </button>
        <button
          type="button"
          className="btn min-h-12 w-full text-base"
          onClick={handleCopy}
          disabled={reportJson === null}
        >
          <ClipboardCopy aria-hidden="true" className="size-5" />
          Copy report
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-fg-muted">
        {reportJson === null && 'Preparing the report…'}
        {status === 'saved' && `Saved as ${filename}.`}
        {status === 'copied' && 'Report copied to the clipboard.'}
        {status === 'failed' && 'Could not copy. Use Download instead.'}
      </p>
    </div>
  )
}
