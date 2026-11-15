import {
  ChevronRight,
  CircleCheck,
  CircleQuestionMark,
  Earth,
  ListChecks,
  Rocket,
  ShieldCheck,
  Siren,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import type { Distance, Status, SystemId, TriageResult } from '../../domain/types'
import { BodyMap } from '../body-map/BodyMap'
import { distanceLabel, formatLatency } from '../components/format'
import { STATUS_TONES } from '../components/status-tone'
import { StatusRing } from './StatusRing'

export interface HomeScreenProps {
  triage: TriageResult
  distance: Distance
  /** "I'm fine: quick check" */
  onFine: () => void
  /** "Something feels off" */
  onOff: () => void
  /** "Emergency" */
  onEmergency: () => void
  /** The crew tapped a body zone: open that system's checklist. */
  onSelectSystem: (id: SystemId) => void
}

/** Overall state in plain words (the ring adds an icon and a number). */
const HEADLINE: Record<Status, string> = {
  green: 'All clear',
  amber: 'Needs attention',
  red: 'Act now',
}

/** What the signal delay means for the crew, in a few words. */
const DELAY_MEANING: Record<Distance, string> = {
  leo: 'ground answers almost at once',
  moon: 'ground answers in seconds',
  mars: 'you act first, ground answers later',
}

const VALUES: { icon: LucideIcon; text: string }[] = [
  { icon: ListChecks, text: 'Step-by-step actions' },
  { icon: ShieldCheck, text: 'Every step time-stamped and sealed' },
  { icon: WifiOff, text: 'Works offline' },
]

function systemsSummary(triage: TriageResult): string {
  const total = triage.systems.length
  const attention = triage.systems.filter((system) => system.status !== 'green').length
  if (total === 0) return 'No system data yet'
  if (attention === 0) return `All ${total} systems in range`
  return `${attention} of ${total} need a look`
}

/**
 * Home screen (T-07): one guided question with three big answers, next to a small
 * command center (overall status ring + body map). Presentation only: every
 * decision comes in through `triage`, every action goes out through the callbacks.
 */
export function HomeScreen({
  triage,
  distance,
  onFine,
  onOff,
  onEmergency,
  onSelectSystem,
}: HomeScreenProps) {
  const { overall, systems, escalation } = triage
  const tone = STATUS_TONES[overall]
  // Average of the system scores: one number for the dial, the words carry the status.
  const score =
    systems.length === 0 ? 0 : systems.reduce((sum, system) => sum + system.score, 0) / systems.length
  const summary = systemsSummary(triage)
  const latency = formatLatency(escalation.latencySeconds)

  return (
    <div className="grid gap-4 text-fg sm:gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:grid-rows-[auto_1fr]">
      {/* 1. Guided question: the one obvious path. */}
      <section
        aria-labelledby="home-question"
        className="glass hud p-4 sm:p-8 lg:col-start-1 lg:row-start-1 lg:p-10"
      >
        <p className="text-base font-medium text-ice-200 sm:text-lg">Hello, astronaut</p>
        <h2
          id="home-question"
          className="mt-2 text-[2.625rem] leading-[1.04] font-semibold tracking-tight text-balance text-fg sm:text-6xl lg:text-[4.25rem]"
        >
          How do you feel today?
        </h2>

        <p className="mt-4 flex items-start gap-2.5 text-sm leading-5 text-fg-muted sm:text-base sm:leading-6">
          <span aria-hidden="true" className="mt-0.5 flex shrink-0 items-center gap-1 text-ice-300">
            <Rocket className="size-4" />
            <span className="h-px w-4 bg-[repeating-linear-gradient(90deg,var(--color-ice-400)_0_3px,transparent_3px_6px)]" />
            <Earth className="size-4" />
          </span>
          <span>
            <strong className="font-semibold text-fg">{distanceLabel(distance)}</strong>
            {' · '}
            <span className="num font-semibold text-ember-300">{latency}</span> each way:{' '}
            {DELAY_MEANING[distance]}
          </span>
        </p>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
          <button
            type="button"
            onClick={onFine}
            className="home-choice home-choice-fine motion-safe:animate-rise"
          >
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14 bg-space-950/15"
            >
              <CircleCheck className="size-7 sm:size-8" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.1875rem] leading-7 font-semibold sm:text-2xl">
                I&rsquo;m fine
              </span>
              <span className="block text-sm leading-5 font-medium text-space-800 sm:text-base">
                Quick check, 1 minute
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-6 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOff}
            className="home-choice home-choice-off motion-safe:animate-rise"
            style={{ animationDelay: '70ms' }}
          >
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14 border border-ember-300/40 bg-ember-400/15 text-ember-300"
            >
              <CircleQuestionMark className="size-7 sm:size-8" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.1875rem] leading-7 font-semibold sm:text-2xl">
                Something feels off
              </span>
              <span className="block text-sm leading-5 text-fg-muted sm:text-base">
                Get simple steps
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-6 shrink-0 text-fg-dim" />
          </button>

          <button
            type="button"
            onClick={onEmergency}
            className="home-choice home-choice-emergency motion-safe:animate-rise"
            style={{ animationDelay: '140ms' }}
          >
            <span
              aria-hidden="true"
              className="home-ping flex size-12 shrink-0 sm:size-14 items-center justify-center rounded-2xl bg-alert text-space-950"
            >
              <Siren className="size-7 sm:size-8" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-display text-[1.1875rem] leading-7 font-semibold sm:text-2xl">
                  Emergency
                </span>
                <span className="rounded-full border border-alert/60 bg-alert/15 px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold tracking-[0.12em] text-alert-soft uppercase">
                  Urgent
                </span>
              </span>
              <span className="block text-sm leading-5 text-alert-soft sm:text-base">
                Act now, every step is recorded
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-6 shrink-0 text-alert-soft" />
          </button>
        </div>
      </section>

      {/* 2. Command center: overall status + body map. */}
      <section
        aria-label="Crew status"
        className="glass p-5 sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <StatusRing
            status={overall}
            score={score}
            caption="Avg score"
            label={`Overall status: ${HEADLINE[overall]}. ${summary}. Average system score ${Math.round(score)} out of 100.`}
            className="w-32 shrink-0 sm:w-40"
          />
          <div className="min-w-0">
            <p className="eyebrow">Crew status</p>
            <p
              className={`mt-1 font-display text-[1.75rem] leading-8 font-semibold tracking-tight sm:text-4xl sm:leading-10 ${tone.text}`}
            >
              {HEADLINE[overall]}
            </p>
            <p className="mt-1.5 text-sm leading-5 text-fg-muted">{summary}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="eyebrow text-center text-ice-200">Tap a body system</p>
          <div className="mx-auto mt-2 max-w-[20rem]">
            <BodyMap systems={systems} selected={null} onSelect={onSelectSystem} />
          </div>
        </div>
      </section>

      {/* 3. What the product gives the crew, in three short lines. */}
      <ul
        aria-label="What VitalSeal gives the crew"
        className="grid gap-2.5 sm:grid-cols-3 sm:gap-4 lg:col-start-1 lg:row-start-2"
      >
        {VALUES.map((value) => (
          <li
            key={value.text}
            className="glass flex items-center gap-3 px-4 py-3 text-sm leading-5 font-medium text-fg sm:text-base lg:flex-col lg:justify-center lg:gap-4 lg:px-5 lg:py-6 lg:text-center lg:text-lg lg:leading-6"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-ice-300/30 bg-ice-400/12 text-ice-300 lg:size-14 lg:rounded-2xl"
            >
              <value.icon className="size-5 lg:size-7" />
            </span>
            {value.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
