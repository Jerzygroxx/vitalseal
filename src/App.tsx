import { useEffect } from 'react'
import {
  House,
  LayoutDashboard,
  RadioTower,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Distance } from './domain/types'
import { useActionStore } from './store/action-store'
import { useAppStore } from './store/app-store'
import { useIntegrityStore } from './store/integrity-store'
import { useUiStore, type Tab } from './store/ui-store'
import { SpaceBackdrop, BACKDROP_FOCUS_ATTR } from './ui/backdrop/SpaceBackdrop'
import { BrandMark } from './ui/components/BrandMark'
import { formatLatency } from './ui/components/format'
import { OfflineStatus } from './ui/components/OfflineStatus'
import { SafeBoundary } from './ui/components/SafeBoundary'
import { Dashboard } from './ui/dashboard/Dashboard'
import { HomeFlow } from './ui/flow/HomeFlow'
import { reportFilename, reportToJson } from './ui/integrity/export'
import { IntegrityPanel } from './ui/integrity/IntegrityPanel'
import { GroundVerifier } from './ui/verifier/GroundVerifier'
import { verifyReportJson } from './crypto/parse-report'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'details', label: 'Details', icon: LayoutDashboard },
  { id: 'integrity', label: 'Integrity', icon: ShieldCheck },
  { id: 'ground', label: 'Ground Control', icon: RadioTower },
]

const DISTANCES: { id: Distance; label: string; short: string; dot: number }[] = [
  { id: 'leo', label: 'Low Earth orbit', short: 'LEO', dot: 14 },
  { id: 'moon', label: 'Moon', short: 'Moon', dot: 8 },
  { id: 'mars', label: 'Mars', short: 'Mars', dot: 3 },
]

/** Caption of the illustrated scene behind the app, per mission distance. */
const VIEWS: Record<Distance, { title: string; caption: string }> = {
  leo: {
    title: 'Low Earth orbit',
    caption: 'Earth fills the window. Ground can answer almost at once.',
  },
  moon: {
    title: 'Lunar distance',
    caption: 'Earth is a small globe over the horizon. Every answer takes seconds.',
  },
  mars: {
    title: 'Mars distance',
    caption: 'Earth is a pale blue dot. The crew has to act before ground can reply.',
  },
}

export default function App() {
  const tab = useUiStore((s) => s.tab)
  const setTab = useUiStore((s) => s.setTab)
  const go = useUiStore((s) => s.go)
  const { readings, triage, distance, setDistance, resetDemo } = useAppStore()
  const initIntegrity = useIntegrityStore((s) => s.init)
  const integrity = useIntegrityStore()

  // Sella el historial sintético inicial al arrancar la app.
  useEffect(() => {
    void initIntegrity(useAppStore.getState().readings)
  }, [initIntegrity])

  const handleReset = () => {
    resetDemo()
    useActionStore.getState().reset()
    go({ name: 'home' })
    void initIntegrity(useAppStore.getState().readings)
  }

  const view = VIEWS[distance]
  // What the crew would send to ground: the signed report with the entries as they are
  // stored right now (so a tampered record is rejected by Ground Control).
  const outgoing = integrity.report ? { ...integrity.report, entries: integrity.stored } : null

  return (
    <div className="relative isolate min-h-screen text-fg">
      <SafeBoundary>
        <SpaceBackdrop distance={distance} />
      </SafeBoundary>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="relative z-10 flex min-h-screen flex-col pb-20 md:pb-0">
        {/* Top bar. On phones the section nav sits under the title (not at the bottom),
            so the host's floating badge never covers it; pb-20 leaves room for that badge. */}
        <div className="z-40 border-b border-line bg-space-950/75 md:sticky md:top-0 md:bg-space-950/78 md:backdrop-blur-xl md:backdrop-saturate-150">
          <div className="mx-auto grid max-w-[76rem] gap-x-6 gap-y-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
            <header className="flex items-center gap-3">
              <BrandMark className="size-10 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg leading-6 font-semibold tracking-tight text-fg">
                  Vital<span className="text-ice-300">Seal</span>
                </h1>
                <p className="text-xs leading-4 text-fg-muted">
                  Offline-first health monitoring with tamper-evident records
                </p>
              </div>
            </header>

            <nav
              aria-label="Main sections"
              className="grid grid-cols-4 gap-1 rounded-2xl border border-line bg-space-900/70 p-1 md:col-span-2 md:row-start-2 md:flex md:rounded-none md:border-0 md:bg-transparent md:p-0"
            >
              {TABS.map((t) => {
                const current = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={current ? 'page' : undefined}
                    className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] leading-none font-medium transition-colors -outline-offset-2 md:min-h-10 md:flex-row md:gap-2 md:border md:px-3.5 md:py-2 md:text-sm md:outline-offset-2 ${
                      current
                        ? 'text-ice-200 md:border-ice-300/60 md:bg-ice-400/15'
                        : 'text-fg-muted hover:text-fg md:border-transparent md:hover:bg-space-700/70'
                    }`}
                  >
                    <t.icon aria-hidden="true" className="size-5 shrink-0 md:size-4" />
                    <span className="md:whitespace-nowrap">{t.label}</span>
                    {current && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-ice-300 md:hidden"
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
              <fieldset className="flex items-center gap-1 rounded-xl border border-line bg-space-900/80 p-1">
                <legend className="sr-only">Mission distance</legend>
                {DISTANCES.map((d) => (
                  <label
                    key={d.id}
                    className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ice-200 ${
                      distance === d.id
                        ? 'border-ice-300/60 bg-ice-400/15 text-ice-100'
                        : 'border-transparent text-fg-muted hover:text-fg'
                    }`}
                  >
                    <input
                      type="radio"
                      name="distance"
                      value={d.id}
                      checked={distance === d.id}
                      onChange={() => setDistance(d.id)}
                      className="sr-only"
                    />
                    {/* How big the Earth looks from there. */}
                    <span aria-hidden="true" className="flex size-4 items-center justify-center">
                      <span
                        className={`rounded-full ${distance === d.id ? 'bg-ice-300' : 'bg-fg-dim'}`}
                        style={{ width: d.dot, height: d.dot }}
                      />
                    </span>
                    <span className="lg:hidden" aria-hidden="true">
                      {d.short}
                    </span>
                    <span className="max-lg:sr-only">{d.label}</span>
                  </label>
                ))}
              </fieldset>

              <button type="button" onClick={handleReset} className="btn btn-warm min-h-9 px-3 py-1.5">
                <RotateCcw aria-hidden="true" className="size-4" />
                Reset demo data
              </button>
            </div>
          </div>
        </div>

        {/* Viewing window: the only place where the backdrop is left uncovered. */}
        <section
          aria-label="Window view"
          className="relative mx-auto flex w-full max-w-[76rem] flex-col px-4 pt-3 sm:h-44 sm:justify-end sm:px-6 lg:h-52"
        >
          <div {...{ [BACKDROP_FOCUS_ATTR]: '' }} className="h-28 sm:absolute sm:inset-0 sm:h-auto" />
          <div key={distance} className="glass relative px-4 py-3 motion-safe:animate-rise sm:max-w-md">
            <p className="eyebrow">Window view</p>
            <p className="mt-0.5 font-display text-lg leading-6 font-semibold text-fg">{view.title}</p>
            <p className="mt-1 text-sm text-fg-muted">{view.caption}</p>
            {triage && (
              <p className="mt-2 flex items-baseline gap-2 text-sm text-fg-muted">
                One-way signal delay
                <span className="num font-mono text-base font-semibold text-ember-300">
                  {formatLatency(triage.escalation.latencySeconds)}
                </span>
              </p>
            )}
          </div>
        </section>

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[76rem] flex-1 px-4 py-5 outline-none sm:px-6 md:scroll-mt-32">
          <div key={tab} className="motion-safe:animate-rise">
            {tab === 'home' && <HomeFlow />}
            {tab === 'details' && triage && (
              <Dashboard
                key={`${triage.generatedAt}-${distance}`}
                triage={triage}
                onNavigate={(t) => (t === 'check' ? go({ name: 'checkin' }) : setTab(t))}
              />
            )}
            {tab === 'integrity' && (
              <IntegrityPanel
                verification={integrity.verification}
                sealCode={integrity.code}
                tampered={integrity.tampered}
                entryCount={integrity.stored.length}
                reportJson={outgoing ? reportToJson(outgoing) : null}
                reportFilename={outgoing ? reportFilename(outgoing) : undefined}
                onTamper={(kind) => void integrity.simulateTamper(kind)}
                onRestore={() => void integrity.restore()}
                onVerify={() => void integrity.verify()}
              />
            )}
            {tab === 'ground' && (
              <GroundVerifier
                onVerify={verifyReportJson}
                sampleReportJson={outgoing ? reportToJson(outgoing) : undefined}
              />
            )}
          </div>
        </main>

        <footer className="mx-auto w-full max-w-[76rem] px-4 pb-6 sm:px-6">
          <div className="glass space-y-1.5 px-4 py-3 text-xs leading-5 text-fg-muted">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-fg">
                Research prototype, not a medical device. Not affiliated with NASA.
              </p>
              <OfflineStatus />
            </div>
            <p>
              <span className="num">{readings.length}</span> synthetic demo readings loaded. Not real
              astronaut data.
            </p>
            <p>
              Earth and body illustrations: original generative artwork by Team Space Exploit
              (AI-assisted).
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
