import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  Angry,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Frown,
  Gauge,
  HeartPulse,
  Meh,
  Minus,
  MoonStar,
  Plus,
  Radiation,
  ShieldCheck,
  Smile,
  SmilePlus,
  Stethoscope,
  Thermometer,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Reading } from '../../domain/types'
import { NUMERIC_LIMITS, rangeHint, type NumericLimit, type TextField } from './ranges'
import {
  MOOD_OPTIONS,
  STEPS,
  STEP_COUNT,
  SYMPTOMS,
  SYMPTOM_NONE,
  buildReading,
  initialValues,
  nudge,
  toggleSymptom,
  validateStep,
  type CheckInValues,
  type StepId,
} from './steps'

export interface CheckInWizardProps {
  /** Latest reading: starting values for every question. */
  defaults?: Reading
  /** Called with a complete, valid reading. */
  onSubmit: (reading: Reading) => void
  /** The crew leaves the check-in without saving. */
  onCancel: () => void
}

/** Icono de cada pregunta (decorativo: siempre acompaña a texto). */
const STEP_ICONS: Record<StepId, LucideIcon> = {
  heartRate: HeartPulse,
  bloodPressure: Gauge,
  spo2: Wind,
  temperature: Thermometer,
  sleepHours: MoonStar,
  mood: Smile,
  symptoms: Stethoscope,
  radiationDose: Radiation,
}

/** Caras de los cinco botones de ánimo, en orden 1 → 5. */
const MOOD_ICONS: readonly LucideIcon[] = [Angry, Frown, Meh, Smile, SmilePlus]

interface NumericControlProps {
  id: string
  limit: NumericLimit
  value: string
  /** Solo se pasa cuando hay un valor escrito fuera de rango. */
  error?: string
  onChange: (raw: string) => void
}

/**
 * Un valor numérico grande: − / teclado / + y la unidad al lado. El campo
 * acepta texto para poder validar decimales con coma y valores basura; el
 * teclado del dispositivo se abre en modo numérico con `inputMode`.
 */
function NumericControl({ id, limit, value, error, onChange }: NumericControlProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const invalid = error !== undefined

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {limit.label}
      </label>

      <div className="mt-2 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange(nudge(limit, value, -1))}
          aria-label={`Decrease ${limit.label}`}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-space-700/70 text-fg transition-colors hover:border-ice-400 hover:bg-space-600"
        >
          <Minus aria-hidden="true" className="size-6" />
        </button>

        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            name={limit.field}
            type="text"
            inputMode={limit.integer ? 'numeric' : 'decimal'}
            autoComplete="off"
            spellCheck={false}
            value={value}
            placeholder="—"
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
            className="field num h-14 pr-14 pl-4 font-mono text-3xl font-semibold"
          />
          {limit.unit !== '' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-fg-dim"
            >
              {limit.unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(nudge(limit, value, 1))}
          aria-label={`Increase ${limit.label}`}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-space-700/70 text-fg transition-colors hover:border-ice-400 hover:bg-space-600"
        >
          <Plus aria-hidden="true" className="size-6" />
        </button>
      </div>

      <p id={hintId} className="mt-1.5 text-xs text-fg-dim">
        {rangeHint(limit)}
      </p>

      {invalid && (
        <p id={errorId} role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-alert-soft">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-alert" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

interface MoodPickerProps {
  value: number | null
  onChange: (mood: number) => void
}

/** Cinco botones grandes: cara + etiqueta; selección con check + aria-pressed. */
function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-5">
      {MOOD_OPTIONS.map((option) => {
        const selected = value === option.value
        const Icon = MOOD_ICONS[option.value - 1] ?? Meh

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`relative flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-colors sm:min-h-24 sm:flex-col sm:justify-center sm:gap-2 sm:p-2 sm:text-center ${
              selected
                ? 'border-ice-300/70 bg-ice-400/15 text-ice-100'
                : 'border-line-strong bg-space-800/60 text-fg hover:border-ice-400/60 hover:bg-space-700/60'
            }`}
          >
            <Icon aria-hidden="true" className="size-8 shrink-0" />
            <span className="min-w-0 text-sm leading-5 font-semibold">
              {option.value}. {option.label}
            </span>
            {selected && (
              <Check aria-hidden="true" className="absolute top-2 right-2 size-4 text-ice-200" />
            )}
          </button>
        )
      })}
    </div>
  )
}

interface SymptomPickerProps {
  selected: readonly string[]
  onToggle: (symptom: string) => void
}

/** Chips seleccionables; "None" va primero y es exclusivo. */
function SymptomPicker({ selected, onToggle }: SymptomPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {[SYMPTOM_NONE, ...SYMPTOMS].map((symptom) => {
        const isOn = selected.includes(symptom)

        return (
          <button
            key={symptom}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(symptom)}
            className={`flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
              isOn
                ? 'border-ice-300/70 bg-ice-400/15 text-ice-100'
                : 'border-line-strong bg-space-800/60 text-fg hover:border-ice-400/60 hover:bg-space-700/60'
            }`}
          >
            {isOn && <Check aria-hidden="true" className="size-4 shrink-0 text-ice-200" />}
            {symptom}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Daily check-in (T-06): one question per screen, big controls, little text.
 * The rules live in `steps.ts`; this component owns the step index, the values
 * being typed and the focus move to the new question. Purely presentational
 * for the rest of the app: it hands the finished Reading up through `onSubmit`.
 */
export function CheckInWizard({ defaults, onSubmit, onCancel }: CheckInWizardProps) {
  const baseId = useId()
  const questionRef = useRef<HTMLHeadingElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<CheckInValues>(() => initialValues(defaults))

  const step = STEPS[stepIndex]!
  const titleId = `${baseId}-question`
  const StepIcon = STEP_ICONS[step.id]

  const errors = validateStep(step, values)
  const canContinue = Object.keys(errors).length === 0
  const isLastStep = stepIndex === STEP_COUNT - 1

  // Each step answers one question: move the reading focus there.
  useEffect(() => {
    questionRef.current?.focus()
  }, [stepIndex])

  const updateField = (field: TextField, raw: string) => {
    setValues((previous) => {
      const next = { ...previous }
      next[field] = raw
      return next
    })
  }

  const goBack = () => setStepIndex((index) => Math.max(0, index - 1))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue) return

    if (isLastStep) {
      onSubmit(buildReading(values, new Date()))
      return
    }

    setStepIndex((index) => Math.min(index + 1, STEP_COUNT - 1))
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="glass hud p-5 text-fg sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="eyebrow">Daily check</p>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            Step <span className="num font-mono text-fg">{stepIndex + 1}</span> of {STEP_COUNT}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="btn min-h-10 shrink-0 border-transparent bg-transparent px-3 text-sm text-fg-muted hover:border-transparent hover:bg-space-700/60 hover:text-fg"
        >
          <X aria-hidden="true" className="size-4" />
          Cancel
        </button>
      </header>

      {/* Decorative progress bar: the accessible progress is the "Step N of 8" text. */}
      <div aria-hidden="true" className="mt-3 flex gap-1.5">
        {STEPS.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${
              index < stepIndex ? 'bg-ice-500' : index === stepIndex ? 'bg-ice-200' : 'bg-space-600'
            }`}
          />
        ))}
      </div>

      <div key={step.id} className="motion-safe:animate-rise">
        <div className="mt-6 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-ice-300/40 bg-ice-400/12 text-ice-200"
          >
            <StepIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              ref={questionRef}
              tabIndex={-1}
              className="text-2xl leading-8 font-semibold text-balance text-fg outline-none sm:text-3xl sm:leading-9"
            >
              {step.question}
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-fg-muted">{step.help}</p>
          </div>
        </div>

        <div className="mt-6">
          {step.kind === 'mood' && (
            <div role="group" aria-labelledby={titleId}>
              <MoodPicker
                value={values.mood}
                onChange={(mood) => setValues((previous) => ({ ...previous, mood }))}
              />
            </div>
          )}

          {step.kind === 'symptoms' && (
            <div role="group" aria-labelledby={titleId}>
              <SymptomPicker
                selected={values.symptoms}
                onToggle={(symptom) =>
                  setValues((previous) => ({
                    ...previous,
                    symptoms: toggleSymptom(previous.symptoms, symptom),
                  }))
                }
              />
            </div>
          )}

          {step.kind === 'number' && (
            <div className={`grid gap-5 ${step.fields.length > 1 ? 'sm:grid-cols-2' : 'max-w-md'}`}>
              {step.fields.map((field) => {
                const error = errors[field]
                // Empty fields keep the Next button disabled without shouting "required".
                const visibleError = error !== undefined && values[field].trim() !== ''

                return (
                  <NumericControl
                    key={field}
                    id={`${baseId}-${field}`}
                    limit={NUMERIC_LIMITS[field]}
                    value={values[field]}
                    error={visibleError ? error : undefined}
                    onChange={(raw) => updateField(field, raw)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="button" onClick={goBack} disabled={stepIndex === 0} className="btn min-h-12 px-4">
          <ChevronLeft aria-hidden="true" className="size-5" />
          Back
        </button>

        <button
          type="submit"
          disabled={!canContinue}
          className="btn btn-primary min-h-14 flex-1 px-5 text-base sm:ml-auto sm:flex-none"
        >
          {isLastStep ? (
            <>
              <ShieldCheck aria-hidden="true" className="size-5" />
              Save and seal
            </>
          ) : (
            <>
              Next
              <ChevronRight aria-hidden="true" className="size-5" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}
