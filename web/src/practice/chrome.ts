export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => reg.update())
      .catch(() => {
        /* ignore */
      })
  })
}

export function bindViewport(): void {
  const vv = window.visualViewport
  if (!vv) return
  const sync = () => {
    const next = `${vv.height}px`
    if (document.documentElement.style.getPropertyValue('--vvh') === next) return
    document.documentElement.style.setProperty('--vvh', next)
  }
  vv.addEventListener('resize', sync)
  vv.addEventListener('scroll', sync)
  sync()
}
