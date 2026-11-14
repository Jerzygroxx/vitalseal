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

  return (
    <li className="well flex items-center gap-3 px-3 py-2.5">
      <span
        aria-hidden="true"
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
          ok ? 'border-ok/45 bg-ok/12 text-ok' : 'border-alert/55 bg-alert/14 text-alert'
        }`}
      >
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-fg">{label}</span>
        <span
          className={`text-xs font-semibold tracking-[0.1em] uppercase ${
            ok ? 'text-ok' : 'text-alert'
          }`}
        >
          {ok ? 'Passed' : 'Failed'}
        </span>
      </span>
    </li>
  )
}
