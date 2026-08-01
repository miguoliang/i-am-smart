import './style.css'
import { FOOD_WORDS, assetUrl, preloadWordImages, wordById } from './data/words'
import { Match3Engine } from './game/engine'
import {
  bindNativeChrome,
  haptic,
  registerServiceWorker,
  unlockAudio,
} from './game/feel'
import {
  getNextStep,
  loadProgress,
  markLevelCleared,
  saveProgress,
  type PlaySetup,
  type ProgressState,
  unlockWord,
} from './game/progress'
import { speakEnglish } from './game/tts'
import type { CellPos, GameSnapshot, MatchGroup, SettleResult, Tile } from './game/types'

bindNativeChrome()
registerServiceWorker()

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const ALL_WORD_IDS = FOOD_WORDS.map((w) => w.id)

let progress: ProgressState = loadProgress()
let currentSetup: PlaySetup | null = null

const engine = new Match3Engine({
  wordIds: ALL_WORD_IDS,
  cols: 6,
  rows: 8,
  moves: 28,
  maxGoals: 3,
  goalPerWord: 3,
  textWordIds: [],
  wordTileChance: 0,
  goalFocusIds: ALL_WORD_IDS,
})

let busy = false
let toastTimer = 0
let hintTimer = 0
/** Board px step cached while busy so motion never reflows mid-animation. */
let cachedStep = 0
let layoutPending = false

const HINT_IDLE_MS = 4200

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function setBusy(next: boolean): void {
  busy = next
  boardEl.classList.toggle('is-resolving', next)
  if (!next && layoutPending) {
    layoutPending = false
    layoutBoard()
  }
}

type DragState = {
  pointerId: number
  from: CellPos
  startX: number
  startY: number
}

let drag: DragState | null = null

app.innerHTML = `
  <div class="shell">
    <div class="playfield">
      <header class="hud">
        <div class="hud-level" id="level-chip">第 1 关</div>
        <section class="goals-bar" aria-label="收集目标">
          <div class="goal-grid" id="goals"></div>
        </section>
        <div class="hud-stat" aria-label="剩余步数" id="moves-badge">
          <span class="hud-label">步数</span>
          <span class="hud-value" id="moves">28</span>
        </div>
      </header>

      <div class="board-stage">
        <div class="board-wrap">
          <div class="board" id="board" aria-label="三消棋盘"></div>
          <div class="burst-layer" id="bursts" aria-hidden="true"></div>
          <div class="toast" id="toast" aria-live="polite">
            <span class="toast-en" id="toast-en"></span>
            <span class="toast-zh" id="toast-zh"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="overlay" id="overlay">
      <div class="end-sky" aria-hidden="true"></div>
      <div class="end-rays" aria-hidden="true"></div>
      <div class="end-fx" id="end-fx" aria-hidden="true"></div>
      <div class="end-content">
        <span class="end-badge" id="end-badge"></span>
        <h2 class="end-title" id="overlay-title"></h2>
        <p class="end-meta" id="end-meta"></p>
        <div class="end-goals" id="end-goals"></div>
        <button class="btn end-btn" type="button" id="overlay-btn">下一关</button>
      </div>
    </div>
    <div class="learn" id="learn">
      <div class="learn-pick" id="learn-pick">
        <p class="learn-kicker">选一张图</p>
        <h2 class="learn-pick-title">学习它的英文</h2>
        <div class="learn-pick-grid" id="learn-pick-grid"></div>
      </div>
      <div class="learn-card" id="learn-card" hidden>
        <p class="learn-kicker">新单词</p>
        <img class="learn-img" id="learn-img" alt="" />
        <h2 class="learn-en" id="learn-en"></h2>
        <p class="learn-zh" id="learn-zh"></p>
        <button class="btn learn-speak" type="button" id="learn-speak">听发音</button>
        <button class="btn end-btn" type="button" id="learn-go">学会了，继续</button>
      </div>
    </div>
  </div>
`

const boardEl = app.querySelector<HTMLDivElement>('#board')!
const boardWrapEl = app.querySelector<HTMLDivElement>('.board-wrap')!
const boardStageEl = app.querySelector<HTMLDivElement>('.board-stage')!
const playfieldEl = app.querySelector<HTMLDivElement>('.playfield')!
const goalsEl = app.querySelector<HTMLDivElement>('#goals')!
const movesEl = app.querySelector<HTMLSpanElement>('#moves')!
const levelChipEl = app.querySelector<HTMLDivElement>('#level-chip')!
const toastEl = app.querySelector<HTMLDivElement>('#toast')!
const toastEn = app.querySelector<HTMLSpanElement>('#toast-en')!
const toastZh = app.querySelector<HTMLSpanElement>('#toast-zh')!
const overlayEl = app.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = app.querySelector<HTMLHeadingElement>('#overlay-title')!
const overlayBtn = app.querySelector<HTMLButtonElement>('#overlay-btn')!
const endBadgeEl = app.querySelector<HTMLSpanElement>('#end-badge')!
const endMetaEl = app.querySelector<HTMLParagraphElement>('#end-meta')!
const endGoalsEl = app.querySelector<HTMLDivElement>('#end-goals')!
const endFxEl = app.querySelector<HTMLDivElement>('#end-fx')!
const burstsEl = app.querySelector<HTMLDivElement>('#bursts')!
const learnEl = app.querySelector<HTMLDivElement>('#learn')!
const learnPickEl = app.querySelector<HTMLDivElement>('#learn-pick')!
const learnPickGrid = app.querySelector<HTMLDivElement>('#learn-pick-grid')!
const learnCardEl = app.querySelector<HTMLDivElement>('#learn-card')!
const learnImg = app.querySelector<HTMLImageElement>('#learn-img')!
const learnEn = app.querySelector<HTMLHeadingElement>('#learn-en')!
const learnZh = app.querySelector<HTMLParagraphElement>('#learn-zh')!
const learnSpeakBtn = app.querySelector<HTMLButtonElement>('#learn-speak')!
const learnGoBtn = app.querySelector<HTMLButtonElement>('#learn-go')!

let pendingLearnWordId: string | null = null
let overlayMode: 'win' | 'lose' | 'complete' | null = null

boardEl.style.gridTemplateColumns = `repeat(${engine.cols}, minmax(0, 1fr))`
boardEl.style.gridTemplateRows = `repeat(${engine.rows}, minmax(0, 1fr))`

/**
 * Fit the board into `.board-stage` while keeping cols×rows aspect.
 * Re-run via ResizeObserver — iOS visualViewport / font / chrome changes
 * used to leave a one-shot layout stuck until refresh.
 * Never resize during resolve animations (that is a common source of frame skips).
 */
function layoutBoard(): void {
  if (busy) {
    layoutPending = true
    return
  }

  const stageW = boardStageEl.clientWidth
  const stageH = boardStageEl.clientHeight
  if (stageW < 40 || stageH < 40) return

  let width = stageW
  let height = Math.floor((width * engine.rows) / engine.cols)
  if (height > stageH) {
    height = stageH
    width = Math.floor((height * engine.cols) / engine.rows)
  }

  const nextW = `${width}px`
  const nextH = `${height}px`
  if (boardWrapEl.style.width !== nextW) boardWrapEl.style.width = nextW
  if (boardWrapEl.style.height !== nextH) boardWrapEl.style.height = nextH

  // Refresh motion step only when the board is idle.
  cachedStep = stepSize()
}

function bindBoardLayout(): void {
  const ro = new ResizeObserver(() => layoutBoard())
  ro.observe(boardStageEl)
  ro.observe(playfieldEl)
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => layoutBoard())
  })
  window.addEventListener('resize', layoutBoard)
  void document.fonts?.ready?.then(() => layoutBoard())
  layoutBoard()
  // Catch late iOS viewport settling after first paint.
  requestAnimationFrame(() => {
    layoutBoard()
    requestAnimationFrame(layoutBoard)
  })
}

function boardMetrics(): { size: number; gap: number; pad: number } {
  const styles = getComputedStyle(boardEl)
  const gap = parseFloat(styles.gap) || 5
  const pad = parseFloat(styles.paddingLeft) || 0
  const inner = boardEl.clientWidth - pad * 2
  const size = (inner - gap * (engine.cols - 1)) / engine.cols
  return { size, gap, pad }
}

function stepSize(): number {
  const { size, gap } = boardMetrics()
  return size + gap
}

function tileEl(row: number, col: number): HTMLElement | null {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`)
}

function pulseStat(el: HTMLElement): void {
  el.classList.remove('pulse')
  void el.offsetWidth
  el.classList.add('pulse')
}

function flashToast(en: string, zh: string, speak = false): void {
  toastEn.textContent = en
  toastZh.textContent = zh
  toastEl.classList.remove('show')
  requestAnimationFrame(() => {
    toastEl.classList.remove('show')
    requestAnimationFrame(() => toastEl.classList.add('show'))
  })
  if (speak) window.setTimeout(() => speakEnglish(en), 0)
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1200)
}

function showToast(wordId: string): void {
  const word = wordById(wordId)
  if (!word) return
  flashToast(word.english, word.chinese, true)
}

function clearHintVisual(): void {
  boardEl.querySelectorAll('.tile.hint').forEach((node) => {
    node.classList.remove('hint')
  })
}

function clearHint(): void {
  window.clearTimeout(hintTimer)
  hintTimer = 0
  clearHintVisual()
}

function showHint(): void {
  if (busy || engine.won || engine.lost || drag) return

  const moves = engine.findHintMoves()
  if (moves.length === 0) {
    void ensurePlayable()
    return
  }

  clearHintVisual()
  const pick = moves[Math.floor(Math.random() * moves.length)]!
  tileEl(pick.a.row, pick.a.col)?.classList.add('hint')
  tileEl(pick.b.row, pick.b.col)?.classList.add('hint')
}

function scheduleHint(delay = HINT_IDLE_MS): void {
  window.clearTimeout(hintTimer)
  hintTimer = 0
  clearHintVisual()
  if (busy || engine.won || engine.lost) return
  hintTimer = window.setTimeout(() => showHint(), delay)
}

async function reshuffleBoard(): Promise<void> {
  clearHint()
  setBusy(true)
  flashToast('Shuffle', '重新排列')
  haptic([12, 40, 12])
  engine.shuffleBoard()
  renderBoard({ enter: true })
  await wait(480)
  setBusy(false)
  scheduleHint()
}

async function ensurePlayable(): Promise<void> {
  if (engine.won || engine.lost) {
    clearHint()
    return
  }
  if (engine.hasValidMove()) {
    scheduleHint()
    return
  }
  await reshuffleBoard()
}

function spawnBursts(matches: MatchGroup[]): void {
  const { size, gap, pad } = boardMetrics()
  // board-wrap padding matches .board-wrap / .burst-layer inset (no layout reads).
  const wrapPad = 4

  for (const group of matches) {
    for (const c of group.cells) {
      const x = wrapPad + pad + c.col * (size + gap) + size / 2
      const y = wrapPad + pad + c.row * (size + gap) + size / 2
      const burst = document.createElement('span')
      burst.className = 'burst'
      burst.style.left = `${x}px`
      burst.style.top = `${y}px`
      burstsEl.appendChild(burst)
      window.setTimeout(() => burst.remove(), 620)
    }
  }
}

function ensureGoalSlots(count: number): HTMLElement[] {
  while (goalsEl.children.length < count) {
    const el = document.createElement('div')
    el.className = 'goal'
    const img = document.createElement('img')
    img.decoding = 'async'
    img.alt = ''
    const badge = document.createElement('span')
    badge.className = 'goal-count'
    el.append(img, badge)
    goalsEl.appendChild(el)
  }
  while (goalsEl.children.length > count) {
    goalsEl.lastElementChild?.remove()
  }
  return [...goalsEl.children] as HTMLElement[]
}

function renderGoals(prevDone?: Set<string>): void {
  const snap = engine.snapshot()
  const slots = ensureGoalSlots(snap.goals.length)

  snap.goals.forEach((g, i) => {
    const el = slots[i]!
    const word = wordById(g.wordId)!
    const done = g.current >= g.target
    const left = Math.max(0, g.target - g.current)
    const justDone = Boolean(done && prevDone && !prevDone.has(g.wordId))

    el.title = word.english
    el.classList.toggle('done', done)

    if (justDone) {
      el.classList.remove('pop')
      requestAnimationFrame(() => {
        el.classList.remove('pop')
        requestAnimationFrame(() => el.classList.add('pop'))
      })
    } else {
      el.classList.remove('pop')
    }

    const img = el.querySelector('img')!
    const src = assetUrl(word.image)
    if (img.getAttribute('src') !== src) {
      img.src = src
      img.alt = word.english
    }

    const badge = el.querySelector('.goal-count')!
    const next = done ? '✓' : String(left)
    if (badge.textContent !== next) badge.textContent = next
  })
}

function updateHud(animate = false): void {
  const snap = engine.snapshot()
  const prevMoves = movesEl.textContent
  movesEl.textContent = String(snap.movesLeft)
  if (animate && prevMoves !== movesEl.textContent) pulseStat(movesEl)
}

type RenderOptions = {
  enter?: boolean
}

const MOTION_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SWAP_MS = 200
const CLEAR_MS = 380
const FALL_MS = 480

function motionStep(): number {
  return cachedStep > 0 ? cachedStep : stepSize()
}

function playMotion(
  el: HTMLElement,
  keyframes: Keyframe[],
  ms: number,
): Animation {
  el.classList.add('is-moving')
  return el.animate(keyframes, {
    duration: ms,
    easing: MOTION_EASE,
    // both: from-state applies immediately — no rest-frame flash before play
    fill: 'both',
    composite: 'replace',
  })
}

async function finishMotion(anims: Animation[]): Promise<void> {
  if (anims.length === 0) return
  await Promise.all(anims.map((a) => a.finished.catch(() => undefined)))
  for (const anim of anims) {
    const el = anim.effect && 'target' in anim.effect
      ? (anim.effect as KeyframeEffect).target
      : null
    anim.cancel()
    if (el instanceof HTMLElement) {
      el.classList.remove('is-moving', 'swapping')
      el.style.transform = ''
      el.style.opacity = ''
    }
  }
}

function ensureBoardSlots(): HTMLButtonElement[] {
  const n = engine.rows * engine.cols
  while (boardEl.children.length < n) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'tile empty'
    btn.disabled = true
    boardEl.appendChild(btn)
  }
  while (boardEl.children.length > n) {
    boardEl.lastElementChild?.remove()
  }
  return [...boardEl.children] as HTMLButtonElement[]
}

/** Assign tile art; retry once if Safari keeps a failed same-URL load. */
function setTileImage(img: HTMLImageElement, src: string, alt: string): void {
  img.alt = alt
  const broken =
    !!img.getAttribute('src') && img.complete && img.naturalWidth === 0
  if (img.getAttribute('src') === src && !broken) return

  img.onerror = () => {
    if (img.dataset.failSrc === src) return
    img.dataset.failSrc = src
    // Re-setting the same src after error is a no-op in WebKit — clear first.
    img.removeAttribute('src')
    requestAnimationFrame(() => {
      img.src = src
    })
  }

  if (broken || img.getAttribute('src') === src) img.removeAttribute('src')
  delete img.dataset.failSrc
  img.src = src
}

function paintTile(btn: HTMLButtonElement, tile: Tile): void {
  const word = wordById(tile.wordId)
  const same =
    btn.dataset.uid === String(tile.uid) &&
    btn.dataset.kind === tile.kind &&
    btn.dataset.wordId === tile.wordId

  if (same && tile.kind === 'image') {
    const img = btn.querySelector('img')
    // Same tile can still be a broken <img> after a flaky first load.
    if (img && !(img.complete && img.naturalWidth === 0)) return
  } else if (same) {
    return
  }

  btn.dataset.uid = String(tile.uid)
  btn.dataset.kind = tile.kind
  btn.dataset.wordId = tile.wordId

  if (tile.kind === 'image' && word) {
    let img = btn.querySelector('img')
    if (!img) {
      btn.replaceChildren()
      img = document.createElement('img')
      img.draggable = false
      img.decoding = 'async'
      btn.appendChild(img)
    }
    setTileImage(img, assetUrl(word.image), word.english)
  } else if (word) {
    let label = btn.querySelector('.tile-word-label') as HTMLSpanElement | null
    if (!label) {
      btn.replaceChildren()
      label = document.createElement('span')
      label.className = 'tile-word-label'
      btn.appendChild(label)
    }
    label.textContent = word.english
  }
}

function clearTilePaint(btn: HTMLButtonElement): void {
  delete btn.dataset.uid
  delete btn.dataset.kind
  delete btn.dataset.wordId
  if (btn.childNodes.length) btn.replaceChildren()
}

/** Cancel WAAPI / decorative motion and restore resting pose. */
function clearMotion(btn: HTMLElement): void {
  btn.getAnimations().forEach((anim) => anim.cancel())
  btn.style.transform = ''
  btn.style.opacity = ''
  btn.style.removeProperty('--stagger')
  btn.classList.remove('enter', 'shake', 'swapping', 'hint', 'is-moving')
}

function renderEndGoals(snap: GameSnapshot): void {
  endGoalsEl.innerHTML = snap.goals
    .map((g) => {
      const word = wordById(g.wordId)!
      const done = g.current >= g.target
      const left = Math.max(0, g.target - g.current)
      return `
        <div class="end-goal ${done ? 'is-done' : 'is-miss'}" title="${word.english}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
          <span class="end-goal-mark">${done ? '✓' : left}</span>
        </div>
      `
    })
    .join('')
}

const WIN_CONFETTI = ['#ffd36a', '#fff6c8', '#7dcea0', '#ff9f68', '#ffe08a', '#5fb396', '#fffaf0']

function spawnEndFx(kind: 'win' | 'lose'): void {
  endFxEl.replaceChildren()

  if (kind === 'lose') {
    for (let i = 0; i < 10; i++) {
      const spark = document.createElement('span')
      spark.className = 'end-ember'
      spark.style.setProperty('--x', `${10 + Math.random() * 80}%`)
      spark.style.setProperty('--delay', `${Math.random() * 0.6}s`)
      spark.style.setProperty('--dur', `${1.1 + Math.random() * 0.9}s`)
      spark.style.setProperty('--drift', `${(Math.random() * 36 - 18).toFixed(1)}px`)
      endFxEl.appendChild(spark)
    }
    return
  }

  for (let i = 0; i < 42; i++) {
    const piece = document.createElement('span')
    const shape = i % 4 === 0 ? 'ribbon' : i % 4 === 1 ? 'star' : 'dot'
    piece.className = `confetti confetti-${shape}`
    piece.style.setProperty('--x', `${Math.random() * 100}%`)
    piece.style.setProperty('--delay', `${Math.random() * 1.35}s`)
    piece.style.setProperty('--dur', `${2 + Math.random() * 2.2}s`)
    piece.style.setProperty('--rot', `${Math.floor(Math.random() * 720 - 360)}deg`)
    piece.style.setProperty('--drift', `${(Math.random() * 120 - 60).toFixed(1)}px`)
    piece.style.setProperty('--scale', `${(0.65 + Math.random() * 1.1).toFixed(2)}`)
    piece.style.setProperty('--c', WIN_CONFETTI[i % WIN_CONFETTI.length]!)
    endFxEl.appendChild(piece)
  }

  for (let i = 0; i < 12; i++) {
    const burst = document.createElement('span')
    burst.className = 'end-burst'
    const angle = (i / 12) * Math.PI * 2
    burst.style.setProperty('--dx', `${Math.cos(angle) * (90 + Math.random() * 70)}px`)
    burst.style.setProperty('--dy', `${Math.sin(angle) * (90 + Math.random() * 70)}px`)
    burst.style.setProperty('--delay', `${0.05 + Math.random() * 0.18}s`)
    burst.style.setProperty('--c', WIN_CONFETTI[i % WIN_CONFETTI.length]!)
    endFxEl.appendChild(burst)
  }
}

function hideOverlay(): void {
  overlayEl.classList.remove('show', 'is-win', 'is-lose')
  endFxEl.replaceChildren()
  endGoalsEl.replaceChildren()
  overlayMode = null
}

function hideLearn(): void {
  learnEl.classList.remove('show')
  learnPickEl.hidden = false
  learnCardEl.hidden = true
  learnPickGrid.replaceChildren()
  pendingLearnWordId = null
}

function syncOverlay(snap: GameSnapshot): void {
  if (snap.won) {
    // Only fire the win celebration once per clear.
    if (overlayMode !== 'win') {
      clearHint()
      progress = markLevelCleared(progress)
      overlayMode = 'win'
      endBadgeEl.textContent = 'CLEAR'
      overlayTitle.textContent = '过关'
      endMetaEl.textContent =
        snap.movesLeft > 0 ? `剩余 ${snap.movesLeft} 步` : '完美通关'
      overlayBtn.textContent = '下一关'
      renderEndGoals(snap)
      spawnEndFx('win')
      overlayEl.classList.remove('is-lose')
      overlayEl.classList.add('show', 'is-win')
      haptic([10, 40, 18, 40, 24])
    }
  } else if (snap.lost) {
    if (overlayMode !== 'lose') {
      clearHint()
      overlayMode = 'lose'
      endBadgeEl.textContent = 'RETRY'
      overlayTitle.textContent = '失败'
      endMetaEl.textContent = '步数用尽'
      overlayBtn.textContent = '再试一次'
      renderEndGoals(snap)
      spawnEndFx('lose')
      overlayEl.classList.remove('is-win')
      overlayEl.classList.add('show', 'is-lose')
      haptic([20, 50, 20])
    }
  } else if (overlayMode !== 'complete') {
    hideOverlay()
  }
}

function showComplete(): void {
  clearHint()
  hideLearn()
  overlayMode = 'complete'
  endBadgeEl.textContent = 'MASTER'
  overlayTitle.textContent = '全部学会'
  endMetaEl.textContent = '食物词都学完啦'
  overlayBtn.textContent = '从第 1 关再来'
  endGoalsEl.innerHTML = progress.unlockedWords
    .map((id) => {
      const word = wordById(id)!
      return `
        <div class="end-goal is-done" title="${word.english}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
          <span class="end-goal-mark">✓</span>
        </div>
      `
    })
    .join('')
  spawnEndFx('win')
  overlayEl.classList.remove('is-lose')
  overlayEl.classList.add('show', 'is-win')
}

function showLearnCard(wordId: string): void {
  const word = wordById(wordId)
  if (!word) return
  pendingLearnWordId = wordId
  learnPickEl.hidden = true
  learnCardEl.hidden = false
  learnImg.src = assetUrl(word.image)
  learnImg.alt = word.english
  learnEn.textContent = word.english
  learnZh.textContent = word.chinese
  window.setTimeout(() => speakEnglish(word.english), 200)
}

function showPick(candidates: string[]): void {
  hideOverlay()
  clearHint()
  setBusy(true)
  pendingLearnWordId = null
  learnPickEl.hidden = false
  learnCardEl.hidden = true
  learnPickGrid.innerHTML = candidates
    .map((id) => {
      const word = wordById(id)!
      return `
        <button class="learn-pick-item" type="button" data-word-id="${word.id}" aria-label="${word.chinese}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
        </button>
      `
    })
    .join('')
  learnEl.classList.add('show')
}

function startPlay(setup: PlaySetup): void {
  hideOverlay()
  hideLearn()
  currentSetup = setup
  setBusy(false)
  drag = null
  boardEl.classList.remove('is-dragging')
  clearHint()

  const textWordIds = setup.textWordIds
  engine.configureRound({
    wordIds: ALL_WORD_IDS,
    textWordIds,
    wordTileChance: setup.imageOnly ? 0 : 0.48,
    goalFocusIds: setup.goalFocusIds,
    moves: 28,
    maxGoals: setup.imageOnly ? 3 : Math.min(3, Math.max(2, textWordIds.length)),
    goalPerWord: 3,
  })

  levelChipEl.textContent = setup.label
  renderBoard({ enter: true })
  updateHud(true)
  renderGoals()
  layoutBoard()
  scheduleHint(1800)
}

function continueCampaign(): void {
  const step = getNextStep(progress)
  if (step.kind === 'pick') {
    showPick(step.candidates)
    return
  }
  if (step.kind === 'complete') {
    showComplete()
    return
  }
  startPlay(step.setup)
}

function retryCurrentLevel(): void {
  if (!currentSetup) {
    continueCampaign()
    return
  }
  startPlay(currentSetup)
}

function onOverlayAction(): void {
  if (overlayMode === 'lose') {
    retryCurrentLevel()
    return
  }
  if (overlayMode === 'complete') {
    progress = {
      clearedLevels: 0,
      unlockedWords: [],
    }
    saveProgress(progress)
    continueCampaign()
    return
  }
  // win -> next campaign step
  continueCampaign()
}

function onLearnConfirm(): void {
  if (!pendingLearnWordId) return
  progress = unlockWord(progress, pendingLearnWordId)
  hideLearn()
  continueCampaign()
}

/** Sync DOM slots to engine state. Motion is handled separately via WAAPI. */
function renderBoard(opts: RenderOptions = {}): void {
  const snap = engine.snapshot()
  const slots = ensureBoardSlots()

  for (let row = 0; row < snap.rows; row++) {
    for (let col = 0; col < snap.cols; col++) {
      const i = row * snap.cols + col
      const tile = snap.cells[i]
      const btn = slots[i]!
      btn.dataset.row = String(row)
      btn.dataset.col = String(col)
      clearMotion(btn)

      if (!tile) {
        btn.disabled = true
        btn.classList.remove('word', 'image')
        btn.classList.add('empty')
        clearTilePaint(btn)
        continue
      }

      btn.disabled = false
      btn.classList.remove('empty')
      paintTile(btn, tile)
      btn.classList.toggle('word', tile.kind === 'word')
      btn.classList.toggle('image', tile.kind === 'image')

      if (opts.enter) {
        btn.style.setProperty('--stagger', String((row + col) % 8))
        btn.classList.add('enter')
      }
    }
  }

  syncOverlay(snap)
}

/**
 * Paint engine state and start clear in the same turn.
 * Avoids a resting paint frame between swap fill cancel and clear.
 */
function paintAndClear(clearing: Set<number>): Animation[] {
  const snap = engine.snapshot()
  const slots = ensureBoardSlots()
  const anims: Animation[] = []

  for (let i = 0; i < snap.cells.length; i++) {
    const tile = snap.cells[i]
    const btn = slots[i]!
    btn.dataset.row = String(Math.floor(i / snap.cols))
    btn.dataset.col = String(i % snap.cols)
    clearMotion(btn)

    if (!tile) {
      btn.disabled = true
      btn.classList.remove('word', 'image')
      btn.classList.add('empty')
      clearTilePaint(btn)
      continue
    }

    btn.disabled = false
    btn.classList.remove('empty')
    paintTile(btn, tile)
    btn.classList.toggle('word', tile.kind === 'word')
    btn.classList.toggle('image', tile.kind === 'image')

    if (clearing.has(i)) {
      btn.style.pointerEvents = 'none'
      anims.push(
        playMotion(
          btn,
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.82)', opacity: 0 },
          ],
          CLEAR_MS,
        ),
      )
    }
  }

  return anims
}

async function animateClear(cells: Iterable<number>): Promise<void> {
  const slots = ensureBoardSlots()
  const anims: Animation[] = []
  for (const i of cells) {
    const btn = slots[i]
    if (!btn || btn.classList.contains('empty')) continue
    const existing = btn.getAnimations().filter((a) => a.playState !== 'finished')
    if (existing.length > 0) {
      // Already clearing from paintAndClear — do not cancel/restart.
      anims.push(...existing)
      continue
    }
    clearMotion(btn)
    btn.style.pointerEvents = 'none'
    anims.push(
      playMotion(
        btn,
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.82)', opacity: 0 },
        ],
        CLEAR_MS,
      ),
    )
  }
  await Promise.all(anims.map((a) => a.finished.catch(() => undefined)))
  // Keep cleared tiles hidden until the next paint — cancelling fill would flash them back.
  for (const i of cells) {
    const btn = slots[i]
    if (!btn) continue
    btn.getAnimations().forEach((anim) => anim.cancel())
    btn.style.opacity = '0'
    btn.style.transform = ''
    btn.style.pointerEvents = ''
    btn.classList.remove('is-moving', 'swapping')
  }
}

/**
 * Paint settled board with fall/spawn start poses already applied, then ease down.
 * One sync turn — no resting-at-destination frame before motion starts.
 */
async function paintAndSettle(settle: SettleResult): Promise<void> {
  const snap = engine.snapshot()
  const slots = ensureBoardSlots()
  const step = motionStep()
  const fallByIndex = new Map<number, number>()
  const spawnByIndex = new Map<number, number>()

  for (const fall of settle.falls) {
    fallByIndex.set(fall.toRow * engine.cols + fall.col, fall.toRow - fall.fromRow)
  }
  for (const spawn of settle.spawns) {
    spawnByIndex.set(spawn.row * engine.cols + spawn.col, spawn.dropRows)
  }

  type Move = { btn: HTMLButtonElement; fromY: number; fromOpacity: number }
  const moves: Move[] = []

  for (let i = 0; i < snap.cells.length; i++) {
    const tile = snap.cells[i]
    const btn = slots[i]!
    btn.dataset.row = String(Math.floor(i / snap.cols))
    btn.dataset.col = String(i % snap.cols)
    clearMotion(btn)

    if (!tile) {
      btn.disabled = true
      btn.classList.remove('word', 'image')
      btn.classList.add('empty')
      clearTilePaint(btn)
      continue
    }

    btn.disabled = false
    btn.classList.remove('empty')
    paintTile(btn, tile)
    btn.classList.toggle('word', tile.kind === 'word')
    btn.classList.toggle('image', tile.kind === 'image')

    const fallRows = fallByIndex.get(i)
    const dropRows = spawnByIndex.get(i)
    if (fallRows != null && fallRows > 0) {
      const fromY = -fallRows * step
      btn.style.transform = `translateY(${fromY}px)`
      btn.classList.add('swapping', 'is-moving')
      moves.push({ btn, fromY, fromOpacity: 1 })
    } else if (dropRows != null) {
      const fromY = -dropRows * step
      btn.style.transform = `translateY(${fromY}px)`
      btn.style.opacity = '0'
      btn.classList.add('swapping', 'is-moving')
      moves.push({ btn, fromY, fromOpacity: 0 })
    }
  }

  // Start WAAPI from the inline start pose in the same turn.
  const anims = moves.map(({ btn, fromY, fromOpacity }) => {
    const anim = playMotion(
      btn,
      [
        { transform: `translateY(${fromY}px)`, opacity: fromOpacity },
        { transform: 'translateY(0px)', opacity: 1 },
      ],
      FALL_MS,
    )
    // WAAPI owns the pose now — drop inline so we do not double-apply.
    btn.style.transform = ''
    btn.style.opacity = ''
    return anim
  })

  await finishMotion(anims)
}

async function animateSwapReject(a: CellPos, b: CellPos): Promise<void> {
  const aEl = tileEl(a.row, a.col)
  const bEl = tileEl(b.row, b.col)
  if (!aEl || !bEl) return

  // Swap fill is still applied — start bounce-back from that pose (no cancel/snap).
  const step = motionStep()
  const dx = (b.col - a.col) * step
  const dy = (b.row - a.row) * step
  aEl.classList.add('swapping')
  bEl.classList.add('swapping')

  await finishMotion([
    playMotion(
      aEl,
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }],
      220,
    ),
    playMotion(
      bEl,
      [{ transform: `translate(${-dx}px, ${-dy}px)` }, { transform: 'translate(0px, 0px)' }],
      220,
    ),
  ])

  clearMotion(aEl)
  clearMotion(bEl)
  aEl.classList.add('shake')
  bEl.classList.add('shake')
  await wait(460)
}

async function resolveWithAnimation(
  firstMatches: MatchGroup[],
  opts: { alreadyClearing?: boolean } = {},
): Promise<void> {
  let matches = firstMatches
  const seenToast = new Set<string>()
  let firstWave = true

  while (matches.length > 0) {
    const clearing = new Set<number>()
    for (const g of matches) {
      for (const c of g.cells) clearing.add(c.row * engine.cols + c.col)
    }

    const prevDone = new Set(
      engine.goals.filter((g) => g.current >= g.target).map((g) => g.wordId),
    )

    if (!(firstWave && opts.alreadyClearing)) {
      void paintAndClear(clearing)
    }
    firstWave = false

    haptic([8, 30, 12])
    spawnBursts(matches)
    await animateClear(clearing)

    const cleared = engine.clearMatches(matches)
    const settle = engine.settle()
    const settlePromise = paintAndSettle(settle)
    updateHud(false)
    renderGoals(prevDone)
    // Toasts after settle — speech/DOM work mid-fall causes jank on phones.
    await settlePromise

    for (const wordId of cleared) {
      if (!seenToast.has(wordId)) {
        seenToast.add(wordId)
        showToast(wordId)
      }
    }
    matches = engine.findMatches()
  }

  engine.checkEnd()
  renderBoard()
  updateHud(true)
  renderGoals()
}

function neighborToward(from: CellPos, dx: number, dy: number): CellPos | null {
  // Direction-only: a short swipe is enough; no finger tracking.
  const threshold = Math.max(18, stepSize() * 0.16)
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null

  if (Math.abs(dx) >= Math.abs(dy)) {
    const col = from.col + (dx > 0 ? 1 : -1)
    if (col < 0 || col >= engine.cols) return null
    return { row: from.row, col }
  }
  const row = from.row + (dy > 0 ? 1 : -1)
  if (row < 0 || row >= engine.rows) return null
  return { row, col: from.col }
}

function endPointerGesture(pointerId: number): void {
  boardEl.classList.remove('is-dragging')
  try {
    boardEl.releasePointerCapture(pointerId)
  } catch {
    // already released
  }
}

async function animateSwapTo(from: CellPos, to: CellPos): Promise<void> {
  const aEl = tileEl(from.row, from.col)
  const bEl = tileEl(to.row, to.col)
  if (!aEl || !bEl) return

  const step = motionStep()
  const dx = (to.col - from.col) * step
  const dy = (to.row - from.row) * step
  aEl.classList.add('swapping')
  bEl.classList.add('swapping')

  const anims = [
    playMotion(
      aEl,
      [{ transform: 'translate(0px, 0px)' }, { transform: `translate(${dx}px, ${dy}px)` }],
      SWAP_MS,
    ),
    playMotion(
      bEl,
      [{ transform: 'translate(0px, 0px)' }, { transform: `translate(${-dx}px, ${-dy}px)` }],
      SWAP_MS,
    ),
  ]
  // Keep fill until the next sync paint/reject — cancelling here causes snap-back.
  await Promise.all(anims.map((a) => a.finished.catch(() => undefined)))
}

async function trySwipeSwap(from: CellPos, to: CellPos): Promise<void> {
  setBusy(true)
  if (cachedStep <= 0) cachedStep = stepSize()
  clearHint()

  await animateSwapTo(from, to)
  const result = engine.commitSwap(from, to)

  if (!result.ok) {
    haptic([10, 40, 10])
    await animateSwapReject(from, to)
    renderBoard()
    updateHud(false)
    setBusy(false)
    scheduleHint()
    return
  }

  const clearing = new Set<number>()
  for (const g of result.matches) {
    for (const c of g.cells) clearing.add(c.row * engine.cols + c.col)
  }
  // One turn: drop swap fills, paint swapped art, start clear — no gap frame.
  paintAndClear(clearing)
  updateHud(true)
  await resolveWithAnimation(result.matches, { alreadyClearing: true })
  setBusy(false)
  await ensurePlayable()
}

async function commitSwipeIfReady(state: DragState, dx: number, dy: number): Promise<boolean> {
  const to = neighborToward(state.from, dx, dy)
  if (!to || !engine.areAdjacent(state.from, to)) return false

  drag = null
  endPointerGesture(state.pointerId)
  haptic(10)
  await trySwipeSwap(state.from, to)
  return true
}

function posFromEventTarget(target: EventTarget | null): CellPos | null {
  const el = (target as HTMLElement | null)?.closest?.('.tile') as HTMLButtonElement | null
  if (!el || el.classList.contains('empty') || el.disabled) return null
  const row = Number(el.dataset.row)
  const col = Number(el.dataset.col)
  if (!Number.isFinite(row) || !Number.isFinite(col)) return null
  return { row, col }
}

function onPointerDown(e: PointerEvent): void {
  if (busy || engine.won || engine.lost || drag) return
  if (e.button !== 0 && e.pointerType === 'mouse') return

  const from = posFromEventTarget(e.target)
  if (!from) return

  clearHint()
  drag = {
    pointerId: e.pointerId,
    from,
    startX: e.clientX,
    startY: e.clientY,
  }

  boardEl.setPointerCapture(e.pointerId)
  boardEl.classList.add('is-dragging')
  e.preventDefault()
}

function onPointerMove(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId || busy) return
  const state = drag
  const dx = e.clientX - state.startX
  const dy = e.clientY - state.startY
  void commitSwipeIfReady(state, dx, dy)
  e.preventDefault()
}

async function onPointerUp(e: PointerEvent): Promise<void> {
  if (!drag || e.pointerId !== drag.pointerId) return

  const state = drag
  const dx = e.clientX - state.startX
  const dy = e.clientY - state.startY

  if (await commitSwipeIfReady(state, dx, dy)) return

  drag = null
  endPointerGesture(state.pointerId)
  scheduleHint()
}

function onPointerCancel(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return
  drag = null
  endPointerGesture(e.pointerId)
  scheduleHint()
}

boardEl.addEventListener('pointerdown', onPointerDown)
boardEl.addEventListener('pointermove', onPointerMove)
boardEl.addEventListener('pointerup', onPointerUp)
boardEl.addEventListener('pointercancel', onPointerCancel)

overlayBtn.addEventListener('click', onOverlayAction)
learnGoBtn.addEventListener('click', onLearnConfirm)
learnSpeakBtn.addEventListener('click', () => {
  if (pendingLearnWordId) {
    const word = wordById(pendingLearnWordId)
    if (word) speakEnglish(word.english)
  }
})
learnPickGrid.addEventListener('click', (event) => {
  const btn = (event.target as HTMLElement | null)?.closest?.(
    '.learn-pick-item',
  ) as HTMLButtonElement | null
  const wordId = btn?.dataset.wordId
  if (!wordId) return
  haptic(10)
  showLearnCard(wordId)
})

// Long-press moves badge to retry the current level.
const movesBadgeEl = app.querySelector('#moves-badge')
let restartTimer = 0
movesBadgeEl?.addEventListener('pointerdown', () => {
  restartTimer = window.setTimeout(() => {
    haptic(16)
    retryCurrentLevel()
  }, 650)
})
movesBadgeEl?.addEventListener('pointerup', () => window.clearTimeout(restartTimer))
movesBadgeEl?.addEventListener('pointerleave', () => window.clearTimeout(restartTimer))
movesBadgeEl?.addEventListener('pointercancel', () => window.clearTimeout(restartTimer))
bindBoardLayout()

let audioReady = false
const armAudio = () => {
  if (audioReady) return
  audioReady = true
  unlockAudio()
}
window.addEventListener('pointerdown', armAudio, { once: true })

const boot = document.querySelector('#boot')
void preloadWordImages().finally(() => {
  continueCampaign()
  layoutBoard()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      boot?.classList.add('hide')
      layoutBoard()
    })
  })
})
