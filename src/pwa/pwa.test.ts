import { describe, expect, it } from 'vitest'
import { describeOffline } from './offline-status'
import { CACHE_PREFIX, serviceWorkerSource, versionOf } from './sw-build'

const FILES = ['/index.html', '/assets/index-abc.js', '/assets/index-abc.css', '/manifest.webmanifest']

describe('versionOf', () => {
  it('es determinista, no depende del orden y cambia si cambia un archivo', () => {
    expect(versionOf(FILES)).toBe(versionOf([...FILES].reverse()))
    expect(versionOf(FILES)).not.toBe(versionOf([...FILES.slice(0, 3), '/assets/index-xyz.js']))
  })
})

describe('serviceWorkerSource', () => {
  const src = serviceWorkerSource({ precache: FILES })

  it('es JavaScript sintácticamente válido', () => {
    expect(() => new Function(src)).not.toThrow()
  })
  it('precachea exactamente los archivos dados (sin duplicados)', () => {
    const dup = serviceWorkerSource({ precache: [...FILES, ...FILES] })
    const list = /const PRECACHE = (\[.*\]);/.exec(dup)?.[1]
    expect(JSON.parse(list!)).toEqual([...FILES].sort())
  })
  it('usa una caché con prefijo y versión', () => {
    expect(src).toContain(`"${CACHE_PREFIX}${versionOf(FILES)}"`)
  })
  it('solo atiende GET del mismo origen y tiene respaldo de navegación', () => {
    expect(src).toContain("req.method !== 'GET'")
    expect(src).toContain('url.origin !== self.location.origin')
    expect(src).toContain("req.mode === 'navigate'")
    expect(src).toContain('caches.match(SHELL)')
  })
  it('borra cachés antiguas al activarse', () => {
    expect(src).toContain('caches.delete')
    expect(src).toContain('self.clients.claim()')
  })
  it('no referencia dominios externos', () => {
    expect(src).not.toMatch(/https?:\/\//)
  })
})

describe('describeOffline', () => {
  it('cubre las cuatro combinaciones', () => {
    expect(describeOffline({ online: true, ready: true }).tone).toBe('ready')
    expect(describeOffline({ online: false, ready: true }).tone).toBe('offline')
    expect(describeOffline({ online: true, ready: false }).tone).toBe('online')
    expect(describeOffline({ online: false, ready: false }).tone).toBe('uncached')
  })
})
