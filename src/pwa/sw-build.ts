/**
 * Genera el código del service worker (sin dependencias externas).
 *
 * Estrategia, pensada para que la app funcione en modo avión tras la primera carga:
 * - install: precachea el "app shell" (HTML, JS/CSS con hash, manifest, íconos). La
 *   lista la calcula el build con los nombres reales de los archivos.
 * - navegación: red primero (para ver versiones nuevas) y, si no hay red, el
 *   index.html cacheado. La app es una SPA, así que cualquier ruta cae ahí.
 * - recursos del mismo origen: caché primero y, si faltan, red y se guardan.
 * - activate: borra cachés de versiones anteriores y toma el control de inmediato.
 * Nada de terceros: todo lo que se sirve y cachea es del mismo origen.
 */
export const CACHE_PREFIX = 'vitalseal-'

/** Hash corto y determinista (djb2) del contenido de la lista: cambia si cambia un archivo. */
export function versionOf(files: readonly string[]): string {
  let h = 5381
  for (const ch of [...files].sort().join('|')) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0
  return h.toString(36)
}

export interface ServiceWorkerOptions {
  /** Rutas absolutas desde la raíz del sitio, p. ej. "/assets/index-abc.js". */
  precache: readonly string[]
  version?: string
}

export function serviceWorkerSource({ precache, version }: ServiceWorkerOptions): string {
  const unique = [...new Set(precache)].sort()
  const v = version ?? versionOf(unique)
  return `// Generated at build time. Do not edit.
const CACHE = ${JSON.stringify(CACHE_PREFIX + v)};
const PRECACHE = ${JSON.stringify(unique)};
const SHELL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith(${JSON.stringify(CACHE_PREFIX)}) && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`
}
