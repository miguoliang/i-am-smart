import './style.css'
import { FOOD_WORDS, assetUrl, wordById } from './data/words'
import { Match3Engine } from './game/engine'
import {
  bindNativeChrome,
  haptic,
  registerServiceWorker,
  unlockAudio,
} from './game/feel'
import { speakEnglish } from './game/tts'
import type { CellPos, MatchGroup } from './game/types'

bindNativeChrome()
registerServiceWorker()

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const engine = new Match3Engine({
  wordIds: FOOD_WORDS.map((w) => w.id),
  cols: 6,
  rows: 6,
  moves: 24,
  goalPerWord: 2,
})

let busy = false
let toastTimer = 0

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

type DragState = {
  pointerId: number
  from: CellPos
  startX: number
  startY: number
  dx: number
  dy: number
  axis: 'x' | 'y' | null
}

let drag: DragState | null = null

app.innerHTML = `
  <div class="shell">
    <div class="playfield">
      <header class="hud">
        <div class="badge score-badge" aria-label="分数">
          <span class="badge-label">分数</span>
          <span class="badge-value" id="score">0</span>
        </div>
        <h1 class="brand">词图三消</h1>
        <div class="badge moves-badge" aria-label="剩余步数">
          <span class="badge-label">步数</span>
          <span class="badge-value" id="moves">24</span>
        </div>
      </header>

      <section class="goals-bar" aria-label="收集目标">
        <div class="goal-grid" id="goals"></div>
      </section>

      <div class="board-wrap">
        <div class="board" id="board" aria-label="三消棋盘"></div>
        <div class="burst-layer" id="bursts" aria-hidden="true"></div>
        <div class="toast" id="toast" aria-live="polite">
          <span class="toast-en" id="toast-en"></span>
          <span class="toast-zh" id="toast-zh"></span>
        </div>
        <div class="overlay" id="overlay">
          <div class="overlay-card">
            <h2 id="overlay-title"></h2>
            <p id="overlay-body"></p>
            <button class="btn" type="button" id="overlay-btn">再来一局</button>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <button class="btn ghost-btn" type="button" id="restart">重新开始</button>
      </div>
    </div>
  </div>
`

const boardEl = app.querySelector<HTMLDivElement>('#board')!
const boardWrapEl = app.querySelector<HTMLDivElement>('.board-wrap')!
const playfieldEl = app.querySelector<HTMLDivElement>('.playfield')!
const goalsEl = app.querySelector<HTMLDivElement>('#goals')!
const scoreEl = app.querySelector<HTMLSpanElement>('#score')!
const movesEl = app.querySelector<HTMLSpanElement>('#moves')!
const toastEl = app.querySelector<HTMLDivElement>('#toast')!
const toastEn = app.querySelector<HTMLSpanElement>('#toast-en')!
const toastZh = app.querySelector<HTMLSpanElement>('#toast-zh')!
const overlayEl = app.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = app.querySelector<HTMLHeadingElement>('#overlay-title')!
const overlayBody = app.querySelector<HTMLParagraphElement>('#overlay-body')!
const burstsEl = app.querySelector<HTMLDivElement>('#bursts')!

boardEl.style.gridTemplateColumns = `repeat(${engine.cols}, minmax(0, 1fr))`
boardEl.style.gridTemplateRows = `repeat(${engine.rows}, minmax(0, 1fr))`

function layoutBoard(): void {
  const hud = playfieldEl.querySelector('.hud') as HTMLElement
  const goals = playfieldEl.querySelector('.goals-bar') as HTMLElement
  const footer = playfieldEl.querySelector('.footer-bar') as HTMLElement
  const gap = parseFloat(getComputedStyle(playfieldEl).gap) || 10
  const availH =
    playfieldEl.clientHeight -
    hud.clientHeight -
    goals.clientHeight -
    footer.clientHeight -
    gap * 3
  const side = Math.max(260, Math.floor(Math.min(playfieldEl.clientWidth, availH)))
  boardWrapEl.style.width = `${side}px`
  boardWrapEl.style.height = `${side}px`
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

function showToast(wordId: string): void {
  const word = wordById(wordId)
  if (!word) return
  toastEn.textContent = word.english
  toastZh.textContent = word.chinese
  toastEl.classList.remove('show')
  void toastEl.offsetWidth
  toastEl.classList.add('show')
  speakEnglish(word.english)
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1200)
}

function spawnBursts(matches: MatchGroup[]): void {
  const { size, gap, pad } = boardMetrics()
  const boardRect = boardEl.getBoundingClientRect()
  const wrapRect = burstsEl.getBoundingClientRect()

  for (const group of matches) {
    for (const c of group.cells) {
      const x =
        boardRect.left - wrapRect.left + pad + c.col * (size + gap) + size / 2
      const y =
        boardRect.top - wrapRect.top + pad + c.row * (size + gap) + size / 2
      const burst = document.createElement('span')
      burst.className = 'burst'
      burst.style.left = `${x}px`
      burst.style.top = `${y}px`
      burstsEl.appendChild(burst)
      window.setTimeout(() => burst.remove(), 520)
    }
  }
}

function renderGoals(prevDone?: Set<string>): void {
  const snap = engine.snapshot()
  goalsEl.innerHTML = snap.goals
    .map((g) => {
      const word = wordById(g.wordId)!
      const done = g.current >= g.target
      const left = Math.max(0, g.target - g.current)
      const justDone = done && prevDone && !prevDone.has(g.wordId)
      return `
        <div class="goal ${done ? 'done' : ''} ${justDone ? 'pop' : ''}" title="${word.english}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
          <span class="goal-count">${done ? '✓' : left}</span>
        </div>
      `
    })
    .join('')
}

function updateHud(animate = false): void {
  const snap = engine.snapshot()
  const prevScore = scoreEl.textContent
  const prevMoves = movesEl.textContent
  scoreEl.textContent = String(snap.score)
  movesEl.textContent = String(snap.movesLeft)
  if (animate && prevScore !== scoreEl.textContent) pulseStat(scoreEl)
  if (animate && prevMoves !== movesEl.textContent) pulseStat(movesEl)
}

type RenderOptions = {
  clearing?: Set<number>
  fallRows?: Map<number, number>
  spawnUids?: Map<number, number>
  enter?: boolean
}

function renderBoard(opts: RenderOptions = {}): void {
  const snap = engine.snapshot()
  updateHud(false)
  renderGoals()
  layoutBoard()

  boardEl.innerHTML = ''
  for (let row = 0; row < snap.rows; row++) {
    for (let col = 0; col < snap.cols; col++) {
      const i = row * snap.cols + col
      const tile = snap.cells[i]
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'tile'
      btn.dataset.row = String(row)
      btn.dataset.col = String(col)

      if (!tile) {
        btn.disabled = true
        btn.classList.add('empty')
        boardEl.appendChild(btn)
        continue
      }

      btn.dataset.uid = String(tile.uid)
      if (tile.kind === 'word') btn.classList.add('word')
      else btn.classList.add('image')
      if (opts.clearing?.has(i)) btn.classList.add('clearing')
      const fall = opts.fallRows?.get(tile.uid)
      if (fall != null && fall > 0) {
        btn.classList.add('falling')
        btn.style.setProperty('--fall', String(fall))
      }
      const drop = opts.spawnUids?.get(tile.uid)
      if (drop != null) {
        btn.classList.add('spawning')
        btn.style.setProperty('--drop', String(drop))
      } else if (opts.enter && fall == null) {
        btn.classList.add('enter')
        btn.style.setProperty('--stagger', String((row + col) % 8))
      }

      const word = wordById(tile.wordId)
      if (tile.kind === 'image' && word) {
        const img = document.createElement('img')
        img.src = assetUrl(word.image)
        img.alt = word.english
        img.draggable = false
        btn.appendChild(img)
      } else if (word) {
        const label = document.createElement('span')
        label.className = 'tile-word-label'
        label.textContent = word.english
        btn.appendChild(label)
      }

      boardEl.appendChild(btn)
    }
  }

  if (snap.won) {
    overlayTitle.textContent = '过关！'
    overlayBody.textContent = `太棒了，食物词都收集齐了。得分 ${snap.score}`
    overlayEl.classList.add('show')
  } else if (snap.lost) {
    overlayTitle.textContent = '步数用完'
    overlayBody.textContent = '再试一局，留意图和英文是同一词就能消。'
    overlayEl.classList.add('show')
  } else {
    overlayEl.classList.remove('show')
  }
}

function runTranslate(
  el: HTMLElement,
  from: string,
  to: string,
  ms: number,
): Promise<void> {
  el.classList.add('swapping')
  const anim = el.animate(
    [
      { transform: from },
      { transform: to },
    ],
    { duration: ms, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  )
  return anim.finished.then(() => undefined)
}

async function animateSwapReject(a: CellPos, b: CellPos): Promise<void> {
  const aEl = tileEl(a.row, a.col)
  const bEl = tileEl(b.row, b.col)
  if (!aEl || !bEl) return

  const step = stepSize()
  const dx = (b.col - a.col) * step
  const dy = (b.row - a.row) * step

  await Promise.all([
    runTranslate(aEl, `translate(${dx}px, ${dy}px) scale(1.08)`, 'translate(0,0) scale(1)', 160),
    runTranslate(bEl, `translate(${-dx}px, ${-dy}px) scale(1.08)`, 'translate(0,0) scale(1)', 160),
  ])
  aEl.getAnimations().forEach((x) => x.cancel())
  bEl.getAnimations().forEach((x) => x.cancel())
  aEl.classList.remove('swapping')
  bEl.classList.remove('swapping')
  aEl.style.transform = ''
  bEl.style.transform = ''
  aEl.classList.add('shake')
  bEl.classList.add('shake')
  await wait(360)
}

async function resolveWithAnimation(firstMatches: MatchGroup[]): Promise<void> {
  let matches = firstMatches
  const seenToast = new Set<string>()

  while (matches.length > 0) {
    const clearing = new Set<number>()
    for (const g of matches) {
      for (const c of g.cells) clearing.add(c.row * engine.cols + c.col)
    }

    const prevDone = new Set(
      engine.goals.filter((g) => g.current >= g.target).map((g) => g.wordId),
    )

    renderBoard({ clearing })
    boardWrapEl.classList.remove('punch')
    void boardWrapEl.offsetWidth
    boardWrapEl.classList.add('punch')
    haptic([8, 30, 12])
    await wait(32)
    spawnBursts(matches)
    await wait(420)

    const cleared = engine.clearMatches(matches)
    for (const wordId of cleared) {
      if (!seenToast.has(wordId)) {
        seenToast.add(wordId)
        showToast(wordId)
      }
    }
    updateHud(true)
    renderGoals(prevDone)

    const settle = engine.settle()
    const fallRows = new Map(
      settle.falls.map((f) => [f.uid, f.toRow - f.fromRow] as const),
    )
    const spawnUids = new Map(settle.spawns.map((s) => [s.uid, s.dropRows]))
    renderBoard({ fallRows, spawnUids })
    updateHud(true)
    await wait(450)

    matches = engine.findMatches()
  }

  engine.checkEnd()
  renderBoard()
}

function neighborToward(from: CellPos, dx: number, dy: number): CellPos | null {
  const step = stepSize()
  const threshold = step * 0.28
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

function clearDragTransforms(): void {
  boardEl.querySelectorAll('.tile.dragging, .tile.drag-pair').forEach((node) => {
    const el = node as HTMLElement
    el.classList.remove('dragging', 'drag-pair')
    el.style.transform = ''
  })
}

function applyDragVisual(state: DragState): void {
  const aEl = tileEl(state.from.row, state.from.col)
  if (!aEl) return

  let dx = state.dx
  let dy = state.dy
  const step = stepSize()

  // Lock to one axis after a short move for cleaner swipe feel.
  if (!state.axis) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      state.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
    }
  }
  if (state.axis === 'x') dy = 0
  if (state.axis === 'y') dx = 0

  dx = Math.max(-step, Math.min(step, dx))
  dy = Math.max(-step, Math.min(step, dy))

  aEl.classList.add('dragging')
  aEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`

  // Preview the neighbor sliding the opposite way.
  boardEl.querySelectorAll('.tile.drag-pair').forEach((node) => {
    const el = node as HTMLElement
    if (el !== aEl) {
      el.classList.remove('drag-pair')
      el.style.transform = ''
    }
  })

  const to = neighborToward(state.from, dx, dy)
  if (!to) return
  const bEl = tileEl(to.row, to.col)
  if (!bEl) return
  bEl.classList.add('drag-pair')
  bEl.style.transform = `translate(${-dx}px, ${-dy}px)`
}

async function finishSwipeTo(
  from: CellPos,
  to: CellPos,
  currentDx: number,
  currentDy: number,
): Promise<void> {
  const aEl = tileEl(from.row, from.col)
  const bEl = tileEl(to.row, to.col)
  if (!aEl || !bEl) return

  const step = stepSize()
  const dx = (to.col - from.col) * step
  const dy = (to.row - from.row) * step

  // Continue from the finger pose to a full swap pose.
  let fromDx = currentDx
  let fromDy = currentDy
  if (to.col !== from.col) fromDy = 0
  if (to.row !== from.row) fromDx = 0
  fromDx = Math.max(-step, Math.min(step, fromDx))
  fromDy = Math.max(-step, Math.min(step, fromDy))

  aEl.classList.add('swapping')
  bEl.classList.add('swapping')
  await Promise.all([
    runTranslate(
      aEl,
      `translate(${fromDx}px, ${fromDy}px) scale(1.06)`,
      `translate(${dx}px, ${dy}px) scale(1.08)`,
      140,
    ),
    runTranslate(
      bEl,
      `translate(${-fromDx}px, ${-fromDy}px)`,
      `translate(${-dx}px, ${-dy}px) scale(1.08)`,
      140,
    ),
  ])
}

async function trySwipeSwap(
  from: CellPos,
  to: CellPos,
  currentDx: number,
  currentDy: number,
): Promise<void> {
  busy = true

  await finishSwipeTo(from, to, currentDx, currentDy)
  const result = engine.commitSwap(from, to)

  if (!result.ok) {
    haptic([10, 40, 10])
    await animateSwapReject(from, to)
    renderBoard()
    busy = false
    return
  }

  updateHud(true)
  await resolveWithAnimation(result.matches)
  busy = false
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

  drag = {
    pointerId: e.pointerId,
    from,
    startX: e.clientX,
    startY: e.clientY,
    dx: 0,
    dy: 0,
    axis: null,
  }

  boardEl.setPointerCapture(e.pointerId)
  boardEl.classList.add('is-dragging')
  const aEl = tileEl(from.row, from.col)
  aEl?.classList.add('dragging')
  e.preventDefault()
}

function onPointerMove(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return
  drag.dx = e.clientX - drag.startX
  drag.dy = e.clientY - drag.startY
  applyDragVisual(drag)
  e.preventDefault()
}

async function onPointerUp(e: PointerEvent): Promise<void> {
  if (!drag || e.pointerId !== drag.pointerId) return

  const state = drag
  drag = null
  boardEl.classList.remove('is-dragging')
  try {
    boardEl.releasePointerCapture(e.pointerId)
  } catch {
    // ignore if already released
  }

  const to = neighborToward(state.from, state.dx, state.dy)

  if (!to || !engine.areAdjacent(state.from, to)) {
    clearDragTransforms()
    haptic(8)
    const aEl = tileEl(state.from.row, state.from.col)
    if (aEl) {
      aEl.classList.add('shake')
      await wait(220)
      aEl.classList.remove('shake')
    }
    return
  }

  haptic(10)
  await trySwipeSwap(state.from, to, state.dx, state.dy)
}

function onPointerCancel(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return
  drag = null
  boardEl.classList.remove('is-dragging')
  clearDragTransforms()
}

boardEl.addEventListener('pointerdown', onPointerDown)
boardEl.addEventListener('pointermove', onPointerMove)
boardEl.addEventListener('pointerup', onPointerUp)
boardEl.addEventListener('pointercancel', onPointerCancel)

function restart(): void {
  drag = null
  busy = false
  boardEl.classList.remove('is-dragging')
  engine.reset()
  overlayEl.classList.remove('show')
  renderBoard({ enter: true })
}

app.querySelector('#restart')?.addEventListener('click', restart)
app.querySelector('#overlay-btn')?.addEventListener('click', restart)
window.addEventListener('resize', layoutBoard)

let audioReady = false
const armAudio = () => {
  if (audioReady) return
  audioReady = true
  unlockAudio()
}
window.addEventListener('pointerdown', armAudio, { once: true })

renderBoard({ enter: true })
layoutBoard()

const boot = document.querySelector('#boot')
requestAnimationFrame(() => {
  requestAnimationFrame(() => boot?.classList.add('hide'))
})
