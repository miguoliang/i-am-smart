import './style.css'
import { questionsForTalk, type QuestionTemplate } from './data/questions'
import {
  assetUrl,
  PACKS,
  packById,
  preloadPackImages,
  type LessonPack,
  type WordDef,
} from './data/words'
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

type Phase = 'home' | 'vocab' | 'talk' | 'review' | 'done'

interface Session {
  pack: LessonPack
  phase: Phase
  wordIndex: number
  questionIndex: number
  revealAnswer: boolean
  reviewReveal: boolean
}

const talkQuestions = questionsForTalk()
let session: Session | null = null

const PHASES: { id: Exclude<Phase, 'home' | 'done'>; label: string }[] = [
  { id: 'vocab', label: '词汇' },
  { id: 'talk', label: '看图说话' },
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

function startPack(packId: string): void {
  const pack = packById(packId)
  if (!pack) return
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
  render()
}

function goHome(): void {
  session = null
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
    if (opts.phase === 'home') return
    if (confirm('结束本次陪练，回到首页？')) goHome()
  })
  const brand = el('div', 'brand-mark', '陪练本')
  top.append(back, brand)
  shell.append(top)

  if (opts.phase !== 'home' && opts.phase !== 'done') {
    shell.append(renderPhaseRail(opts.phase))
  }

  const main = el('main', 'main')
  const heading = el('div', 'heading')
  heading.append(el('h1', 'title', opts.title))
  if (opts.subtitle) heading.append(el('p', 'subtitle', opts.subtitle))
  main.append(heading, opts.body)
  shell.append(main)

  if (opts.footer) shell.append(opts.footer)
  app.append(shell)
}

function renderHome(): void {
  clearApp()
  const shell = el('div', 'shell home-shell')

  const hero = el('section', 'hero')
  hero.append(
    el('p', 'hero-brand', '陪练本'),
    el('h1', 'hero-title', '课后看图陪练'),
    el('p', 'hero-lead', '词汇热身 → 固定问句看图说话 → 口头巩固。家长照着问即可。'),
  )
  shell.append(hero)

  const list = el('section', 'pack-list')
  list.append(el('h2', 'section-label', '选今天的词包'))

  for (const pack of PACKS) {
    const card = el('button', 'pack-card')
    card.type = 'button'
    const thumbs = el('div', 'pack-thumbs')
    for (const word of pack.words.slice(0, 4)) {
      const img = el('img', 'pack-thumb')
      img.src = assetUrl(word.image)
      img.alt = word.english
      img.loading = 'lazy'
      thumbs.append(img)
    }
    const meta = el('div', 'pack-meta')
    meta.append(
      el('div', 'pack-title', pack.titleZh),
      el('div', 'pack-en', pack.titleEn),
      el('div', 'pack-blurb', `${pack.words.length} 词 · ${pack.blurb}`),
    )
    card.append(thumbs, meta)
    card.addEventListener('click', () => startPack(pack.id))
    list.append(card)
  }

  const note = el(
    'p',
    'home-note',
    '问题库固定不变，只换图和词——和外教课同一套骨架，专门留给课后巩固。',
  )
  shell.append(list, note)
  app.append(shell)
}

function renderPicture(word: WordDef): HTMLElement {
  const frame = el('div', 'picture-frame')
  const img = el('img', 'picture')
  img.src = assetUrl(word.image)
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

  const cue = el(
    'p',
    'parent-cue',
    '家长：指着图，让孩子先听再跟读英文；可以说中文意思帮助理解。',
  )
  body.append(cue)

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

  const chip = el('div', 'q-chip', question.labelZh)
  body.append(chip)

  const script = el('div', 'script')
  script.append(el('p', 'script-cue', question.parentCueZh))

  const askBtn = el('button', 'ask-line', question.askEn(word))
  askBtn.type = 'button'
  askBtn.title = '朗读问句'
  askBtn.addEventListener('click', () => speakEnglish(question.askEn(word)))
  script.append(askBtn)

  if (question.tipZh) {
    script.append(el('p', 'script-tip', question.tipZh))
  }

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

  const qProgress = `${session.wordIndex * talkQuestions.length + session.questionIndex + 1}/${session.pack.words.length * talkQuestions.length}`
  const next = el('button', 'btn-primary', '下一题')
  next.type = 'button'
  next.dataset.progress = qProgress
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

  const prompt = el(
    'p',
    'parent-cue',
    session.reviewReveal
      ? '对照发音，再让孩子用完整句说一遍：This is … / I like …'
      : '遮住英文：问孩子 “What is this?”，等他说完再点下方按钮。',
  )
  body.append(prompt)

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
      `已练完「${session.pack.titleZh}」：词汇热身、看图说话固定问句、口头巩固。明天可换词包，问题骨架不变。`,
    ),
  )
  const actions = el('div', 'done-actions')
  const again = el('button', 'btn-primary', '再用本包练一次')
  again.type = 'button'
  again.addEventListener('click', () => startPack(session!.pack.id))
  const home = el('button', 'btn-secondary', '回首页选词包')
  home.type = 'button'
  home.addEventListener('click', goHome)
  actions.append(again, home)
  shell.append(actions)
  app.append(shell)
}

function render(): void {
  if (!session) {
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

render()
