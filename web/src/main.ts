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
import type { CellPos, GameSnapshot, MatchGroup, Tile } from './game/types'

bindNativeChrome()
registerServiceWorker()

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const engine = new Match3Engine({
  wordIds: FOOD_WORDS.map((w) => w.id),
  cols: 6,
  rows: 8,
  moves: 28,
  maxGoals: 4,
  goalPerWord: 3,
})

let busy = false
let toastTimer = 0

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

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
        <div class="hud-stat" aria-label="分数" id="score-badge">
          <span class="hud-label">分数</span>
          <span class="hud-value" id="score">0</span>
        </div>
        <section class="goals-bar" aria-label="收集目标">
          <div class="goal-grid" id="goals"></div>
        </section>
        <div class="hud-stat" aria-label="剩余步数">
          <span class="hud-label">步数</span>
          <span class="hud-value" id="moves">28</span>
        </div>
      </header>

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
  // Fill width; height follows cols×rows so tiles stay roughly square.
  const maxWidth = Math.max(260, Math.floor(playfieldEl.clientWidth))
  const hud = playfieldEl.querySelector('.hud') as HTMLElement | null
  const gap = parseFloat(getComputedStyle(playfieldEl).gap) || 4
  const availH = Math.max(
    280,
    playfieldEl.clientHeight - (hud?.offsetHeight ?? 0) - gap,
  )

  let width = maxWidth
  let height = Math.floor((width * engine.rows) / engine.cols)

  if (height > availH) {
    height = Math.floor(availH)
    width = Math.floor((height * engine.cols) / engine.rows)
  }

  boardWrapEl.style.width = `${width}px`
  boardWrapEl.style.height = `${height}px`
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
  // Avoid forced reflow mid-cascade; restart with a fresh class tick on rAF.
  requestAnimationFrame(() => {
    toastEl.classList.remove('show')
    requestAnimationFrame(() => toastEl.classList.add('show'))
  })
  window.setTimeout(() => speakEnglish(word.english), 0)
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1200)
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

function paintTile(btn: HTMLButtonElement, tile: Tile): void {
  const same =
    btn.dataset.uid === String(tile.uid) &&
    btn.dataset.kind === tile.kind &&
    btn.dataset.wordId === tile.wordId
  if (same) return

  btn.dataset.uid = String(tile.uid)
  btn.dataset.kind = tile.kind
  btn.dataset.wordId = tile.wordId

  const word = wordById(tile.wordId)
  if (tile.kind === 'image' && word) {
    let img = btn.querySelector('img')
    if (!img) {
      btn.replaceChildren()
      img = document.createElement('img')
      img.draggable = false
      img.decoding = 'async'
      btn.appendChild(img)
    }
    const src = assetUrl(word.image)
    if (img.getAttribute('src') !== src) img.src = src
    img.alt = word.english
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

function resetTileMotion(btn: HTMLButtonElement): void {
  btn.getAnimations().forEach((anim) => anim.cancel())
  btn.style.transform = ''
  btn.style.opacity = ''
  btn.style.removeProperty('--fall')
  btn.style.removeProperty('--drop')
  btn.style.removeProperty('--stagger')
  btn.classList.remove('clearing', 'falling', 'spawning', 'enter', 'shake', 'swapping')
}

function syncOverlay(snap: GameSnapshot): void {
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

      const fall = tile ? opts.fallRows?.get(tile.uid) : undefined
      const drop = tile ? opts.spawnUids?.get(tile.uid) : undefined
      const wantsFall = fall != null && fall > 0
      const wantsSpawn = drop != null
      const wantsEnter = Boolean(opts.enter && !wantsFall && !wantsSpawn)
      const wantsClear = Boolean(opts.clearing?.has(i))
      const wantsMotion = wantsClear || wantsFall || wantsSpawn || wantsEnter
      const sameUid =
        !!tile &&
        btn.dataset.uid === String(tile.uid) &&
        btn.dataset.kind === tile.kind &&
        btn.dataset.wordId === tile.wordId
      const busyMotion = btn.classList.contains('swapping') ||
        btn.classList.contains('clearing') ||
        btn.classList.contains('falling') ||
        btn.classList.contains('spawning') ||
        btn.classList.contains('shake')

      if (!tile) {
        if (!btn.classList.contains('empty') || btn.dataset.uid) {
          resetTileMotion(btn)
          btn.disabled = true
          btn.classList.remove('word', 'image')
          btn.classList.add('empty')
          clearTilePaint(btn)
        }
        continue
      }

      if (!sameUid || wantsMotion || busyMotion) {
        resetTileMotion(btn)
      }

      btn.disabled = false
      btn.classList.remove('empty')
      paintTile(btn, tile)
      btn.classList.toggle('word', tile.kind === 'word')
      btn.classList.toggle('image', tile.kind === 'image')

      if (wantsClear) {
        btn.classList.add('clearing')
      } else if (wantsFall) {
        btn.style.setProperty('--fall', String(fall))
        btn.classList.add('falling')
      } else if (wantsSpawn) {
        btn.style.setProperty('--drop', String(drop))
        btn.classList.add('spawning')
      } else if (wantsEnter) {
        btn.style.setProperty('--stagger', String((row + col) % 8))
        btn.classList.add('enter')
      }
    }
  }

  syncOverlay(snap)
}

/** Add clear animation only on matched cells — leave the rest untouched. */
function applyClearing(clearing: Set<number>): void {
  const slots = ensureBoardSlots()
  for (const i of clearing) {
    const btn = slots[i]
    if (!btn || btn.classList.contains('empty')) continue
    btn.getAnimations().forEach((anim) => anim.cancel())
    btn.style.transform = ''
    btn.style.opacity = ''
    btn.classList.remove('swapping', 'falling', 'spawning', 'shake', 'enter', 'clearing')
    btn.classList.add('clearing')
  }
}

function waitForClearAnim(fallbackMs: number): Promise<void> {
  const clearingEl = boardEl.querySelector('.tile.clearing')
  if (!clearingEl) return wait(fallbackMs)
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timer = window.setTimeout(finish, fallbackMs)
    clearingEl.addEventListener(
      'animationend',
      (event) => {
        if (event.target !== clearingEl) return
        window.clearTimeout(timer)
        finish()
      },
      { once: true },
    )
  })
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
    { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
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
    runTranslate(aEl, `translate(${dx}px, ${dy}px)`, 'translate(0,0)', 220),
    runTranslate(bEl, `translate(${-dx}px, ${-dy}px)`, 'translate(0,0)', 220),
  ])
  aEl.getAnimations().forEach((x) => x.cancel())
  bEl.getAnimations().forEach((x) => x.cancel())
  aEl.classList.remove('swapping')
  bEl.classList.remove('swapping')
  aEl.style.transform = ''
  bEl.style.transform = ''
  aEl.classList.add('shake')
  bEl.classList.add('shake')
  await wait(460)
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

    applyClearing(clearing)
    haptic([8, 30, 12])
    spawnBursts(matches)
    await waitForClearAnim(520)

    const cleared = engine.clearMatches(matches)
    const settle = engine.settle()
    const fallRows = new Map(
      settle.falls.map((f) => [f.uid, f.toRow - f.fromRow] as const),
    )
    const spawnUids = new Map(settle.spawns.map((s) => [s.uid, s.dropRows]))

    // Paint falls first, then cheap HUD/goal text updates (in-place, no image reload).
    renderBoard({ fallRows, spawnUids })
    updateHud(false)
    renderGoals(prevDone)

    for (const wordId of cleared) {
      if (!seenToast.has(wordId)) {
        seenToast.add(wordId)
        showToast(wordId)
      }
    }

    await wait(560)
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

  const step = stepSize()
  const dx = (to.col - from.col) * step
  const dy = (to.row - from.row) * step

  aEl.classList.add('swapping')
  bEl.classList.add('swapping')
  await Promise.all([
    runTranslate(aEl, 'translate(0,0)', `translate(${dx}px, ${dy}px)`, 210),
    runTranslate(bEl, 'translate(0,0)', `translate(${-dx}px, ${-dy}px)`, 210),
  ])
}

async function trySwipeSwap(from: CellPos, to: CellPos): Promise<void> {
  busy = true

  await animateSwapTo(from, to)
  const result = engine.commitSwap(from, to)

  if (!result.ok) {
    haptic([10, 40, 10])
    await animateSwapReject(from, to)
    renderBoard()
    updateHud(false)
    busy = false
    return
  }

  // Bake the swapped board into the DOM before clear starts, so clear
  // only animates matched cells instead of rebuilding the whole grid.
  renderBoard()
  updateHud(true)
  await resolveWithAnimation(result.matches)
  busy = false
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
}

function onPointerCancel(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return
  drag = null
  endPointerGesture(e.pointerId)
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
  renderGoals()
}

app.querySelector('#overlay-btn')?.addEventListener('click', restart)
// Long-press score badge to restart without a permanent footer button.
const scoreBadgeEl = app.querySelector('#score-badge')
let restartTimer = 0
scoreBadgeEl?.addEventListener('pointerdown', () => {
  restartTimer = window.setTimeout(() => {
    haptic(16)
    restart()
  }, 650)
})
scoreBadgeEl?.addEventListener('pointerup', () => window.clearTimeout(restartTimer))
scoreBadgeEl?.addEventListener('pointerleave', () => window.clearTimeout(restartTimer))
scoreBadgeEl?.addEventListener('pointercancel', () => window.clearTimeout(restartTimer))
window.addEventListener('resize', layoutBoard)

let audioReady = false
const armAudio = () => {
  if (audioReady) return
  audioReady = true
  unlockAudio()
}
window.addEventListener('pointerdown', armAudio, { once: true })

renderBoard({ enter: true })
renderGoals()
layoutBoard()

const boot = document.querySelector('#boot')
requestAnimationFrame(() => {
  requestAnimationFrame(() => boot?.classList.add('hide'))
})
