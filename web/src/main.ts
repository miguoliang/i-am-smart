import './style.css'
import { FOOD_WORDS, assetUrl, wordById } from './data/words'
import { Match3Engine } from './game/engine'
import { speakEnglish } from './game/tts'
import type { CellPos, MatchGroup } from './game/types'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const engine = new Match3Engine({
  wordIds: FOOD_WORDS.map((w) => w.id),
  cols: 8,
  rows: 8,
  moves: 28,
  goalPerWord: 2,
})

let selected: CellPos | null = null
let busy = false
let toastTimer = 0

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <h1 class="brand">词图三消</h1>
      <p class="tagline">同词条可互消：图片和英文是一家。</p>
    </header>

    <div class="hud">
      <div class="stat">
        <span class="stat-label">分数</span>
        <span class="stat-value" id="score">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">步数</span>
        <span class="stat-value" id="moves">28</span>
      </div>
    </div>

    <section class="panel goals">
      <h2 class="goals-title">食物关 · 收集目标</h2>
      <div class="goal-grid" id="goals"></div>
      <p class="hint">先点一格再点相邻格交换；连成 3 个同词会放大消失、掉落补位。</p>
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

    <div class="actions">
      <button class="btn secondary" type="button" id="restart">重新开始</button>
    </div>
  </div>
`

const boardEl = app.querySelector<HTMLDivElement>('#board')!
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

function cellSize(): number {
  const styles = getComputedStyle(boardEl)
  const gap = parseFloat(styles.gap) || 6
  return (boardEl.clientWidth - gap * (engine.cols - 1)) / engine.cols
}

function tileEl(row: number, col: number): HTMLElement | null {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`)
}

function pulseStat(el: HTMLElement): void {
  el.classList.remove('pulse')
  // restart animation
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
  const size = cellSize()
  const gap = parseFloat(getComputedStyle(boardEl).gap) || 6
  const boardRect = boardEl.getBoundingClientRect()
  const wrapRect = burstsEl.getBoundingClientRect()

  for (const group of matches) {
    for (const c of group.cells) {
      const x = boardRect.left - wrapRect.left + c.col * (size + gap) + size / 2
      const y = boardRect.top - wrapRect.top + c.row * (size + gap) + size / 2
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
      const justDone = done && prevDone && !prevDone.has(g.wordId)
      return `
        <div class="goal ${done ? 'done' : ''} ${justDone ? 'pop' : ''}" title="${word.english}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
          <span class="goal-count">${g.current}/${g.target}</span>
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
      if (selected && selected.row === row && selected.col === col) {
        btn.classList.add('selected')
      }
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

      btn.addEventListener('click', () => onTileClick(row, col))
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

function clearSelectionStyles(): void {
  boardEl.querySelectorAll('.tile.selected').forEach((el) => {
    el.classList.remove('selected')
    ;(el as HTMLElement).style.transform = ''
    ;(el as HTMLElement).style.animation = 'none'
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
    { duration: ms, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  )
  return anim.finished.then(() => undefined)
}

async function animateSwap(a: CellPos, b: CellPos): Promise<void> {
  clearSelectionStyles()
  const aEl = tileEl(a.row, a.col)
  const bEl = tileEl(b.row, b.col)
  if (!aEl || !bEl) return

  const size = cellSize()
  const gap = parseFloat(getComputedStyle(boardEl).gap) || 6
  const step = size + gap
  const dx = (b.col - a.col) * step
  const dy = (b.row - a.row) * step

  await Promise.all([
    runTranslate(aEl, 'translate(0,0) scale(1)', `translate(${dx}px, ${dy}px) scale(1.08)`, 220),
    runTranslate(bEl, 'translate(0,0) scale(1)', `translate(${-dx}px, ${-dy}px) scale(1.08)`, 220),
  ])
}

async function animateSwapReject(a: CellPos, b: CellPos): Promise<void> {
  const aEl = tileEl(a.row, a.col)
  const bEl = tileEl(b.row, b.col)
  if (!aEl || !bEl) return

  const size = cellSize()
  const gap = parseFloat(getComputedStyle(boardEl).gap) || 6
  const step = size + gap
  const dx = (b.col - a.col) * step
  const dy = (b.row - a.row) * step

  // Return from speculative swap pose, then shake.
  await Promise.all([
    runTranslate(aEl, `translate(${dx}px, ${dy}px) scale(1.08)`, 'translate(0,0) scale(1)', 180),
    runTranslate(bEl, `translate(${-dx}px, ${-dy}px) scale(1.08)`, 'translate(0,0) scale(1)', 180),
  ])
  aEl.getAnimations().forEach((x) => x.cancel())
  bEl.getAnimations().forEach((x) => x.cancel())
  aEl.classList.remove('swapping')
  bEl.classList.remove('swapping')
  aEl.style.transform = ''
  bEl.style.transform = ''
  aEl.classList.add('shake')
  bEl.classList.add('shake')
  await wait(380)
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
    // Next frame so CSS clear animation definitely starts on mounted nodes.
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

async function onTileClick(row: number, col: number): Promise<void> {
  if (busy || engine.won || engine.lost) return

  if (!selected) {
    selected = { row, col }
    renderBoard()
    return
  }

  if (selected.row === row && selected.col === col) {
    selected = null
    renderBoard()
    return
  }

  const from = selected
  const to = { row, col }

  if (!engine.areAdjacent(from, to)) {
    selected = to
    renderBoard()
    return
  }

  busy = true
  selected = null
  clearSelectionStyles()

  // Visual swap first on current board, then commitSwap mutates state.
  await animateSwap(from, to)
  const result = engine.commitSwap(from, to)

  if (!result.ok) {
    await animateSwapReject(from, to)
    renderBoard()
    busy = false
    return
  }

  updateHud(true)
  await resolveWithAnimation(result.matches)
  busy = false
}

function restart(): void {
  selected = null
  busy = false
  engine.reset()
  overlayEl.classList.remove('show')
  renderBoard({ enter: true })
}

app.querySelector('#restart')?.addEventListener('click', restart)
app.querySelector('#overlay-btn')?.addEventListener('click', restart)

renderBoard({ enter: true })
