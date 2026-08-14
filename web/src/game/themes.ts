export type ThemeId = 'classic' | 'campus' | 'pastoral' | 'girly'

export type ThemeDef = {
  id: ThemeId
  label: string
  /** Optional full-bleed atmosphere art under public/. */
  backdrop?: string
}

export const THEMES: ThemeDef[] = [
  { id: 'classic', label: '经典' },
  { id: 'campus', label: '校园', backdrop: 'themes/theme_campus.webp' },
  { id: 'pastoral', label: '田园', backdrop: 'themes/theme_pastoral.webp' },
  { id: 'girly', label: '少女', backdrop: 'themes/theme_girly.webp' },
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
