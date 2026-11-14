import { useEffect, useState } from 'react'
import type { Distance, Reading } from './domain/types'
import { useAppStore } from './store/app-store'
import { useIntegrityStore } from './store/integrity-store'
import { DailyCheckForm } from './ui/daily-check/DailyCheckForm'
import { Dashboard } from './ui/dashboard/Dashboard'
import { IntegrityPanel } from './ui/integrity/IntegrityPanel'
import { GroundVerifier } from './ui/verifier/GroundVerifier'
import { verifyReportJson } from './crypto/parse-report'

type Tab = 'dashboard' | 'check' | 'integrity' | 'ground'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'check', label: 'Daily check' },
  { id: 'integrity', label: 'Integrity' },
  { id: 'ground', label: 'Ground Control' },
]

const DISTANCES: { id: Distance; label: string }[] = [
  { id: 'leo', label: 'Low Earth orbit' },
  { id: 'moon', label: 'Moon' },
  { id: 'mars', label: 'Mars' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { readings, triage, distance, setDistance, addReading, resetDemo } = useAppStore()
  const initIntegrity = useIntegrityStore((s) => s.init)
  const addToChain = useIntegrityStore((s) => s.addReading)
  const integrity = useIntegrityStore()

  // Sella el historial sintético inicial al arrancar la app.
  useEffect(() => {
    void initIntegrity(useAppStore.getState().readings)
  }, [initIntegrity])

  const handleSubmit = (r: Reading) => {
    addReading(r)
    void addToChain(r)
    setTab('dashboard')
  }

  const handleReset = () => {
    resetDemo()
    void initIntegrity(useAppStore.getState().readings)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">VitalSeal</h1>
            <p className="text-sm text-slate-300">
              Offline-first health monitoring with tamper-evident records
            </p>
          </div>

          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Mission distance</legend>
            <span className="text-sm text-slate-300" aria-hidden="true">
              Distance:
            </span>
            {DISTANCES.map((d) => (
              <label
                key={d.id}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-cyan-400 ${
                  distance === d.id
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                    : 'border-slate-600 text-slate-200 hover:border-slate-400'
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
                {d.label}
              </label>
            ))}
          </fieldset>
        </div>

        <nav aria-label="Main sections" className="mx-auto mt-4 flex max-w-6xl gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                tab === t.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Reset demo data
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        {tab === 'dashboard' && triage && (
          <Dashboard key={`${triage.generatedAt}-${distance}`} triage={triage} />
        )}
        {tab === 'check' && <DailyCheckForm onSubmit={handleSubmit} />}
        {tab === 'integrity' && (
          <IntegrityPanel
            verification={integrity.verification}
            sealCode={integrity.code}
            tampered={integrity.tampered}
            onTamper={(kind) => void integrity.simulateTamper(kind)}
            onRestore={() => void integrity.restore()}
            onVerify={() => void integrity.verify()}
          />
        )}
        {tab === 'ground' && (
          <GroundVerifier
            onVerify={verifyReportJson}
            sampleReportJson={integrity.report ? JSON.stringify(integrity.report, null, 2) : undefined}
          />
        )}
        <p className="mt-8 text-xs text-slate-400">
          {readings.length} synthetic demo readings loaded. Not real astronaut data.
        </p>
      </main>
    </div>
  )
}
