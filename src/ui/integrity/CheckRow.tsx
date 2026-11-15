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
    <li className="well flex min-h-14 items-center gap-3 px-3 py-2.5">
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center border ${
          ok
            ? 'rounded-full border-ok/50 bg-ok/14 text-ok'
            : 'rounded-md border-alert/60 bg-alert/16 text-alert'
        }`}
      >
        <Icon className="size-4.5" strokeWidth={2.75} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm leading-5 font-medium text-fg">{label}</span>
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
