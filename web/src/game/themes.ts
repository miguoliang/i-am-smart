export type ThemeId = 'classic' | 'campus' | 'pastoral' | 'girly'

export type ThemeDef = {
  id: ThemeId
  label: string
  hint: string
  /** Optional full-bleed atmosphere art under public/. */
  backdrop?: string
}

export const THEMES: ThemeDef[] = [
  { id: 'classic', label: '经典', hint: '青草绿野' },
  { id: 'campus', label: '校园', hint: '樱花校道', backdrop: 'themes/theme_campus.webp' },
  { id: 'pastoral', label: '田园', hint: '午后田野', backdrop: 'themes/theme_pastoral.webp' },
  { id: 'girly', label: '少女', hint: '窗边花房', backdrop: 'themes/theme_girly.webp' },
]

const STORAGE_KEY = 'cititu-theme-v1'

export function themeById(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!
}

export function loadThemeId(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId
  } catch {
    // private mode / blocked storage
  }
  return 'classic'
}

export function saveThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore
  }
}
