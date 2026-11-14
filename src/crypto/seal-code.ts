import type { SignedReport } from '../domain/types'
import { sha256Hex } from './encoding'

/**
 * Código de sello: resumen corto (cabe en un QR o en un mensaje de texto) de un
 * reporte firmado. Formato: VS1-<nº entradas>-<16 hex de headHash>-<8 hex de huella de la firma>.
 *
 * Idea: si el código se envía a Tierra (aunque tarde 22 min), cualquier reescritura
 * posterior del historial produce un código distinto. Es un RESUMEN para comparar,
 * no sustituye la verificación completa del reporte.
 */
export async function sealCode(report: SignedReport): Promise<string> {
  const count = String(report.entries.length).padStart(4, '0')
  const head = report.headHash.slice(0, 16)
  const sigFp = (await sha256Hex(report.signature)).slice(0, 8)
  return `VS1-${count}-${head}-${sigFp}`.toUpperCase()
}

export async function matchesSealCode(report: SignedReport, code: string): Promise<boolean> {
  return (await sealCode(report)) === code.trim().toUpperCase()
}
