import './style.css'
import {
  cueText,
  questionsForWord,
  reviewCueHidden,
  reviewCueRevealed,
  reviewFrames,
  tipText,
  vocabCue,
  type QuestionTemplate,
} from './data/questions'
import { preloadPackImages, resolveImageSrc, wordImageSrc, fileToDataUrl } from './content/images'
import {
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
  type LessonPack,
  type WordDef,
  type WordPos,
} from './content/types'
import {
  draftToPack,
  emptyDraft,
  emptyWordForm,
  moveDraftWord,
  packToDraft,
  posExtra,
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

type Screen = 'home' | 'create' | 'session'
type Phase = 'vocab' | 'talk' | 'review' | 'done'

interface Session {
  pack: LessonPack
  phase: Phase
  wordIndex: number
  questionIndex: number
  revealAnswer: boolean
  reviewReveal: boolean
}

let screen: Screen = 'home'
let session: Session | null = null
let packCache: LessonPack[] = []
let homeError = ''
let homeStatus = ''
let cloudBusy = false
let cloudUserId: string | null = null
let draft: PackDraft = emptyDraft()

const PHASES: { id: Exclude<Phase, 'done'>; label: string }[] = [
  { id: 'vocab', label: '词汇' },
  { id: 'talk', label: '开口' },
  { id: 'review', label: '巩固' },
]

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
    homeStatus = '已同步云端词包'
  } catch (err) {
    homeError = err instanceof Error ? err.message : '云端连接失败'
    homeStatus = ''
  } finally {
    cloudBusy = false
    render()
  }
}

async function startPack(packId: string): Promise<void> {
  const pack = await getPackById(packId)
  if (!pack || pack.words.length === 0) return
  unlockAudio()
  void preloadPackImages(pack)
  session = {
    pack,
    phase: 'vocab',
    wordIndex: 0,
    questionIndex: 0,
    revealAnswer: false,
    reviewReveal: false,
  }
  screen = 'session'
  render()
}

function goHome(): void {
  session = null
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
    session.phase = 'review'
    session.wordIndex = 0
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

function nextReview(): void {
  if (!session) return
  if (!session.reviewReveal) {
    session.reviewReveal = true
    render()
    return
  }
  if (session.wordIndex >= session.pack.words.length - 1) {
    session.phase = 'done'
  } else {
    session.wordIndex += 1
    session.reviewReveal = false
  }
  render()
}

function renderPhaseRail(active: Phase): HTMLElement {
  const rail = el('nav', 'phase-rail')
  rail.setAttribute('aria-label', '练习阶段')
  for (const phase of PHASES) {
    const item = el('div', 'phase-item')
    if (phase.id === active) item.classList.add('is-active')
    if (
      (active === 'talk' && phase.id === 'vocab') ||
      (active === 'review' && (phase.id === 'vocab' || phase.id === 'talk')) ||
      active === 'done'
    ) {
      item.classList.add('is-done')
    }
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

  if (opts.phase !== 'done') shell.append(renderPhaseRail(opts.phase))

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
    const url = `${import.meta.env.BASE_URL}content/sample-week-food.peilian.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error('示例词包下载失败')
    await importPackText(await res.text())
  } catch (err) {
    homeError = err instanceof Error ? err.message : '示例导入失败'
    render()
  }
}

function renderPackCard(pack: LessonPack): HTMLElement {
  const wrap = el('div', 'pack-card-wrap')
  const card = el('button', 'pack-card')
  card.type = 'button'
  const thumbs = el('div', 'pack-thumbs')
  for (const word of pack.words.slice(0, 4)) {
    thumbs.append(renderThumb(word, 'pack-thumb'))
  }
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
    el('div', 'pack-blurb', `${pack.words.length} 词 · ${pack.blurb}`),
  )
  card.append(thumbs, meta)
  card.addEventListener('click', () => void startPack(pack.id))
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
      if (!confirm(`删除词包「${pack.titleZh}」？`)) return
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
    el('h1', 'hero-title', '课后开口陪练'),
    el(
      'p',
      'hero-lead',
      '不用改 JSON。网页里新建或编辑词包；名词可配图，动词和形容词没有图也能练。',
    ),
  )
  shell.append(hero)

  const cloudBar = el('div', 'cloud-bar')
  if (!isSupabaseConfigured()) {
    cloudBar.append(
      el(
        'p',
        'cloud-note',
        '本机词包可用。配置 Supabase 后可跨设备同步（需 VITE_SUPABASE_URL / ANON_KEY）。',
      ),
    )
  } else {
    const label = el(
      'p',
      'cloud-note',
      cloudUserId
        ? `云端已连接 · ${cloudUserId.slice(0, 8)}…`
        : '云端已配置，可匿名登录并同步词包',
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

  const createBtn = el('button', 'btn-primary', '新建词包')
  createBtn.type = 'button'
  createBtn.addEventListener('click', openCreate)

  const sampleBtn = el('button', 'btn-ghost-block', '一键导入示例词包')
  sampleBtn.type = 'button'
  sampleBtn.addEventListener('click', () => void importSamplePack())

  const sampleLink = el('a', 'sample-link', '查看词包格式说明')
  sampleLink.href = `${import.meta.env.BASE_URL}content/README.md`
  sampleLink.target = '_blank'
  sampleLink.rel = 'noopener'

  actions.append(importBtn, createBtn, fileInput)
  shell.append(actions, sampleBtn, sampleLink)

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
    mine.append(el('h2', 'section-label', '我的词包'))
    for (const pack of custom) mine.append(renderPackCard(pack))
    shell.append(mine)
  }

  const demos = el('section', 'pack-list')
  demos.append(el('h2', 'section-label', '示例词包（可替换）'))
  for (const pack of builtin) demos.append(renderPackCard(pack))
  shell.append(demos)

  shell.append(
    el(
      'p',
      'home-note',
      '示例词包可「复制并编辑」。导入 / 导出只是备份，日常改词用编辑页。',
    ),
  )
  app.append(shell)
}

function renderCreate(): void {
  const editing = Boolean(draft.packId)
  const editingWord = draft.wordForm.editIndex !== null
  clearApp()
  const shell = el('div', 'shell')
  const top = el('header', 'topbar')
  const back = el('button', 'btn-ghost', '取消')
  back.type = 'button'
  back.addEventListener('click', goHome)
  top.append(back, el('div', 'brand-mark', editing ? '编辑词包' : '新建词包'))
  shell.append(top)

  const main = el('main', 'main create-main')
  main.append(
    el('h1', 'title', editing ? '改本课内容' : '录入本课内容'),
    el(
      'p',
      'subtitle',
      '在网页里改词、词性和图片，不用打开 JSON。名词建议配图，动词和形容词可以不配图。',
    ),
  )

  const form = el('div', 'create-form')

  const titleZh = el('input', 'field') as HTMLInputElement
  titleZh.type = 'text'
  titleZh.placeholder = '标题（中文）例如：本周外教课'
  titleZh.value = draft.titleZh
  titleZh.addEventListener('input', () => {
    draft.titleZh = titleZh.value
  })

  const titleEn = el('input', 'field') as HTMLInputElement
  titleEn.type = 'text'
  titleEn.placeholder = '标题（英文，可选）'
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
  wordList.append(el('h2', 'section-label', `词条（${draft.words.length}）`))
  if (draft.words.length === 0) {
    wordList.append(el('p', 'draft-empty', '还没有词。在下方填写后点「加入词包」。'))
  }
  draft.words.forEach((w, index) => {
    const row = el('div', 'draft-row')
    if (draft.wordForm.editIndex === index) row.classList.add('is-editing')
    const info = el('div', 'draft-info')
    info.append(
      el('div', 'draft-en', w.english),
      el('div', 'draft-zh', `${w.chinese} · ${posExtra(w)}`),
    )
    const actions = el('div', 'draft-row-actions')
    const up = el('button', 'btn-tiny', '上移')
    up.type = 'button'
    up.disabled = index === 0
    up.addEventListener('click', () => {
      const nextIndex = index - 1
      draft.words = moveDraftWord(draft.words, index, -1)
      if (draft.wordForm.editIndex === index) draft.wordForm.editIndex = nextIndex
      else if (draft.wordForm.editIndex === nextIndex) draft.wordForm.editIndex = index
      render()
    })
    const down = el('button', 'btn-tiny', '下移')
    down.type = 'button'
    down.disabled = index === draft.words.length - 1
    down.addEventListener('click', () => {
      const nextIndex = index + 1
      draft.words = moveDraftWord(draft.words, index, 1)
      if (draft.wordForm.editIndex === index) draft.wordForm.editIndex = nextIndex
      else if (draft.wordForm.editIndex === nextIndex) draft.wordForm.editIndex = index
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
    el('h2', 'section-label', editingWord ? '修改这个词' : '添加一个词'),
  )
  const formState = draft.wordForm
  const enIn = el('input', 'field') as HTMLInputElement
  enIn.type = 'text'
  enIn.placeholder = 'English'
  enIn.value = formState.english
  const zhIn = el('input', 'field') as HTMLInputElement
  zhIn.type = 'text'
  zhIn.placeholder = '中文'
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
    imgPreview.textContent = '图片可选：动词、形容词常常不配图'
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
    editingWord ? '保存这个词' : '加入词包',
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
    const chinese = formState.chinese.trim()
    if (!english || !chinese) {
      draft.error = '请填写英文和中文'
      render()
      return
    }
    if (formState.editIndex === null && draft.words.length >= 40) {
      draft.error = '单个词包最多 40 个词'
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

  if (draft.error) form.append(el('p', 'form-error', draft.error))

  const save = el('button', 'btn-primary', editing ? '保存修改' : '保存到本机')
  save.type = 'button'
  save.addEventListener('click', () => {
    void (async () => {
      if (!draft.titleZh.trim()) {
        draft.error = '请填写中文标题'
        render()
        return
      }
      if (draft.words.length === 0) {
        draft.error = '请至少添加 1 个词'
        render()
        return
      }
      try {
        await saveCustomPack(draftToPack(draft))
        await refreshPacks()
        screen = 'home'
        homeError = ''
        homeStatus = editing ? '词包已保存' : '已新建词包'
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

function renderPrompt(word: WordDef): HTMLElement {
  const frame = el('div', 'picture-frame')
  if (hasImage(word)) {
    const img = el('img', 'picture')
    img.src = wordImageSrc(word)
    img.alt = word.english
    frame.append(img)
    return frame
  }
  frame.classList.add('is-word-card')
  const card = el('button', 'word-card')
  card.type = 'button'
  card.title = '朗读英文'
  card.append(
    el('span', 'word-card-pos', POS_LABEL_ZH[word.pos]),
    el('span', 'word-card-en', word.english),
    el('span', 'word-card-zh', word.chinese),
  )
  card.addEventListener('click', () => speakEnglish(word.english))
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
  lex.append(enRow, el('div', 'lex-zh', word.chinese))
  body.append(lex)
  body.append(
    el(
      'p',
      'parent-cue',
      vocabCue(word),
    ),
  )

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
  const next = el('button', 'btn-primary', '下一题')
  next.type = 'button'
  next.addEventListener('click', nextTalk)
  footer.append(prev, next)

  renderShell({
    phase: 'talk',
    title: '开口练习',
    subtitle: `${POS_LABEL_ZH[word.pos]} · ${word.chinese} · 问题 ${session.questionIndex + 1}/${talkQueue(word).length}`,
    body,
    footer,
  })
}

function renderReview(): void {
  if (!session) return
  const word = currentWord()
  if (!word) return

  const body = el('div', 'stage')
  body.append(renderPrompt(word))
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
    lex.append(en, el('div', 'lex-zh', word.chinese))
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

  const footer = el('footer', 'footer')
  const next = el(
    'button',
    'btn-primary',
    session.reviewReveal
      ? session.wordIndex >= session.pack.words.length - 1
        ? '完成陪练'
        : '下一个词'
      : '揭晓英文',
  )
  next.type = 'button'
  next.addEventListener('click', nextReview)
  footer.append(next)

  renderShell({
    phase: 'review',
    title: '口头巩固',
    subtitle: `${session.pack.titleZh} · ${session.wordIndex + 1}/${session.pack.words.length}`,
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
      `已练完「${session.pack.titleZh}」。换教材时导入新词包即可，陪练框架不用改。`,
    ),
  )
  const actions = el('div', 'done-actions')
  const again = el('button', 'btn-primary', '再用本包练一次')
  again.type = 'button'
  again.addEventListener('click', () => void startPack(session!.pack.id))
  const home = el('button', 'btn-secondary', '回首页')
  home.type = 'button'
  home.addEventListener('click', goHome)
  actions.append(again, home)
  shell.append(actions)
  app.append(shell)
}

function render(): void {
  if (screen === 'create') {
    renderCreate()
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
