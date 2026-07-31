import './style.css'
import { FOOD_WORDS, assetUrl, wordById } from './data/words'
import { Match3Engine } from './game/engine'
import { speakEnglish } from './game/tts'
import type { CellPos } from './game/types'

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
      <p class="hint">点两格相邻交换。三个相同单词（图或英文）连成一线即可消除。</p>
    </section>

    <div class="board-wrap">
      <div class="board" id="board" aria-label="三消棋盘"></div>
      <div class="toast" id="toast" aria-live="polite">
        <span class="toast-en" id="toast-en"></span>
        <span class="toast-zh" id="toast-zh"></span>
      </div>
      <div class="overlay" id="overlay">
        <div>
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

boardEl.style.gridTemplateColumns = `repeat(${engine.cols}, minmax(0, 1fr))`
boardEl.style.gridTemplateRows = `repeat(${engine.rows}, minmax(0, 1fr))`

function showToast(wordId: string): void {
  const word = wordById(wordId)
  if (!word) return
  toastEn.textContent = word.english
  toastZh.textContent = word.chinese
  toastEl.classList.add('show')
  speakEnglish(word.english)
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1100)
}

function renderGoals(): void {
  const snap = engine.snapshot()
  goalsEl.innerHTML = snap.goals
    .map((g) => {
      const word = wordById(g.wordId)!
      const done = g.current >= g.target
      return `
        <div class="goal ${done ? 'done' : ''}" title="${word.english}">
          <img src="${assetUrl(word.image)}" alt="${word.english}" />
          <span class="goal-count">${g.current}/${g.target}</span>
        </div>
      `
    })
    .join('')
}

function renderBoard(clearing: Set<number> = new Set()): void {
  const snap = engine.snapshot()
  scoreEl.textContent = String(snap.score)
  movesEl.textContent = String(snap.movesLeft)
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
        boardEl.appendChild(btn)
        continue
      }

      if (tile.kind === 'word') btn.classList.add('word')
      if (selected && selected.row === row && selected.col === col) {
        btn.classList.add('selected')
      }
      if (clearing.has(i)) btn.classList.add('clearing')

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
  selected = null

  if (!engine.areAdjacent(from, to)) {
    selected = to
    renderBoard()
    return
  }

  busy = true
  const result = engine.trySwap(from, to)
  if (!result.ok) {
    // Brief shake feedback via reselect
    renderBoard()
    busy = false
    return
  }

  // Show first cleared word learning toast; cascade already applied in engine.
  const unique = [...new Set(result.clearedWords)]
  if (unique[0]) showToast(unique[0]!)
  if (unique[1]) {
    window.setTimeout(() => showToast(unique[1]!), 700)
  }

  renderBoard()
  busy = false
}

function restart(): void {
  selected = null
  busy = false
  engine.reset()
  overlayEl.classList.remove('show')
  renderBoard()
}

app.querySelector('#restart')?.addEventListener('click', restart)
app.querySelector('#overlay-btn')?.addEventListener('click', restart)

renderBoard()
