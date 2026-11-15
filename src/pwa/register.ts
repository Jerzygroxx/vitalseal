/**
 * Registra el service worker solo en el build de producción (en desarrollo
 * estorbaría al recargar en caliente). Un fallo de registro nunca rompe la app.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin SW la app sigue funcionando online */
    })
  })
}
