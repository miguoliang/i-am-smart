import { slugId, type Course, type LessonPack } from './types.ts'

/** Display order Monday → Sunday. Values match `Date#getDay()`. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const WEEKDAY_LABEL_ZH: Record<number, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
}

export const SCHEDULE_WEEK_CHOICES = [4, 8, 12] as const

export interface CourseDraft {
  courseId: string
  titleZh: string
  blurb: string
  weekdays: number[]
  weeks: number
  error: string
}

export function emptyCourseDraft(): CourseDraft {
  return {
    courseId: '',
    titleZh: '',
    blurb: '',
    weekdays: [2, 4],
    weeks: 4,
    error: '',
  }
}

export function courseToDraft(course: Course): CourseDraft {
  return {
    courseId: course.id,
    titleZh: weekdaysLabel(course.weekdays),
    blurb: scheduleNote(course),
    weekdays: normalizeWeekdays(course.weekdays),
    weeks: 4,
    error: '',
  }
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map((part) => Number(part))
  return new Date(year || 0, (month || 1) - 1, day || 1)
}

export function todayYmd(now = new Date()): string {
  return formatYmd(now)
}

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABEL_ZH[day] ?? `周${day}`
}

export function weekdaysLabel(days: number[]): string {
  return normalizeWeekdays(days).map(weekdayLabel).join('、') || '未选上课日'
}

/** Optional note on a weekday schedule (not a product-facing course name). */
export function scheduleNote(course: Pick<Course, 'titleZh' | 'blurb' | 'weekdays'>): string {
  const rule = weekdaysLabel(course.weekdays)
  const blurb = course.blurb?.trim() || ''
  if (blurb) return blurb
  const title = course.titleZh.trim()
  if (title && title !== rule) return title
  return ''
}

export function lessonBlurbForSchedule(
  course: Pick<Course, 'titleZh' | 'blurb' | 'weekdays'>,
): string {
  return scheduleNote(course) || weekdaysLabel(course.weekdays)
}

export function normalizeWeekdays(days: number[]): number[] {
  const wanted = new Set(
    days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  )
  return WEEKDAY_ORDER.filter((day) => wanted.has(day))
}

export function lessonTitleForYmd(ymd: string): string {
  const date = parseYmd(ymd)
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdayLabel(date.getDay())}`
}

export function isYmdToday(ymd: string, now = new Date()): boolean {
  return ymd === todayYmd(now)
}

export function isYmdPast(ymd: string, now = new Date()): boolean {
  return ymd < todayYmd(now)
}

/**
 * Next `countPerDay` dates for each weekday, including today when it matches.
 */
export function upcomingYmds(
  weekdays: number[],
  from: Date,
  countPerDay: number,
): string[] {
  const days = normalizeWeekdays(weekdays)
  if (!days.length || countPerDay <= 0) return []
  const start = startOfLocalDay(from)
  const out: string[] = []
  for (const dow of days) {
    const cursor = new Date(start)
    const delta = (dow - cursor.getDay() + 7) % 7
    cursor.setDate(cursor.getDate() + delta)
    for (let i = 0; i < countPerDay; i += 1) {
      out.push(formatYmd(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
  }
  out.sort()
  return out
}

/** Next `countPerDay` not-yet-scheduled dates per weekday. */
export function nextMissingYmds(
  weekdays: number[],
  existing: Iterable<string>,
  countPerDay: number,
  from: Date = new Date(),
): string[] {
  const have = new Set(
    [...existing].map((value) => value.trim()).filter(Boolean),
  )
  const horizon = upcomingYmds(weekdays, from, Math.max(countPerDay * 8, 24))
  const byDay = new Map<number, string[]>()
  for (const ymd of horizon) {
    if (have.has(ymd)) continue
    const dow = parseYmd(ymd).getDay()
    const list = byDay.get(dow) ?? []
    if (list.length >= countPerDay) continue
    list.push(ymd)
    byDay.set(dow, list)
  }
  return [...byDay.values()].flat().sort()
}

export function newCourseId(titleZh: string): string {
  return `course-${slugId(titleZh) || 'pack'}-${Date.now().toString(36)}`
}

export function scheduledLessonId(courseId: string, ymd: string): string {
  return `class-${courseId}-${ymd}`
}

export function hydrateCourse(raw: Course): Course {
  return {
    id: raw.id.trim(),
    titleZh: raw.titleZh.trim(),
    blurb: raw.blurb?.trim() || '',
    weekdays: normalizeWeekdays(raw.weekdays ?? []),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function scheduledYmdsForCourse(
  packs: LessonPack[],
  courseId: string,
): string[] {
  return packs
    .filter((pack) => pack.courseId === courseId && pack.scheduledOn)
    .map((pack) => pack.scheduledOn as string)
}

function sortCourseLessons(packs: LessonPack[], today: string): LessonPack[] {
  const upcoming = packs
    .filter((pack) => (pack.scheduledOn || '9999-99-99') >= today)
    .sort((a, b) => (a.scheduledOn || '').localeCompare(b.scheduledOn || ''))
  const past = packs
    .filter((pack) => (pack.scheduledOn || '') < today)
    .sort((a, b) => (b.scheduledOn || '').localeCompare(a.scheduledOn || ''))
  return [...upcoming, ...past]
}

export function groupPacksByCourse(
  packs: LessonPack[],
  courses: Course[],
  today = todayYmd(),
): {
  courses: { course: Course; packs: LessonPack[] }[]
  oneOffs: LessonPack[]
} {
  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const byCourse = new Map<string, LessonPack[]>()
  const oneOffs: LessonPack[] = []
  for (const pack of packs) {
    if (pack.source !== 'custom') continue
    const courseId = pack.courseId
    if (courseId && courseMap.has(courseId)) {
      const list = byCourse.get(courseId) ?? []
      list.push(pack)
      byCourse.set(courseId, list)
    } else {
      oneOffs.push(pack)
    }
  }
  return {
    courses: courses.map((course) => ({
      course,
      packs: sortCourseLessons(byCourse.get(course.id) ?? [], today),
    })),
    oneOffs,
  }
}
