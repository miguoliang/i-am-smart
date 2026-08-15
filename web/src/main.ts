import './style.css'
import { questionsForTalk, type QuestionTemplate } from './data/questions'
import { preloadPackImages, wordImageSrc, fileToDataUrl } from './content/images'
import {
  PackParseError,
  downloadPackJson,
  parseContentPackJson,
} from './content/schema'
import {
  deleteCustomPack,
  getPackById,
  listAllPacks,
  saveCustomPack,
} from './content/store'
import {
  guessArticle,
  slugId,
  type LessonPack,
  type WordDef,
} from './content/types'
import { bindViewport, registerServiceWorker } from './practice/chrome'
import { speakEnglish, unlockAudio } from './practice/tts'

bindViewport()
registerServiceWorker()

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

interface DraftWord {
  english: string
  chinese: string
  article: 'a' | 'an'
  imageDataUrl: string
}

const talkQuestions = questionsForTalk()
let screen: Screen = 'home'
let session: Session | null = null
let packCache: LessonPack[] = []
let homeError = ''
let draft: {
  titleZh: string
  titleEn: string
  blurb: string
  words: DraftWord[]
  error: string
} = emptyDraft()

const PHASES: { id: Exclude<Phase, 'done'>; label: string }[] = [
  { id: 'vocab', label: '词汇' },
  { id: 'talk', label: '看图说话' },
  { id: 'review', label: '巩固' },
]

function emptyDraft() {
  return {
    titleZh: '',
    titleEn: '',
    blurb: '',
    words: [] as DraftWord[],
    error: '',
  }
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

function currentWord(): WordDef | null {
  if (!session) return null
  return session.pack.words[session.wordIndex] ?? null
}

function currentQuestion(): QuestionTemplate | null {
  return talkQuestions[session?.questionIndex ?? -1] ?? null
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
  session.revealAnswer = false
  if (session.questionIndex < talkQuestions.length - 1) {
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
    session.questionIndex = talkQuestions.length - 1
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

async function importPackFile(file: File): Promise<void> {
  try {
    const text = await file.text()
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

function renderPackCard(pack: LessonPack): HTMLElement {
  const wrap = el('div', 'pack-card-wrap')
  const card = el('button', 'pack-card')
  card.type = 'button'
  const thumbs = el('div', 'pack-thumbs')
  for (const word of pack.words.slice(0, 4)) {
    const img = el('img', 'pack-thumb')
    img.src = wordImageSrc(word)
    img.alt = word.english
    img.loading = 'lazy'
    thumbs.append(img)
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

  if (pack.source === 'custom') {
    const tools = el('div', 'pack-tools')
    const exp = el('button', 'btn-tiny', '导出')
    exp.type = 'button'
    exp.addEventListener('click', (e) => {
      e.stopPropagation()
      downloadPackJson(pack)
    })
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
    tools.append(exp, del)
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
    el('h1', 'hero-title', '课后看图陪练'),
    el(
      'p',
      'hero-lead',
      '框架固定：词汇 → 看图说话 → 巩固。内容可换：导入你家机构 / 老师的词包。',
    ),
  )
  shell.append(hero)

  const actions = el('div', 'home-actions')
  const importBtn = el('button', 'btn-secondary', '导入词包')
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

  const sampleLink = el('a', 'sample-link', '查看词包格式说明')
  sampleLink.href = `${import.meta.env.BASE_URL}content/README.md`
  sampleLink.target = '_blank'
  sampleLink.rel = 'noopener'

  actions.append(importBtn, createBtn, fileInput)
  shell.append(actions, sampleLink)

  if (homeError) {
    shell.append(el('p', 'form-error', homeError))
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
      '问题库属于框架，不随教材变化；换机构只换词包 JSON，陪练步骤不用改。',
    ),
  )
  app.append(shell)
}

function renderCreate(): void {
  clearApp()
  const shell = el('div', 'shell')
  const top = el('header', 'topbar')
  const back = el('button', 'btn-ghost', '取消')
  back.type = 'button'
  back.addEventListener('click', goHome)
  top.append(back, el('div', 'brand-mark', '新建词包'))
  shell.append(top)

  const main = el('main', 'main create-main')
  main.append(
    el('h1', 'title', '录入本课内容'),
    el('p', 'subtitle', '只填词和图；看图说话问句由框架自动套用。'),
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
  draft.words.forEach((w, index) => {
    const row = el('div', 'draft-row')
    const thumb = el('img', 'draft-thumb')
    thumb.src = w.imageDataUrl
    thumb.alt = w.english
    const info = el('div', 'draft-info')
    info.append(
      el('div', 'draft-en', w.english),
      el('div', 'draft-zh', `${w.chinese} · ${w.article}`),
    )
    const remove = el('button', 'btn-tiny btn-tiny-danger', '移除')
    remove.type = 'button'
    remove.addEventListener('click', () => {
      draft.words.splice(index, 1)
      render()
    })
    row.append(thumb, info, remove)
    wordList.append(row)
  })
  form.append(wordList)

  const addBox = el('div', 'add-word-box')
  addBox.append(el('h2', 'section-label', '添加一个词'))
  const enIn = el('input', 'field') as HTMLInputElement
  enIn.type = 'text'
  enIn.placeholder = 'English'
  const zhIn = el('input', 'field') as HTMLInputElement
  zhIn.type = 'text'
  zhIn.placeholder = '中文'
  const artIn = el('select', 'field') as HTMLSelectElement
  for (const a of ['a', 'an'] as const) {
    const opt = el('option', undefined, a) as HTMLOptionElement
    opt.value = a
    artIn.append(opt)
  }
  enIn.addEventListener('input', () => {
    artIn.value = guessArticle(enIn.value)
  })

  let pendingImage = ''
  const imgPreview = el('div', 'img-preview', '尚未选图')
  const imgInput = el('input', 'sr-only') as HTMLInputElement
  imgInput.type = 'file'
  imgInput.accept = 'image/*'
  imgInput.addEventListener('change', () => {
    const file = imgInput.files?.[0]
    imgInput.value = ''
    if (!file) return
    void fileToDataUrl(file)
      .then((dataUrl) => {
        pendingImage = dataUrl
        imgPreview.replaceChildren()
        const img = el('img', 'img-preview-pic')
        img.src = dataUrl
        img.alt = 'preview'
        imgPreview.append(img)
      })
      .catch(() => {
        draft.error = '图片处理失败'
        render()
      })
  })
  const pickImg = el('button', 'btn-secondary', '上传图片')
  pickImg.type = 'button'
  pickImg.addEventListener('click', () => imgInput.click())

  const addWord = el('button', 'btn-secondary', '加入词包')
  addWord.type = 'button'
  addWord.addEventListener('click', () => {
    const english = enIn.value.trim()
    const chinese = zhIn.value.trim()
    if (!english || !chinese) {
      draft.error = '请填写英文和中文'
      render()
      return
    }
    if (!pendingImage) {
      draft.error = '请上传该词的图片'
      render()
      return
    }
    if (draft.words.length >= 40) {
      draft.error = '单个词包最多 40 个词'
      render()
      return
    }
    draft.words.push({
      english,
      chinese,
      article: artIn.value === 'an' ? 'an' : 'a',
      imageDataUrl: pendingImage,
    })
    draft.error = ''
    render()
  })

  addBox.append(enIn, zhIn, artIn, pickImg, imgInput, imgPreview, addWord)
  form.append(addBox)

  if (draft.error) form.append(el('p', 'form-error', draft.error))

  const save = el('button', 'btn-primary', '保存到本机')
  save.type = 'button'
  save.addEventListener('click', () => {
    void (async () => {
      const titleZh = draft.titleZh.trim()
      if (!titleZh) {
        draft.error = '请填写中文标题'
        render()
        return
      }
      if (draft.words.length === 0) {
        draft.error = '请至少添加 1 个词'
        render()
        return
      }
      const id = `custom-${slugId(titleZh)}-${Date.now().toString(36)}`
      const pack: LessonPack = {
        id,
        titleZh,
        titleEn: draft.titleEn.trim() || titleZh,
        blurb: draft.blurb.trim() || '自定义课程内容',
        source: 'custom',
        words: draft.words.map((w) => ({
          id: slugId(w.english),
          english: w.english,
          chinese: w.chinese,
          article: w.article,
          image: w.imageDataUrl,
        })),
      }
      // ensure unique word ids within pack
      const seen = new Set<string>()
      for (const word of pack.words) {
        let next = word.id
        let n = 2
        while (seen.has(next)) {
          next = `${word.id}-${n}`
          n += 1
        }
        word.id = next
        seen.add(next)
      }
      try {
        await saveCustomPack(pack)
        await refreshPacks()
        screen = 'home'
        homeError = ''
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

function renderPicture(word: WordDef): HTMLElement {
  const frame = el('div', 'picture-frame')
  const img = el('img', 'picture')
  img.src = wordImageSrc(word)
  img.alt = word.english
  frame.append(img)
  return frame
}

function renderVocab(): void {
  if (!session) return
  const word = currentWord()
  if (!word) return
  const total = session.pack.words.length
  const body = el('div', 'stage')
  body.append(renderPicture(word))

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
      '家长：指着图，让孩子先听再跟读英文；可以说中文意思帮助理解。',
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
    session.wordIndex >= total - 1 ? '进入看图说话' : '下一个词',
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
  body.append(renderPicture(word))
  body.append(el('div', 'q-chip', question.labelZh))

  const script = el('div', 'script')
  script.append(el('p', 'script-cue', question.parentCueZh))
  const askBtn = el('button', 'ask-line', question.askEn(word))
  askBtn.type = 'button'
  askBtn.title = '朗读问句'
  askBtn.addEventListener('click', () => speakEnglish(question.askEn(word)))
  script.append(askBtn)
  if (question.tipZh) script.append(el('p', 'script-tip', question.tipZh))

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
    title: '看图说话',
    subtitle: `${word.chinese} · 问题 ${session.questionIndex + 1}/${talkQuestions.length}`,
    body,
    footer,
  })
}

function renderReview(): void {
  if (!session) return
  const word = currentWord()
  if (!word) return

  const body = el('div', 'stage')
  body.append(renderPicture(word))
  body.append(
    el(
      'p',
      'parent-cue',
      session.reviewReveal
        ? '对照发音，再让孩子用完整句说一遍：This is … / I like …'
        : '遮住英文：问孩子 “What is this?”，等他说完再点下方按钮。',
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
    for (const line of [
      `This is ${word.article} ${word.english}.`,
      `I like ${word.english}.`,
    ]) {
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
