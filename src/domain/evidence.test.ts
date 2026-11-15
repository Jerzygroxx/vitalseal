import { describe, expect, it } from 'vitest'
import { allSourceUrls, PROGRAM_CONTEXT, SYSTEM_SOURCES } from './evidence'
import type { SystemId } from './types'

const SYSTEMS: SystemId[] = ['neuro', 'cardio', 'metabolic', 'musculoskeletal', 'radiation']
const ALLOWED_HOSTS = ['www.nasa.gov', 'www.asc-csa.gc.ca']
const everyText = () =>
  [
    ...Object.values(SYSTEM_SOURCES).flat().flatMap((e) => [e.title, e.summary, e.note ?? '', ...e.actions]),
    ...PROGRAM_CONTEXT.flatMap((p) => [p.title, p.summary, p.vitalSealParallel]),
  ].join(' ')

describe('fuentes oficiales por sistema', () => {
  it('cada sistema del cuerpo tiene al menos una fuente con resumen y acciones', () => {
    for (const id of SYSTEMS) {
      const entries = SYSTEM_SOURCES[id]
      expect(entries.length).toBeGreaterThan(0)
      for (const e of entries) {
        expect(e.summary.length).toBeGreaterThan(40)
        expect(e.actions.length).toBeGreaterThan(0)
      }
    }
  })
  it('todas las URLs son https y de dominios oficiales (NASA o CSA)', () => {
    for (const url of allSourceUrls()) {
      const u = new URL(url)
      expect(u.protocol).toBe('https:')
      expect(ALLOWED_HOSTS).toContain(u.hostname)
    }
  })
  it('no hay URLs duplicadas dentro de la lista citada', () => {
    const urls = allSourceUrls()
    expect(new Set(urls).size).toBe(urls.length)
  })
  it('el texto no usa palabras prohibidas por las reglas del reto', () => {
    expect(everyText()).not.toMatch(/diagnos|treat|cure|prescri/i)
  })
  it('las fuentes de la CSA llevan agency CSA y las de NASA, NASA', () => {
    for (const e of Object.values(SYSTEM_SOURCES).flat()) {
      expect(e.agency).toBe(e.url.includes('asc-csa.gc.ca') ? 'CSA' : 'NASA')
    }
  })
  it('el contexto de programas explica el paralelo con VitalSeal', () => {
    expect(PROGRAM_CONTEXT.length).toBeGreaterThanOrEqual(3)
    for (const p of PROGRAM_CONTEXT) expect(p.vitalSealParallel.length).toBeGreaterThan(20)
  })
})
