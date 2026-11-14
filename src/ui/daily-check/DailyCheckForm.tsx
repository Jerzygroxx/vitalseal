import { useId, useState, type FormEvent } from 'react'
import { CircleAlert } from 'lucide-react'
import type { Reading } from '../../domain/types'
import {
  EMPTY_VALUES,
  NUMERIC_RULES,
  hasErrors,
  parseSymptoms,
  rangeHint,
  validateReading,
  type NumericRule,
  type ReadingValues,
  type ValidationErrors,
} from './validation'

export interface DailyCheckFormProps {
  onSubmit: (reading: Reading) => void
}

const inputClasses = (invalid: boolean): string =>
  `mt-1 block w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 transition focus:outline-none focus-visible:ring-2 ${
    invalid
      ? 'border-red-400/70 focus-visible:ring-red-400'
      : 'border-slate-600 focus-visible:ring-cyan-400'
  }`

interface NumberFieldProps {
  id: string
  rule: NumericRule
  value: string
  error: string | undefined
  onChange: (value: string) => void
}

/** Campo numérico con label, ayuda de rango y error descrito por aria. */
function NumberField({ id, rule, value, error, onChange }: NumberFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const invalid = error !== undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {rule.label}
        {rule.unit ? ` (${rule.unit})` : ''}
      </label>
      <input
        id={id}
        name={rule.field}
        type="number"
        inputMode={rule.integer ? 'numeric' : 'decimal'}
        step={rule.step}
        min={rule.min}
        max={rule.max}
        required
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
        className={inputClasses(invalid)}
      />
      <p id={hintId} className="mt-1 text-xs text-slate-400">
        {rangeHint(rule)}
      </p>
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-red-300">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

/**
 * Chequeo diario (T-01): 8 indicadores + síntomas.
 * La validación vive en validation.ts; este componente solo la pinta.
 */
export function DailyCheckForm({ onSubmit }: DailyCheckFormProps) {
  const prefix = useId()
  const [values, setValues] = useState<ReadingValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const update = (field: keyof ReadingValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))

    setErrors((previous) => {
      if (!(field in previous)) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateReading(values)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      const firstInvalid = NUMERIC_RULES.find((rule) => rule.field in nextErrors)?.field
      if (firstInvalid !== undefined) {
        document.getElementById(`${prefix}-${firstInvalid}`)?.focus()
      }
      return
    }

    onSubmit({
      id: `manual-${Date.now()}`,
      date: new Date().toISOString(),
      heartRate: Number(values.heartRate),
      systolic: Number(values.systolic),
      diastolic: Number(values.diastolic),
      spo2: Number(values.spo2),
      temperature: Number(values.temperature),
      sleepHours: Number(values.sleepHours),
      mood: Number(values.mood),
      symptoms: parseSymptoms(values.symptoms),
      radiationDose: Number(values.radiationDose),
      source: 'manual',
    })
  }

  const errorCount = Object.keys(errors).length
  const symptomsId = `${prefix}-symptoms`
  const symptomsHintId = `${symptomsId}-hint`

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Daily check</h2>
        <p className="mt-1 text-sm text-slate-400">
          Log today&apos;s measurements. Each value is checked against its allowed range before the
          record is created.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {NUMERIC_RULES.map((rule) => (
          <NumberField
            key={rule.field}
            id={`${prefix}-${rule.field}`}
            rule={rule}
            value={values[rule.field]}
            error={errors[rule.field]}
            onChange={(value) => update(rule.field, value)}
          />
        ))}

        <div className="sm:col-span-2">
          <label htmlFor={symptomsId} className="block text-sm font-medium text-slate-200">
            Symptoms
          </label>
          <input
            id={symptomsId}
            name="symptoms"
            type="text"
            autoComplete="off"
            placeholder="e.g. headache, lower back pain"
            value={values.symptoms}
            onChange={(event) => update('symptoms', event.target.value)}
            aria-describedby={symptomsHintId}
            className={inputClasses(false)}
          />
          <p id={symptomsHintId} className="mt-1 text-xs text-slate-400">
            Comma separated. Leave empty if none.
          </p>
        </div>
      </div>

      {errorCount > 0 && (
        <p
          role="status"
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {errorCount === 1
            ? '1 field needs attention before the check can run.'
            : `${errorCount} fields need attention before the check can run.`}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Run check
        </button>
      </div>
    </form>
  )
}
