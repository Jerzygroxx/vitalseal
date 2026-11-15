import { useId, useState, type FormEvent } from 'react'
import {
  CircleAlert,
  HeartPulse,
  Radiation,
  ScanLine,
  Stethoscope,
  Thermometer,
  type LucideIcon,
} from 'lucide-react'
import type { Reading } from '../../domain/types'
import {
  EMPTY_VALUES,
  NUMERIC_RULES,
  hasErrors,
  parseSymptoms,
  rangeHint,
  validateReading,
  type NumericField,
  type NumericRule,
  type ReadingValues,
  type ValidationErrors,
} from './validation'

export interface DailyCheckFormProps {
  onSubmit: (reading: Reading) => void
}

/**
 * Agrupación visual de los campos. Respeta el orden de `NUMERIC_RULES`
 * (fuente única del orden de tabulación); un campo nuevo sin grupo cae en "Other".
 */
const GROUPS: {
  title: string
  icon: LucideIcon
  fields: NumericField[]
  /** Clases de rejilla: ancho del grupo y columnas de sus campos. */
  span: string
  columns: string
}[] = [
  {
    title: 'Heart and circulation',
    icon: HeartPulse,
    fields: ['heartRate', 'systolic', 'diastolic', 'spo2'],
    span: 'lg:col-span-3',
    columns: 'sm:grid-cols-2 lg:grid-cols-4',
  },
  {
    title: 'Body and rest',
    icon: Thermometer,
    fields: ['temperature', 'sleepHours', 'mood'],
    span: 'lg:col-span-2',
    columns: 'sm:grid-cols-3',
  },
  {
    title: 'Environment',
    icon: Radiation,
    fields: ['radiationDose'],
    span: '',
    columns: '',
  },
]

const GROUPED_FIELDS = new Set(GROUPS.flatMap((group) => group.fields))

function rulesFor(fields: readonly NumericField[]): NumericRule[] {
  return NUMERIC_RULES.filter((rule) => fields.includes(rule.field))
}

interface NumberFieldProps {
  id: string
  rule: NumericRule
  value: string
  error: string | undefined
  onChange: (value: string) => void
}

/** Campo numérico con label, unidad, ayuda de rango y error descrito por aria. */
function NumberField({ id, rule, value, error, onChange }: NumberFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const invalid = error !== undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {rule.label}
        {rule.unit ? ` (${rule.unit})` : ''}
      </label>
      <div className="relative mt-1.5">
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
          className={`field num font-mono ${rule.unit ? 'pr-16' : ''}`}
        />
        {rule.unit && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-fg-dim"
          >
            {rule.unit}
          </span>
        )}
      </div>
      <p id={hintId} className="mt-1.5 text-xs text-fg-dim">
        {rangeHint(rule)}
      </p>
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-alert-soft">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-alert" />
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
  const ungrouped = NUMERIC_RULES.filter((rule) => !GROUPED_FIELDS.has(rule.field))
  const filled = NUMERIC_RULES.filter((rule) => values[rule.field].trim() !== '').length

  const renderField = (rule: NumericRule) => (
    <NumberField
      key={rule.field}
      id={`${prefix}-${rule.field}`}
      rule={rule}
      value={values[rule.field]}
      error={errors[rule.field]}
      onChange={(value) => update(rule.field, value)}
    />
  )

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <header className="glass hud flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Manual entry</p>
          <h2 className="mt-1 text-2xl leading-8 font-semibold text-fg">Daily check</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Log today&apos;s measurements. Each value is checked against its allowed range before the
            record is created.
          </p>
        </div>
        <p className="text-sm text-fg-muted">
          <span className="num font-mono text-lg font-semibold text-fg">
            {filled}/{NUMERIC_RULES.length}
          </span>{' '}
          values entered
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <fieldset key={group.title} className={`glass min-w-0 p-5 ${group.span}`}>
            <legend className="sr-only">{group.title}</legend>
            <p aria-hidden="true" className="flex items-center gap-2 text-base font-semibold text-fg">
              <span className="flex size-8 items-center justify-center rounded-lg border border-ice-300/40 bg-ice-400/12 text-ice-200">
                <group.icon className="size-4" />
              </span>
              {group.title}
            </p>
            <div className={`mt-4 grid gap-4 ${group.columns}`}>
              {rulesFor(group.fields).map(renderField)}
            </div>
          </fieldset>
        ))}

        {ungrouped.length > 0 && (
          <fieldset className="glass min-w-0 p-5 lg:col-span-3">
            <legend className="sr-only">Other</legend>
            <div className="grid gap-4 sm:grid-cols-2">{ungrouped.map(renderField)}</div>
          </fieldset>
        )}

        <div className="glass p-5 lg:col-span-3">
          <p aria-hidden="true" className="flex items-center gap-2 text-base font-semibold text-fg">
            <span className="flex size-8 items-center justify-center rounded-lg border border-ice-300/40 bg-ice-400/12 text-ice-200">
              <Stethoscope className="size-4" />
            </span>
            How you feel
          </p>
          <label htmlFor={symptomsId} className="mt-4 block text-sm font-medium text-fg">
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
            className="field mt-1.5"
          />
          <p id={symptomsHintId} className="mt-1.5 text-xs text-fg-dim">
            Comma separated. Leave empty if none.
          </p>
        </div>
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
        {errorCount > 0 ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-alert/55 bg-alert/14 px-3 py-2 text-sm text-alert-soft"
          >
            <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-alert" />
            {errorCount === 1
              ? '1 field needs attention before the check can run.'
              : `${errorCount} fields need attention before the check can run.`}
          </p>
        ) : (
          <p className="text-sm text-fg-muted">
            The reading is added to the sealed record and the dashboard updates.
          </p>
        )}
        <button type="submit" className="btn btn-primary ml-auto px-5">
          <ScanLine aria-hidden="true" className="size-4" />
          Run check
        </button>
      </div>
    </form>
  )
}
