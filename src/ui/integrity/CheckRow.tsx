import { Check, X } from 'lucide-react'

export interface CheckRowProps {
  /** Nombre de la comprobación (p. ej. "Hash chain"). */
  label: string
  ok: boolean
}

/**
 * Fila de comprobación (T-03): icono + texto + color, nunca solo color.
 * Renderiza un `<li>`: debe ir dentro de un `<ul>` (panel y verificador).
 */
export function CheckRow({ label, ok }: CheckRowProps) {
  const Icon = ok ? Check : X
  const tone = ok ? 'text-emerald-300' : 'text-red-300'

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <Icon aria-hidden="true" className={`size-4 shrink-0 self-center ${tone}`} />
      <span className="text-slate-200">{label}</span>
      <span className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>
        {ok ? 'Passed' : 'Failed'}
      </span>
    </li>
  )
}
