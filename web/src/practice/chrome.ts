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
