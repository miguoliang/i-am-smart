import './style.css'
import {
  cueText,
  questionsForWord,
  reviewCueHidden,
  reviewCueRevealed,
  reviewFrames,
  sentenceCue,
  sentenceReviewCueHidden,
  sentenceReviewCueRevealed,
  tipText,
  vocabCue,
  type QuestionTemplate,
} from './data/questions'
import { preloadPackImages, resolveImageSrc, wordImageSrc, fileToDataUrl } from './content/images'
import {
  MAX_SENTENCES,
  MAX_WORDS,
  PackParseError,
  downloadPackJson,
  parseContentPackJson,
} from './content/schema'
import {
  deleteCustomPack,
  getPackById,
  listAllPacks,
  pushLocalPackToCloud,
  saveCustomPack,
  syncFromCloud,
} from './content/store'
import {
  ensureCloudSession,
  getCloudSessionUserId,
} from './content/cloud'
import { isSupabaseConfigured } from './lib/supabase'
import {
  POS_LABEL_ZH,
  WORD_POS,
  guessArticle,
  hasImage,
  packCountLabel,
  packHasContent,
  zhOrPending,
  type LessonPack,
  type SentenceDef,
  type WordDef,
  type WordPos,
} from './content/types'
import {
  buildReviewItems,
  distinctPosCount,
  firstPhaseForMode,
  mergePacks,
  modeLabelZh,
  phaseAfterForMode,
  phasesForMode,
  posCounts,
  slicePack,
  type PracticeMode,
  type ReviewItem,
} from './content/practice'
import {
  draftToPack,
  emptyDraft,
  emptySentenceForm,
  emptyWordForm,
  moveDraftItem,
  packToDraft,
  posExtra,
  sentenceFromForm,
  wordFromForm,
  type DraftWord,
  type PackDraft,
} from './content/editor'
import { bindViewport } from './practice/chrome'
import { speakEnglish, unlockAudio } from './practice/tts'

bindViewport()

function requireApp(): HTMLDivElement {
  const node = document.querySelector<HTMLDivElement>('#app')
  if (!node) throw new Error('#app missing')
  return node
}

const app = requireApp()

type Screen = 'home' | 'create' | 'start' | 'session'
type PracticePhase = 'vocab' | 'talk' | 'sentences' | 'review'
type Phase = PracticePhase | 'done'

interface Session {
  pack: LessonPack
  mode: PracticeMode
  posFilter?: WordPos
  /** Original class id; empty when mixing several classes from home. */
  originPackId: string
  phase: Phase
  wordIndex: number
  questionIndex: number
  sentenceIndex: number
  reviewIndex: number
  reviewItems: ReviewItem[]
  revealAnswer: boolean
  reviewReveal: boolean
}

let screen: Screen = 'home'
let session: Session | null = null
let startPack: LessonPack | null = null
let packCache: LessonPack[] = []
let homeError = ''
let homeStatus = ''
let cloudBusy = false
let cloudUserId: string | null = null
let draft: PackDraft = emptyDraft()

function reviewQueue(): ReviewItem[] {
  return session?.reviewItems ?? []
}

function packsForHomeMixed(): LessonPack[] {
  const custom = packCache.filter(
    (pack) => pack.source === 'custom' && packHasContent(pack),
  )
  if (custom.length) return custom
  return packCache.filter(packHasContent)
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function clearApp(): void {
  app.replaceChildren()
}

async function refreshPacks(): Promise<void> {
  packCache = await listAllPacks()
  if (isSupabaseConfigured()) {
    cloudUserId = await getCloudSessionUserId()
  } else {
    cloudUserId = null
  }
}

async function connectCloud(): Promise<void> {
  if (!isSupabaseConfigured()) {
    homeError = '未配置 Supabase（缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）'
    render()
    return
  }
  cloudBusy = true
  homeError = ''
  homeStatus = '正在连接云端…'
  render()
  try {
    const session = await ensureCloudSession()
    cloudUserId = session?.userId ?? null
    packCache = await syncFromCloud()
    homeStatus = '已同步云端课包'
  } catch (err) {
    homeError = err instanceof Error ? err.message : '云端连接失败'
    homeStatus = ''
  } finally {
    cloudBusy = false
    render()
  }
}

function beginPractice(
  source: LessonPack,
  mode: PracticeMode,
  opts: { pos?: WordPos; originPackId?: string } = {},
): void {
  const working = slicePack(source, { mode, pos: opts.pos })
  if (!packHasContent(working)) return
  unlockAudio()
  void preloadPackImages(working)
  const mixed = mode === 'mixed'
  session = {
    pack: working,
    mode,
    posFilter: opts.pos,
    originPackId: opts.originPackId ?? (source.id === 'mixed-review' ? '' : source.id),
    phase: firstPhaseForMode(working, mode),
    wordIndex: 0,
    questionIndex: 0,
    sentenceIndex: 0,
    reviewIndex: 0,
    reviewItems: buildReviewItems(working, { shuffle: mixed }),
    revealAnswer: false,
    reviewReveal: false,
  }
  startPack = null
  screen = 'session'
  render()
}

function openStart(pack: LessonPack): void {
  startPack = pack
  screen = 'start'
  render()
}

function startHomeMixed(): void {
  const packs = packsForHomeMixed()
  if (!packs.length) return
  const merged = mergePacks(packs, {
    titleZh: '综合巩固',
    titleEn: 'Mixed review',
  })
  beginPractice(merged, 'mixed', { originPackId: '' })
}

function replaySession(): void {
  if (!session) return
  const mode = session.mode
  const pos = session.posFilter
  const originId = session.originPackId
  if (!originId) {
    startHomeMixed()
    return
  }
  void getPackById(originId).then((pack) => {
    if (!pack) return
    beginPractice(pack, mode, { pos, originPackId: originId })
  })
}

function goHome(): void {
  session = null
  startPack = null
  screen = 'home'
  homeError = ''
  void refreshPacks().then(render)
}

function openCreate(): void {
  draft = emptyDraft()
  screen = 'create'
  render()
}

function openEdit(pack: LessonPack): void {
  draft = packToDraft(pack)
  screen = 'create'
  render()
}

function openCopy(pack: LessonPack): void {
  draft = packToDraft(pack, { asCopy: true })
  screen = 'create'
  render()
}

function currentWord(): WordDef | null {
  if (!session) return null
  return session.pack.words[session.wordIndex] ?? null
}

function currentSentence(): SentenceDef | null {
  if (!session) return null
  return session.pack.sentences[session.sentenceIndex] ?? null
}

function currentReviewItem(): ReviewItem | null {
  return reviewQueue()[session?.reviewIndex ?? -1] ?? null
}

function talkQueue(word: WordDef | null): QuestionTemplate[] {
  return word ? questionsForWord(word) : []
}

function currentQuestion(): QuestionTemplate | null {
  const word = currentWord()
  return talkQueue(word)[session?.questionIndex ?? -1] ?? null
}

function nextVocab(): void {
  if (!session) return
  if (session.wordIndex >= session.pack.words.length - 1) {
    session.phase = 'talk'
    session.wordIndex = 0
    session.questionIndex = 0
    session.revealAnswer = false
  } else {
    session.wordIndex += 1
  }
  render()
}

function prevVocab(): void {
  if (!session || session.wordIndex <= 0) return
  session.wordIndex -= 1
  render()
}

function nextTalk(): void {
  if (!session) return
  const word = currentWord()
  const qs = talkQueue(word)
  session.revealAnswer = false
  if (session.questionIndex < qs.length - 1) {
    session.questionIndex += 1
  } else if (session.wordIndex < session.pack.words.length - 1) {
    session.wordIndex += 1
    session.questionIndex = 0
  } else {
    session.phase = phaseAfterForMode(session.pack, session.mode, 'talk')
    session.sentenceIndex = 0
    session.reviewIndex = 0
    session.reviewReveal = false
  }
  render()
}

function prevTalk(): void {
  if (!session) return
  session.revealAnswer = false
  if (session.questionIndex > 0) {
    session.questionIndex -= 1
  } else if (session.wordIndex > 0) {
    session.wordIndex -= 1
    const prev = session.pack.words[session.wordIndex]
    session.questionIndex = Math.max(0, talkQueue(prev).length - 1)
  }
  render()
}

function nextSentence(): void {
  if (!session) return
  if (session.sentenceIndex >= session.pack.sentences.length - 1) {
    session.phase = phaseAfterForMode(session.pack, session.mode, 'sentences')
    session.reviewIndex = 0
    session.reviewReveal = false
  } else {
    session.sentenceIndex += 1
  }
  render()
}

function prevSentence(): void {
  if (!session || session.sentenceIndex <= 0) return
  session.sentenceIndex -= 1
  render()
}

function nextReview(): void {
  if (!session) return
  if (!session.reviewReveal) {
    session.reviewReveal = true
    render()
    return
  }
  const total = reviewQueue().length
  if (session.reviewIndex >= total - 1) {
    session.phase = 'done'
  } else {
    session.reviewIndex += 1
    session.reviewReveal = false
  }
  render()
}

function renderPhaseRail(pack: LessonPack, active: Phase): HTMLElement {
  const phases = session
    ? phasesForMode(pack, session.mode)
    : phasesForMode(pack, 'full')
  const rail = el('nav', 'phase-rail')
  rail.setAttribute('aria-label', '练习阶段')
  const activeIdx =
    active === 'done' ? phases.length : phases.findIndex((p) => p.id === active)
  for (const [index, phase] of phases.entries()) {
    const item = el('div', 'phase-item')
    if (phase.id === active) item.classList.add('is-active')
    if (active === 'done' || index < activeIdx) item.classList.add('is-done')
    item.append(el('span', 'phase-dot'), el('span', 'phase-label', phase.label))
    rail.append(item)
  }
  return rail
}

function renderShell(opts: {
  phase: Phase
  title: string
  subtitle?: string
  body: HTMLElement
  footer?: HTMLElement
}): void {
  if (!session) return
  clearApp()
  const shell = el('div', 'shell')

  const top = el('header', 'topbar')
  const back = el('button', 'btn-ghost', '返回')
  back.type = 'button'
  back.addEventListener('click', () => {
    if (confirm('结束本次陪练，回到首页？')) goHome()
  })
  top.append(back, el('div', 'brand-mark', '陪练本'))
  shell.append(top)

  if (opts.phase !== 'done') shell.append(renderPhaseRail(session.pack, opts.phase))

  const main = el('main', 'main')
  const heading = el('div', 'heading')
  heading.append(el('h1', 'title', opts.title))
  if (opts.subtitle) heading.append(el('p', 'subtitle', opts.subtitle))
  main.append(heading, opts.body)
  shell.append(main)
  if (opts.footer) shell.append(opts.footer)
  app.append(shell)
}

async function importPackText(text: string): Promise<void> {
  try {
    const pack = parseContentPackJson(text)
    await saveCustomPack(pack)
    homeError = ''
    await refreshPacks()
    render()
  } catch (err) {
    homeError =
      err instanceof PackParseError
        ? err.message
        : err instanceof Error
          ? err.message
          : '导入失败'
    render()
  }
}

async function importPackFile(file: File): Promise<void> {
  await importPackText(await file.text())
}

async function importSamplePack(): Promise<void> {
  try {
    const url = `${import.meta.env.BASE_URL}content/sample-class.peilian.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error('示例课包下载失败')
    await importPackText(await res.text())
  } catch (err) {
    homeError = err instanceof Error ? err.message : '示例导入失败'
    render()
  }
}

function renderPackThumbs(pack: LessonPack): HTMLElement {
  const thumbs = el('div', 'pack-thumbs')
  const words = pack.words.slice(0, 4)
  if (words.length) {
    for (const word of words) thumbs.append(renderThumb(word, 'pack-thumb'))
    return thumbs
  }
  for (const sentence of pack.sentences.slice(0, 4)) {
    const tile = el('div', 'pack-thumb pack-thumb-word')
    tile.textContent = sentence.english.slice(0, 8)
    tile.title = sentence.english
    thumbs.append(tile)
  }
  return thumbs
}

function renderPackCard(pack: LessonPack): HTMLElement {
  const wrap = el('div', 'pack-card-wrap')
  const card = el('button', 'pack-card')
  card.type = 'button'
  const meta = el('div', 'pack-meta')
  const badge =
    pack.source === 'custom'
      ? el('span', 'pack-badge', '我的')
      : el('span', 'pack-badge pack-badge-demo', '示例')
  const titleRow = el('div', 'pack-title-row')
  titleRow.append(el('div', 'pack-title', pack.titleZh), badge)
  meta.append(
    titleRow,
    el('div', 'pack-en', pack.titleEn),
    el('div', 'pack-blurb', `${packCountLabel(pack)} · ${pack.blurb}`),
  )
  card.append(renderPackThumbs(pack), meta)
  card.addEventListener('click', () => openStart(pack))
  wrap.append(card)

  const tools = el('div', 'pack-tools')
  if (pack.source === 'custom') {
    const edit = el('button', 'btn-tiny', '编辑')
    edit.type = 'button'
    edit.addEventListener('click', (e) => {
      e.stopPropagation()
      openEdit(pack)
    })
    const exp = el('button', 'btn-tiny', '导出备份')
    exp.type = 'button'
    exp.addEventListener('click', (e) => {
      e.stopPropagation()
      downloadPackJson(pack)
    })
    if (isSupabaseConfigured()) {
      const sync = el(
        'button',
        'btn-tiny',
        pack.cloudSynced ? '已上云' : '上传云端',
      )
      sync.type = 'button'
      sync.disabled = Boolean(pack.cloudSynced) || cloudBusy
      sync.addEventListener('click', (e) => {
        e.stopPropagation()
        cloudBusy = true
        homeStatus = '正在上传…'
        render()
        void pushLocalPackToCloud(pack.id)
          .then(async () => {
            homeStatus = '已上传到云端'
            homeError = ''
            await refreshPacks()
          })
          .catch((err) => {
            homeError = err instanceof Error ? err.message : '上传失败'
            homeStatus = ''
          })
          .finally(() => {
            cloudBusy = false
            render()
          })
      })
      tools.append(sync)
    }
    const del = el('button', 'btn-tiny btn-tiny-danger', '删除')
    del.type = 'button'
    del.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!confirm(`删除这节课「${pack.titleZh}」？`)) return
      void deleteCustomPack(pack.id).then(async () => {
        await refreshPacks()
        render()
      })
    })
    tools.append(edit, exp, del)
    wrap.append(tools)
  } else {
    const copy = el('button', 'btn-tiny', '复制并编辑')
    copy.type = 'button'
    copy.addEventListener('click', (e) => {
      e.stopPropagation()
      openCopy(pack)
    })
    tools.append(copy)
    wrap.append(tools)
  }
  return wrap
}

function renderHome(): void {
  clearApp()
  const shell = el('div', 'shell home-shell')

  const hero = el('section', 'hero')
  hero.append(
    el('p', 'hero-brand', '陪练本'),
    el('h1', 'hero-title', '一课一份陪练'),
    el(
      'p',
      'hero-lead',
      '孩子上外教课，家长在旁边记下这节课用到的词和句子。一课一份，课后拿出来练。',
    ),
  )
  shell.append(hero)

  const cloudBar = el('div', 'cloud-bar')
  if (!isSupabaseConfigured()) {
    cloudBar.append(
      el(
        'p',
        'cloud-note',
        '本机课包可用。配置 Supabase 后可跨设备同步（需 VITE_SUPABASE_URL / ANON_KEY）。',
      ),
    )
  } else {
    const label = el(
      'p',
      'cloud-note',
      cloudUserId
        ? `云端已连接 · ${cloudUserId.slice(0, 8)}…`
        : '云端已配置，可匿名登录并同步课包',
    )
    const syncBtn = el(
      'button',
      'btn-secondary',
      cloudBusy ? '同步中…' : cloudUserId ? '重新同步' : '连接并同步云端',
    )
    syncBtn.type = 'button'
    syncBtn.disabled = cloudBusy
    syncBtn.addEventListener('click', () => void connectCloud())
    cloudBar.append(label, syncBtn)
  }
  shell.append(cloudBar)

  const actions = el('div', 'home-actions')
  const importBtn = el('button', 'btn-secondary', '导入备份')
  importBtn.type = 'button'
  const fileInput = el('input', 'sr-only')
  fileInput.type = 'file'
  fileInput.accept = 'application/json,.json,.peilian.json'
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (file) void importPackFile(file)
  })
  importBtn.addEventListener('click', () => fileInput.click())

  const createBtn = el('button', 'btn-primary', '记一节课')
  createBtn.type = 'button'
  createBtn.addEventListener('click', openCreate)

  actions.append(importBtn, createBtn, fileInput)
  shell.append(actions)

  const mixedPacks = packsForHomeMixed()
  if (mixedPacks.length) {
    const mixedBtn = el('button', 'btn-ghost-block', '综合巩固')
    mixedBtn.type = 'button'
    mixedBtn.addEventListener('click', startHomeMixed)
    const mixedHint = el(
      'p',
      'home-note',
      mixedPacks.some((p) => p.source === 'custom')
        ? '把记下的几节课混在一起抽问。点某一节课，也可以分科只练词或只练句。'
        : '先用示例课综合抽问。记下自己的课后，会改成混练你的课。',
    )
    shell.append(mixedBtn, mixedHint)
  }

  const sampleBtn = el('button', 'btn-ghost-block', '一键导入示例课')
  sampleBtn.type = 'button'
  sampleBtn.addEventListener('click', () => void importSamplePack())

  const sampleLink = el('a', 'sample-link', '查看课包格式说明')
  sampleLink.href = `${import.meta.env.BASE_URL}content/README.md`
  sampleLink.target = '_blank'
  sampleLink.rel = 'noopener'

  shell.append(sampleBtn, sampleLink)

  if (homeError) {
    shell.append(el('p', 'form-error', homeError))
  }
  if (homeStatus) {
    shell.append(el('p', 'home-status', homeStatus))
  }

  const custom = packCache.filter((p) => p.source === 'custom')
  const builtin = packCache.filter((p) => p.source !== 'custom')

  if (custom.length) {
    const mine = el('section', 'pack-list')
    mine.append(el('h2', 'section-label', '我的课'))
    for (const pack of custom) mine.append(renderPackCard(pack))
    shell.append(mine)
  }

  const demos = el('section', 'pack-list')
  demos.append(el('h2', 'section-label', '示例课'))
  for (const pack of builtin) demos.append(renderPackCard(pack))
  shell.append(demos)

  shell.append(
    el(
      'p',
      'home-note',
      '上课时先记英文，中文课后可补。巩固时可以分科，也可以综合。导入 / 导出只是备份。',
    ),
  )
  app.append(shell)
}

function renderModeButton(
  title: string,
  blurb: string,
  onClick: () => void,
  opts: { primary?: boolean } = {},
): HTMLElement {
  const card = el('div', opts.primary ? 'mode-card is-primary' : 'mode-card')
  card.append(el('div', 'mode-title', title), el('p', 'mode-blurb', blurb))
  const go = el('button', opts.primary ? 'btn-primary' : 'btn-secondary', '开始')
  go.type = 'button'
  go.addEventListener('click', onClick)
  card.append(go)
  return card
}

function renderChip(
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const chip = el('button', 'mode-chip') as HTMLButtonElement
  chip.type = 'button'
  chip.textContent = label
  chip.addEventListener('click', onClick)
  return chip
}

function renderStart(): void {
  const pack = startPack
  if (!pack) {
    renderHome()
    return
  }
  clearApp()
  const shell = el('div', 'shell')
  const top = el('header', 'topbar')
  const back = el('button', 'btn-ghost', '返回')
  back.type = 'button'
  back.addEventListener('click', goHome)
  top.append(back, el('div', 'brand-mark', '怎么练'))
  shell.append(top)

  const main = el('main', 'main create-main')
  main.append(
    el('h1', 'title', pack.titleZh),
    el('p', 'subtitle', `${packCountLabel(pack)} · 分科专项练，也可以词句混着抽问。`),
  )

  const list = el('div', 'mode-list')
  list.append(el('h2', 'section-label', '分科巩固'))

  if (pack.words.length) {
    const wordCard = el('div', 'mode-card')
    wordCard.append(
      el('div', 'mode-title', `词汇 · ${pack.words.length} 词`),
      el('p', 'mode-blurb', '热身、开口、再巩固这一科。'),
    )
    const chips = el('div', 'mode-chips')
    chips.append(
      renderChip('全部词汇', () => beginPractice(pack, 'words')),
    )
    if (distinctPosCount(pack) >= 2) {
      const counts = posCounts(pack)
      for (const pos of WORD_POS) {
        const n = counts[pos]
        if (!n) continue
        chips.append(
          renderChip(`${POS_LABEL_ZH[pos]} · ${n}`, () =>
            beginPractice(pack, 'words', { pos }),
          ),
        )
      }
    }
    wordCard.append(chips)
    list.append(wordCard)
  }

  if (pack.sentences.length) {
    list.append(
      renderModeButton(
        `句子 · ${pack.sentences.length} 句`,
        '跟读这节课记下的句子，再遮句抽问。',
        () => beginPractice(pack, 'sentences'),
      ),
    )
  }

  list.append(el('h2', 'section-label', '综合巩固'))
  list.append(
    renderModeButton(
      '词和句子混着抽问',
      '遮住英文，打乱顺序，看孩子还记不记得。',
      () => beginPractice(pack, 'mixed'),
      { primary: true },
    ),
  )

  list.append(el('h2', 'section-label', '完整过一遍'))
  list.append(
    renderModeButton(
      '热身 → 开口 → 句子 → 巩固',
      '刚记完的第一遍，按整节课走。',
      () => beginPractice(pack, 'full'),
    ),
  )

  main.append(list)
  shell.append(main)
  app.append(shell)
}

function shiftEditIndex(
  editIndex: number | null,
  movedIndex: number,
  dir: -1 | 1,
): number | null {
  if (editIndex === null) return null
  const nextIndex = movedIndex + dir
  if (editIndex === movedIndex) return nextIndex
  if (editIndex === nextIndex) return movedIndex
  return editIndex
}

function renderCreate(): void {
  const editing = Boolean(draft.packId)
  const editingWord = draft.wordForm.editIndex !== null
  const editingSentence = draft.sentenceForm.editIndex !== null
  clearApp()
  const shell = el('div', 'shell')
  const top = el('header', 'topbar')
  const back = el('button', 'btn-ghost', '取消')
  back.type = 'button'
  back.addEventListener('click', goHome)
  top.append(back, el('div', 'brand-mark', editing ? '改这节课' : '记一节课'))
  shell.append(top)

  const main = el('main', 'main create-main')
  main.append(
    el('h1', 'title', editing ? '改这节课记下的内容' : '记下这节课的词和句子'),
    el(
      'p',
      'subtitle',
      '外教课上听到就记：英文必填，中文可课后补。一课一份，课后拿来练。',
    ),
  )

  const form = el('div', 'create-form')

  const titleZh = el('input', 'field') as HTMLInputElement
  titleZh.type = 'text'
  titleZh.placeholder = '标题，例如：3月15日外教课'
  titleZh.value = draft.titleZh
  titleZh.addEventListener('input', () => {
    draft.titleZh = titleZh.value
  })

  const titleEn = el('input', 'field') as HTMLInputElement
  titleEn.type = 'text'
  titleEn.placeholder = '英文标题（可选）'
  titleEn.value = draft.titleEn
  titleEn.addEventListener('input', () => {
    draft.titleEn = titleEn.value
  })

  const blurb = el('input', 'field') as HTMLInputElement
  blurb.type = 'text'
  blurb.placeholder = '备注（可选）例如：XX 机构 Unit 3'
  blurb.value = draft.blurb
  blurb.addEventListener('input', () => {
    draft.blurb = blurb.value
  })

  form.append(titleZh, titleEn, blurb)

  const wordList = el('div', 'draft-words')
  wordList.append(el('h2', 'section-label', `词汇（${draft.words.length}）`))
  if (draft.words.length === 0) {
    wordList.append(el('p', 'draft-empty', '还没有词。课上听到就先记下英文。'))
  }
  draft.words.forEach((w, index) => {
    const row = el('div', 'draft-row')
    if (draft.wordForm.editIndex === index) row.classList.add('is-editing')
    const info = el('div', 'draft-info')
    info.append(
      el('div', 'draft-en', w.english),
      el('div', 'draft-zh', `${zhOrPending(w.chinese)} · ${posExtra(w)}`),
    )
    const actions = el('div', 'draft-row-actions')
    const up = el('button', 'btn-tiny', '上移')
    up.type = 'button'
    up.disabled = index === 0
    up.addEventListener('click', () => {
      draft.wordForm.editIndex = shiftEditIndex(
        draft.wordForm.editIndex,
        index,
        -1,
      )
      draft.words = moveDraftItem(draft.words, index, -1)
      render()
    })
    const down = el('button', 'btn-tiny', '下移')
    down.type = 'button'
    down.disabled = index === draft.words.length - 1
    down.addEventListener('click', () => {
      draft.wordForm.editIndex = shiftEditIndex(
        draft.wordForm.editIndex,
        index,
        1,
      )
      draft.words = moveDraftItem(draft.words, index, 1)
      render()
    })
    const editWord = el('button', 'btn-tiny', '改')
    editWord.type = 'button'
    editWord.addEventListener('click', () => {
      draft.wordForm = {
        editIndex: index,
        english: w.english,
        chinese: w.chinese,
        pos: w.pos,
        article: w.article,
        imageDataUrl: w.imageDataUrl,
      }
      draft.error = ''
      render()
    })
    const remove = el('button', 'btn-tiny btn-tiny-danger', '移除')
    remove.type = 'button'
    remove.addEventListener('click', () => {
      draft.words.splice(index, 1)
      if (draft.wordForm.editIndex === index) draft.wordForm = emptyWordForm()
      else if (
        draft.wordForm.editIndex !== null &&
        draft.wordForm.editIndex > index
      ) {
        draft.wordForm.editIndex -= 1
      }
      render()
    })
    actions.append(up, down, editWord, remove)
    row.append(renderDraftThumb(w), info, actions)
    wordList.append(row)
  })
  form.append(wordList)

  const addBox = el('div', 'add-word-box')
  addBox.append(
    el('h2', 'section-label', editingWord ? '修改这个词' : '记一个词'),
  )
  const formState = draft.wordForm
  const enIn = el('input', 'field') as HTMLInputElement
  enIn.type = 'text'
  enIn.placeholder = 'English（必填）'
  enIn.value = formState.english
  const zhIn = el('input', 'field') as HTMLInputElement
  zhIn.type = 'text'
  zhIn.placeholder = '中文（课后可补）'
  zhIn.value = formState.chinese
  const posIn = el('select', 'field') as HTMLSelectElement
  for (const pos of WORD_POS) {
    const opt = el('option', undefined, POS_LABEL_ZH[pos]) as HTMLOptionElement
    opt.value = pos
    if (pos === formState.pos) opt.selected = true
    posIn.append(opt)
  }
  const artIn = el('select', 'field') as HTMLSelectElement
  for (const a of ['a', 'an'] as const) {
    const opt = el('option', undefined, `冠词 ${a}`) as HTMLOptionElement
    opt.value = a
    if (a === formState.article) opt.selected = true
    artIn.append(opt)
  }
  const syncArticleVisibility = () => {
    artIn.hidden = posIn.value !== 'noun'
  }
  enIn.addEventListener('input', () => {
    formState.english = enIn.value
    if (formState.pos === 'noun') {
      formState.article = guessArticle(enIn.value)
      artIn.value = formState.article
    }
  })
  zhIn.addEventListener('input', () => {
    formState.chinese = zhIn.value
  })
  posIn.addEventListener('change', () => {
    formState.pos = WORD_POS.includes(posIn.value as WordPos)
      ? (posIn.value as WordPos)
      : 'noun'
    syncArticleVisibility()
  })
  artIn.addEventListener('change', () => {
    formState.article = artIn.value === 'an' ? 'an' : 'a'
  })
  syncArticleVisibility()

  const imgPreview = el('div', 'img-preview')
  if (formState.imageDataUrl) {
    const img = el('img', 'img-preview-pic')
    img.src = resolveImageSrc(formState.imageDataUrl)
    img.alt = 'preview'
    imgPreview.append(img)
  } else {
    imgPreview.textContent = '图片可选，课后补也行'
  }
  const imgInput = el('input', 'sr-only') as HTMLInputElement
  imgInput.type = 'file'
  imgInput.accept = 'image/*'
  imgInput.addEventListener('change', () => {
    const file = imgInput.files?.[0]
    imgInput.value = ''
    if (!file) return
    void fileToDataUrl(file)
      .then((dataUrl) => {
        formState.imageDataUrl = dataUrl
        render()
      })
      .catch(() => {
        draft.error = '图片处理失败'
        render()
      })
  })
  const pickImg = el('button', 'btn-secondary', '上传图片（可选）')
  pickImg.type = 'button'
  pickImg.addEventListener('click', () => imgInput.click())
  const clearImg = el('button', 'btn-tiny', '去掉图片')
  clearImg.type = 'button'
  clearImg.disabled = !formState.imageDataUrl
  clearImg.addEventListener('click', () => {
    formState.imageDataUrl = ''
    render()
  })
  const imgRow = el('div', 'img-actions')
  imgRow.append(pickImg, clearImg, imgInput)

  const addWord = el(
    'button',
    'btn-secondary',
    editingWord ? '保存这个词' : '记下这个词',
  )
  addWord.type = 'button'
  addWord.addEventListener('click', () => {
    formState.english = enIn.value
    formState.chinese = zhIn.value
    formState.pos = WORD_POS.includes(posIn.value as WordPos)
      ? (posIn.value as WordPos)
      : 'noun'
    formState.article = artIn.value === 'an' ? 'an' : 'a'
    const english = formState.english.trim()
    if (!english) {
      draft.error = '请填写英文单词'
      render()
      return
    }
    if (formState.editIndex === null && draft.words.length >= MAX_WORDS) {
      draft.error = `单课最多 ${MAX_WORDS} 个词`
      render()
      return
    }
    const existing =
      formState.editIndex !== null ? draft.words[formState.editIndex] : undefined
    const nextWord = wordFromForm(formState, existing)
    if (formState.editIndex === null) {
      draft.words.push(nextWord)
    } else {
      draft.words[formState.editIndex] = nextWord
    }
    draft.wordForm = emptyWordForm()
    draft.error = ''
    render()
  })
  const cancelEdit = el('button', 'btn-tiny', '取消修改')
  cancelEdit.type = 'button'
  cancelEdit.hidden = !editingWord
  cancelEdit.addEventListener('click', () => {
    draft.wordForm = emptyWordForm()
    draft.error = ''
    render()
  })

  addBox.append(
    enIn,
    zhIn,
    posIn,
    artIn,
    imgRow,
    imgPreview,
    addWord,
    cancelEdit,
  )
  form.append(addBox)

  const sentenceList = el('div', 'draft-words')
  sentenceList.append(el('h2', 'section-label', `句子（${draft.sentences.length}）`))
  if (draft.sentences.length === 0) {
    sentenceList.append(
      el('p', 'draft-empty', '还没有句子。课上老师带读的句子记在这里。'),
    )
  }
  draft.sentences.forEach((s, index) => {
    const row = el('div', 'draft-row draft-row-sentence')
    if (draft.sentenceForm.editIndex === index) row.classList.add('is-editing')
    const info = el('div', 'draft-info')
    info.append(
      el('div', 'draft-en', s.english),
      el('div', 'draft-zh', zhOrPending(s.chinese)),
    )
    const actions = el('div', 'draft-row-actions')
    const up = el('button', 'btn-tiny', '上移')
    up.type = 'button'
    up.disabled = index === 0
    up.addEventListener('click', () => {
      draft.sentenceForm.editIndex = shiftEditIndex(
        draft.sentenceForm.editIndex,
        index,
        -1,
      )
      draft.sentences = moveDraftItem(draft.sentences, index, -1)
      render()
    })
    const down = el('button', 'btn-tiny', '下移')
    down.type = 'button'
    down.disabled = index === draft.sentences.length - 1
    down.addEventListener('click', () => {
      draft.sentenceForm.editIndex = shiftEditIndex(
        draft.sentenceForm.editIndex,
        index,
        1,
      )
      draft.sentences = moveDraftItem(draft.sentences, index, 1)
      render()
    })
    const editSentence = el('button', 'btn-tiny', '改')
    editSentence.type = 'button'
    editSentence.addEventListener('click', () => {
      draft.sentenceForm = {
        editIndex: index,
        english: s.english,
        chinese: s.chinese,
      }
      draft.error = ''
      render()
    })
    const remove = el('button', 'btn-tiny btn-tiny-danger', '移除')
    remove.type = 'button'
    remove.addEventListener('click', () => {
      draft.sentences.splice(index, 1)
      if (draft.sentenceForm.editIndex === index) {
        draft.sentenceForm = emptySentenceForm()
      } else if (
        draft.sentenceForm.editIndex !== null &&
        draft.sentenceForm.editIndex > index
      ) {
        draft.sentenceForm.editIndex -= 1
      }
      render()
    })
    actions.append(up, down, editSentence, remove)
    row.append(renderDraftSentenceMark(), info, actions)
    sentenceList.append(row)
  })
  form.append(sentenceList)

  const addSentenceBox = el('div', 'add-word-box')
  addSentenceBox.append(
    el('h2', 'section-label', editingSentence ? '修改这句' : '记一句课堂句子'),
  )
  const sentenceState = draft.sentenceForm
  const senEn = el('textarea', 'field field-area') as HTMLTextAreaElement
  senEn.placeholder = 'English sentence（必填）'
  senEn.rows = 2
  senEn.value = sentenceState.english
  const senZh = el('textarea', 'field field-area') as HTMLTextAreaElement
  senZh.placeholder = '中文（课后可补）'
  senZh.rows = 2
  senZh.value = sentenceState.chinese
  senEn.addEventListener('input', () => {
    sentenceState.english = senEn.value
  })
  senZh.addEventListener('input', () => {
    sentenceState.chinese = senZh.value
  })
  const addSentence = el(
    'button',
    'btn-secondary',
    editingSentence ? '保存这句' : '记下这句',
  )
  addSentence.type = 'button'
  addSentence.addEventListener('click', () => {
    sentenceState.english = senEn.value
    sentenceState.chinese = senZh.value
    const english = sentenceState.english.trim()
    if (!english) {
      draft.error = '请填写英文句子'
      render()
      return
    }
    if (
      sentenceState.editIndex === null &&
      draft.sentences.length >= MAX_SENTENCES
    ) {
      draft.error = `单课最多 ${MAX_SENTENCES} 个句子`
      render()
      return
    }
    const existing =
      sentenceState.editIndex !== null
        ? draft.sentences[sentenceState.editIndex]
        : undefined
    const nextSentence = sentenceFromForm(sentenceState, existing)
    if (sentenceState.editIndex === null) {
      draft.sentences.push(nextSentence)
    } else {
      draft.sentences[sentenceState.editIndex] = nextSentence
    }
    draft.sentenceForm = emptySentenceForm()
    draft.error = ''
    render()
  })
  const cancelSentence = el('button', 'btn-tiny', '取消修改')
  cancelSentence.type = 'button'
  cancelSentence.hidden = !editingSentence
  cancelSentence.addEventListener('click', () => {
    draft.sentenceForm = emptySentenceForm()
    draft.error = ''
    render()
  })
  addSentenceBox.append(senEn, senZh, addSentence, cancelSentence)
  form.append(addSentenceBox)

  if (draft.error) form.append(el('p', 'form-error', draft.error))

  const save = el('button', 'btn-primary', editing ? '保存这节课' : '保存到本机')
  save.type = 'button'
  save.addEventListener('click', () => {
    void (async () => {
      if (!draft.titleZh.trim()) {
        draft.error = '请填写标题'
        render()
        return
      }
      if (draft.words.length === 0 && draft.sentences.length === 0) {
        draft.error = '请至少记 1 个词或 1 个句子'
        render()
        return
      }
      try {
        await saveCustomPack(draftToPack(draft))
        await refreshPacks()
        screen = 'home'
        homeError = ''
        homeStatus = editing ? '这节课已保存' : '已记下这节课'
        render()
      } catch {
        draft.error = '保存失败（本机存储可能已满）'
        render()
      }
    })()
  })

  form.append(save)
  main.append(form)
  shell.append(main)
  app.append(shell)
}

function renderThumb(word: WordDef, className: string): HTMLElement {
  if (hasImage(word)) {
    const img = el('img', className)
    img.src = wordImageSrc(word)
    img.alt = word.english
    img.loading = 'lazy'
    return img
  }
  const tile = el('div', `${className} pack-thumb-word`)
  tile.textContent = word.english.slice(0, 4)
  tile.title = word.english
  return tile
}

function renderDraftThumb(word: DraftWord): HTMLElement {
  if (word.imageDataUrl) {
    const img = el('img', 'draft-thumb')
    img.src = resolveImageSrc(word.imageDataUrl)
    img.alt = word.english
    return img
  }
  const tile = el('div', 'draft-thumb pack-thumb-word')
  tile.textContent = word.english.slice(0, 4) || POS_LABEL_ZH[word.pos][0]
  return tile
}

function renderDraftSentenceMark(): HTMLElement {
  const tile = el('div', 'draft-thumb pack-thumb-word')
  tile.textContent = '句'
  return tile
}

function renderPrompt(word: WordDef, opts: { hideEnglish?: boolean } = {}): HTMLElement {
  const frame = el('div', 'picture-frame')
  if (hasImage(word)) {
    const img = el('img', 'picture')
    img.src = wordImageSrc(word)
    img.alt = opts.hideEnglish ? POS_LABEL_ZH[word.pos] : word.english
    frame.append(img)
    return frame
  }
  frame.classList.add('is-word-card')
  const card = el('button', 'word-card')
  card.type = 'button'
  card.title = opts.hideEnglish ? '先让孩子说' : '朗读英文'
  card.append(el('span', 'word-card-pos', POS_LABEL_ZH[word.pos]))
  if (opts.hideEnglish) {
    card.append(
      el('span', 'word-card-en is-hidden', '……'),
      el('span', 'word-card-zh', word.chinese.trim() || '说出这个词'),
    )
  } else {
    card.append(
      el('span', 'word-card-en', word.english),
      el('span', 'word-card-zh', zhOrPending(word.chinese)),
    )
    card.addEventListener('click', () => speakEnglish(word.english))
  }
  frame.append(card)
  return frame
}

function renderSentencePrompt(
  sentence: SentenceDef,
  opts: { hideEnglish?: boolean } = {},
): HTMLElement {
  const frame = el('div', 'picture-frame is-sentence-card')
  const card = el('button', 'word-card sentence-card')
  card.type = 'button'
  card.title = opts.hideEnglish ? '先让孩子说' : '朗读英文'
  card.append(el('span', 'word-card-pos', '句子'))
  if (opts.hideEnglish) {
    card.append(
      el('span', 'sentence-card-en is-hidden', '……'),
      el('span', 'word-card-zh', sentence.chinese.trim() || '说出这句'),
    )
  } else {
    card.append(el('span', 'sentence-card-en', sentence.english))
    card.append(el('span', 'word-card-zh', zhOrPending(sentence.chinese)))
    card.addEventListener('click', () => speakEnglish(sentence.english))
  }
  frame.append(card)
  return frame
}

function renderVocab(): void {
  if (!session) return
  const word = currentWord()
  if (!word) return
  const total = session.pack.words.length
  const body = el('div', 'stage')
  body.append(renderPrompt(word))

  const lex = el('div', 'lex')
  const enRow = el('div', 'lex-en-row')
  const en = el('button', 'lex-en', word.english)
  en.type = 'button'
  en.title = '朗读英文'
  en.addEventListener('click', () => speakEnglish(word.english))
  enRow.append(en, el('span', 'lex-speaker', '🔊'))
  enRow.addEventListener('click', () => speakEnglish(word.english))
  lex.append(enRow, el('div', 'lex-zh', zhOrPending(word.chinese)))
  body.append(lex)
  body.append(el('p', 'parent-cue', vocabCue(word)))

  const footer = el('footer', 'footer')
  const prev = el('button', 'btn-secondary', '上一个')
  prev.type = 'button'
  prev.disabled = session.wordIndex === 0
  prev.addEventListener('click', prevVocab)
  const next = el(
    'button',
    'btn-primary',
    session.wordIndex >= total - 1 ? '进入开口练习' : '下一个词',
  )
  next.type = 'button'
  next.addEventListener('click', nextVocab)
  footer.append(prev, next)

  renderShell({
    phase: 'vocab',
    title: '词汇热身',
    subtitle: `${session.pack.titleZh} · ${session.wordIndex + 1}/${total}`,
    body,
    footer,
  })
}

function renderTalk(): void {
  if (!session) return
  const word = currentWord()
  const question = currentQuestion()
  if (!word || !question) return

  const body = el('div', 'stage')
  body.append(renderPrompt(word))
  body.append(el('div', 'q-chip', question.labelZh))

  const script = el('div', 'script')
  script.append(el('p', 'script-cue', cueText(question, word)))
  const askBtn = el('button', 'ask-line', question.askEn(word))
  askBtn.type = 'button'
  askBtn.title = '朗读问句'
  askBtn.addEventListener('click', () => speakEnglish(question.askEn(word)))
  script.append(askBtn)
  const tip = tipText(question, word)
  if (tip) script.append(el('p', 'script-tip', tip))

  const reveal = el(
    'button',
    'btn-reveal',
    session.revealAnswer ? '收起参考回答' : '显示参考回答',
  )
  reveal.type = 'button'
  reveal.addEventListener('click', () => {
    if (!session) return
    session.revealAnswer = !session.revealAnswer
    render()
  })
  script.append(reveal)

  if (session.revealAnswer) {
    const ans = el('div', 'answer-box')
    ans.append(el('div', 'answer-label', '孩子可以说'))
    for (const line of question.expectEn(word)) {
      const row = el('button', 'answer-line', line)
      row.type = 'button'
      row.addEventListener('click', () => speakEnglish(line))
      ans.append(row)
    }
    script.append(ans)
  }
  body.append(script)

  const footer = el('footer', 'footer')
  const prev = el('button', 'btn-secondary', '上一题')
  prev.type = 'button'
  prev.disabled = session.wordIndex === 0 && session.questionIndex === 0
  prev.addEventListener('click', prevTalk)
  const lastTalk =
    session.wordIndex >= session.pack.words.length - 1 &&
    session.questionIndex >= talkQueue(word).length - 1
  const nextLabel = lastTalk
    ? session.pack.sentences.length
      ? '进入句子练习'
      : '进入口头巩固'
    : '下一题'
  const next = el('button', 'btn-primary', nextLabel)
  next.type = 'button'
  next.addEventListener('click', nextTalk)
  footer.append(prev, next)

  renderShell({
    phase: 'talk',
    title: '开口练习',
    subtitle: `${POS_LABEL_ZH[word.pos]} · ${zhOrPending(word.chinese)} · 问题 ${session.questionIndex + 1}/${talkQueue(word).length}`,
    body,
    footer,
  })
}

function renderSentences(): void {
  if (!session) return
  const sentence = currentSentence()
  if (!sentence) return
  const total = session.pack.sentences.length
  const body = el('div', 'stage')
  body.append(renderSentencePrompt(sentence))

  const lex = el('div', 'lex')
  const enRow = el('div', 'lex-en-row')
  const en = el('button', 'lex-en lex-en-sentence', sentence.english)
  en.type = 'button'
  en.title = '朗读英文'
  en.addEventListener('click', () => speakEnglish(sentence.english))
  enRow.append(en, el('span', 'lex-speaker', '🔊'))
  enRow.addEventListener('click', () => speakEnglish(sentence.english))
  lex.append(enRow, el('div', 'lex-zh', zhOrPending(sentence.chinese)))
  body.append(lex)
  body.append(el('p', 'parent-cue', sentenceCue(sentence)))

  const footer = el('footer', 'footer')
  const prev = el('button', 'btn-secondary', '上一句')
  prev.type = 'button'
  prev.disabled = session.sentenceIndex === 0
  prev.addEventListener('click', prevSentence)
  const next = el(
    'button',
    'btn-primary',
    session.sentenceIndex >= total - 1 ? '进入口头巩固' : '下一句',
  )
  next.type = 'button'
  next.addEventListener('click', nextSentence)
  footer.append(prev, next)

  renderShell({
    phase: 'sentences',
    title: '课堂句子',
    subtitle: `${session.pack.titleZh} · ${session.sentenceIndex + 1}/${total}`,
    body,
    footer,
  })
}

function renderReview(): void {
  if (!session) return
  const item = currentReviewItem()
  if (!item) return
  const total = reviewQueue().length
  const body = el('div', 'stage')

  if (item.kind === 'word') {
    const word = item.word
    body.append(renderPrompt(word, { hideEnglish: !session.reviewReveal }))
    body.append(
      el(
        'p',
        'parent-cue',
        session.reviewReveal ? reviewCueRevealed(word) : reviewCueHidden(word),
      ),
    )
    if (session.reviewReveal) {
      const lex = el('div', 'lex')
      const en = el('button', 'lex-en', word.english)
      en.type = 'button'
      en.addEventListener('click', () => speakEnglish(word.english))
      lex.append(en, el('div', 'lex-zh', zhOrPending(word.chinese)))
      body.append(lex)
      const frames = el('div', 'frame-list')
      for (const line of reviewFrames(word)) {
        const b = el('button', 'frame-line', line)
        b.type = 'button'
        b.addEventListener('click', () => speakEnglish(line))
        frames.append(b)
      }
      body.append(frames)
    }
  } else {
    const sentence = item.sentence
    body.append(
      renderSentencePrompt(sentence, { hideEnglish: !session.reviewReveal }),
    )
    body.append(
      el(
        'p',
        'parent-cue',
        session.reviewReveal
          ? sentenceReviewCueRevealed()
          : sentenceReviewCueHidden(sentence),
      ),
    )
    if (session.reviewReveal) {
      const lex = el('div', 'lex')
      const en = el('button', 'lex-en lex-en-sentence', sentence.english)
      en.type = 'button'
      en.addEventListener('click', () => speakEnglish(sentence.english))
      lex.append(en, el('div', 'lex-zh', zhOrPending(sentence.chinese)))
      body.append(lex)
    }
  }

  const footer = el('footer', 'footer')
  const next = el(
    'button',
    'btn-primary',
    session.reviewReveal
      ? session.reviewIndex >= total - 1
        ? '完成陪练'
        : session.mode === 'mixed'
          ? '下一题'
          : item.kind === 'sentence'
            ? '下一句'
            : '下一个词'
      : '揭晓英文',
  )
  next.type = 'button'
  next.addEventListener('click', nextReview)
  footer.append(next)

  renderShell({
    phase: 'review',
    title: session.mode === 'mixed' ? '综合巩固' : '口头巩固',
    subtitle: `${session.pack.titleZh} · ${session.reviewIndex + 1}/${total}`,
    body,
    footer,
  })
}

function renderDone(): void {
  if (!session) return
  clearApp()
  const shell = el('div', 'shell done-shell')
  shell.append(
    el('p', 'hero-brand', '陪练本'),
    el('h1', 'hero-title', '本轮完成'),
    el(
      'p',
      'hero-lead',
      `已练完「${modeLabelZh(session.mode, session.posFilter)} · ${session.pack.titleZh}」。`,
    ),
  )
  const actions = el('div', 'done-actions')
  const again = el('button', 'btn-primary', '用同样方式再练一次')
  again.type = 'button'
  again.addEventListener('click', replaySession)
  const other = el('button', 'btn-secondary', session.originPackId ? '换一种练法' : '回首页')
  other.type = 'button'
  other.addEventListener('click', () => {
    if (session?.originPackId) {
      void getPackById(session.originPackId).then((pack) => {
        if (pack) openStart(pack)
        else goHome()
      })
      return
    }
    goHome()
  })
  actions.append(again, other)
  shell.append(actions)
  app.append(shell)
}

function render(): void {
  if (screen === 'create') {
    renderCreate()
    return
  }
  if (screen === 'start') {
    renderStart()
    return
  }
  if (screen === 'home' || !session) {
    renderHome()
    return
  }
  switch (session.phase) {
    case 'vocab':
      renderVocab()
      break
    case 'talk':
      renderTalk()
      break
    case 'sentences':
      renderSentences()
      break
    case 'review':
      renderReview()
      break
    case 'done':
      renderDone()
      break
    default:
      renderHome()
  }
}

void refreshPacks().then(render)
