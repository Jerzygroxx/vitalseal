/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { serviceWorkerSource } from './src/pwa/sw-build'

/** Archivos de /public que forman parte del app shell offline. Deben existir. */
const PUBLIC_SHELL = ['/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']

/**
 * Emite /sw.js al construir, con la lista real de archivos (los JS/CSS llevan hash
 * en el nombre, por eso no se puede escribir a mano). Sin dependencias externas.
 */
function offlineShell(): Plugin {
  return {
    name: 'vitalseal-offline-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle)
        .filter((f) => f !== 'sw.js')
        .map((f) => `/${f}`)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorkerSource({ precache: ['/', ...built, ...PUBLIC_SHELL] }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), offlineShell()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
