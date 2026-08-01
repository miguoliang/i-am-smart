/** Tiny helpers that make the page feel closer to a native game client. */

export function haptic(pattern: number | number[] = 12): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // unsupported
  }
}

export function unlockAudio(): void {
  if (!('speechSynthesis' in window)) return
  // Warm the speech engine after a user gesture (iOS requirement).
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance('')
  utter.volume = 0
  window.speechSynthesis.speak(utter)
  window.speechSynthesis.cancel()
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => reg.update())
      .catch(() => {
        // ignore registration failures on file:// or blocked contexts
      })
  })
}

export function bindNativeChrome(): void {
  // Stop iOS rubber-band / pull-to-refresh from stealing game swipes.
  document.addEventListener(
    'touchmove',
    (e) => {
      if ((e.target as HTMLElement | null)?.closest?.('.board')) {
        e.preventDefault()
      }
    },
    { passive: false },
  )

  // Keep layout correct when mobile browser chrome shows/hides.
  const vv = window.visualViewport
  if (!vv) return
  const sync = () => {
    document.documentElement.style.setProperty('--vvh', `${vv.height}px`)
  }
  vv.addEventListener('resize', sync)
  vv.addEventListener('scroll', sync)
  sync()
}
