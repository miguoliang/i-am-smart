import type {
  CellPos,
  ClearPlan,
  GameSnapshot,
  HintMove,
  LevelGoal,
  MatchGroup,
  SettleResult,
  SpecialSpawn,
  Tile,
  TileKind,
  TileSpecial,
  TileSpawn,
} from './types'

let nextUid = 1

function makeTile(wordId: string, kind: TileKind, special?: TileSpecial): Tile {
  const tile: Tile = { uid: nextUid++, wordId, kind }
  if (special) tile.special = special
  return tile
}

function idx(cols: number, row: number, col: number): number {
  return row * cols + col
}

function cellKey(c: CellPos): string {
  return `${c.row},${c.col}`
}

function inBounds(rows: number, cols: number, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < rows && col < cols
}

function randomChoice<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function shuffleIds(wordIds: readonly string[]): string[] {
  const copy = [...wordIds]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function pickGoals(
  wordIds: readonly string[],
  maxGoals: number,
  preferIds: readonly string[] = [],
): string[] {
  const prefer = shuffleIds(preferIds.filter((id) => wordIds.includes(id)))
  const rest = shuffleIds(wordIds.filter((id) => !prefer.includes(id)))
  return [...prefer, ...rest].slice(0, Math.min(maxGoals, wordIds.length))
}

function longestConsecutive(sorted: number[]): number {
  if (sorted.length === 0) return 0
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]! + 1) {
      run += 1
      best = Math.max(best, run)
    } else if (sorted[i] !== sorted[i - 1]) {
      run = 1
    }
  }
  return best
}

/** Longest horizontal / vertical runs inside a match group. */
export function measureMatchShape(cells: CellPos[]): { maxH: number; maxV: number } {
  const byRow = new Map<number, number[]>()
  const byCol = new Map<number, number[]>()
  for (const c of cells) {
    const rowCols = byRow.get(c.row)
    if (rowCols) rowCols.push(c.col)
    else byRow.set(c.row, [c.col])
    const colRows = byCol.get(c.col)
    if (colRows) colRows.push(c.row)
    else byCol.set(c.col, [c.row])
  }

  let maxH = 0
  let maxV = 0
  for (const cols of byRow.values()) {
    cols.sort((a, b) => a - b)
    maxH = Math.max(maxH, longestConsecutive(cols))
  }
  for (const rows of byCol.values()) {
    rows.sort((a, b) => a - b)
    maxV = Math.max(maxV, longestConsecutive(rows))
  }
  return { maxH, maxV }
}

export function specialForMatch(cells: CellPos[]): TileSpecial | null {
  const { maxH, maxV } = measureMatchShape(cells)
  const isCorner = maxH >= 3 && maxV >= 3 && cells.length >= 5
  if (isCorner || maxH >= 5 || maxV >= 5) return 'bomb'
  if (maxH >= 4 && maxH >= maxV) return 'rocket-h'
  if (maxV >= 4) return 'rocket-v'
  return null
}

export class Match3Engine {
  readonly cols: number
  readonly rows: number
  wordIds: readonly string[]
  textWordIds: readonly string[]
  wordTileChance: number
  goalFocusIds: readonly string[]
  goalPerWord: number
  maxGoals: number
  startingMoves: number
  cells: Array<Tile | null>
  score = 0
  movesLeft: number
  goals: LevelGoal[]
  won = false
  lost = false
  /** Last successful swap endpoints — prefer these when spawning specials. */
  lastSwap: { a: CellPos; b: CellPos } | null = null

  constructor(options: {
    cols?: number
    rows?: number
    wordIds: string[]
    textWordIds?: string[]
    wordTileChance?: number
    goalFocusIds?: string[]
    moves?: number
    goalPerWord?: number
    maxGoals?: number
  }) {
    this.cols = options.cols ?? 8
    this.rows = options.rows ?? 8
    this.wordIds = options.wordIds
    this.textWordIds = options.textWordIds ?? []
    this.wordTileChance = options.wordTileChance ?? 0
    this.goalFocusIds = options.goalFocusIds ?? this.textWordIds
    this.startingMoves = options.moves ?? 28
    this.movesLeft = this.startingMoves
    this.goalPerWord = options.goalPerWord ?? 2
    this.maxGoals = options.maxGoals ?? 4
    this.goals = this.buildGoals()
    this.cells = new Array(this.cols * this.rows).fill(null)
    this.rebuildBoard()
  }

  private buildGoals(): LevelGoal[] {
    return pickGoals(this.wordIds, this.maxGoals, this.goalFocusIds).map((wordId) => ({
      wordId,
      target: this.goalPerWord,
      current: 0,
    }))
  }

  /** Reconfigure the board for the next campaign round. */
  configureRound(options: {
    wordIds?: string[]
    textWordIds?: string[]
    wordTileChance?: number
    goalFocusIds?: string[]
    moves?: number
    goalPerWord?: number
    maxGoals?: number
  }): void {
    if (options.wordIds) this.wordIds = options.wordIds
    if (options.textWordIds) this.textWordIds = options.textWordIds
    if (options.wordTileChance != null) this.wordTileChance = options.wordTileChance
    if (options.goalFocusIds) this.goalFocusIds = options.goalFocusIds
    if (options.moves != null) this.startingMoves = options.moves
    if (options.goalPerWord != null) this.goalPerWord = options.goalPerWord
    if (options.maxGoals != null) this.maxGoals = options.maxGoals
    this.reset()
  }

  snapshot(): GameSnapshot {
    return {
      cols: this.cols,
      rows: this.rows,
      cells: this.cells.map((c) => (c ? { ...c } : null)),
      score: this.score,
      movesLeft: this.movesLeft,
      goals: this.goals.map((g) => ({ ...g })),
      won: this.won,
      lost: this.lost,
    }
  }

  private pickKind(wordId: string): TileKind {
    if (
      this.wordTileChance > 0 &&
      this.textWordIds.includes(wordId) &&
      Math.random() < this.wordTileChance
    ) {
      return 'word'
    }
    return 'image'
  }

  private randomTile(avoid?: { wordId: string; kind: TileKind }[]): Tile {
    for (let attempt = 0; attempt < 40; attempt++) {
      const wordId = randomChoice(this.wordIds)
      const kind = this.pickKind(wordId)
      if (avoid?.some((a) => a.wordId === wordId && a.kind === kind)) continue
      return makeTile(wordId, kind)
    }
    const wordId = randomChoice(this.wordIds)
    return makeTile(wordId, this.pickKind(wordId))
  }

  private get(row: number, col: number): Tile | null {
    if (!inBounds(this.rows, this.cols, row, col)) return null
    return this.cells[idx(this.cols, row, col)] ?? null
  }

  private set(row: number, col: number, tile: Tile | null): void {
    this.cells[idx(this.cols, row, col)] = tile
  }

  findMatches(): MatchGroup[] {
    const groups: MatchGroup[] = []

    const collectRun = (cells: CellPos[]) => {
      if (cells.length < 3) return
      const wordId = this.get(cells[0]!.row, cells[0]!.col)?.wordId
      if (!wordId) return
      groups.push({ wordId, cells: [...cells] })
    }

    for (let row = 0; row < this.rows; row++) {
      let run: CellPos[] = []
      let runWord: string | null = null
      for (let col = 0; col < this.cols; col++) {
        const tile = this.get(row, col)
        const wid = tile?.wordId ?? null
        if (wid && wid === runWord) {
          run.push({ row, col })
        } else {
          collectRun(run)
          run = wid ? [{ row, col }] : []
          runWord = wid
        }
      }
      collectRun(run)
    }

    for (let col = 0; col < this.cols; col++) {
      let run: CellPos[] = []
      let runWord: string | null = null
      for (let row = 0; row < this.rows; row++) {
        const tile = this.get(row, col)
        const wid = tile?.wordId ?? null
        if (wid && wid === runWord) {
          run.push({ row, col })
        } else {
          collectRun(run)
          run = wid ? [{ row, col }] : []
          runWord = wid
        }
      }
      collectRun(run)
    }

    if (groups.length === 0) return []

    const byWord = new Map<string, CellPos[]>()
    for (const g of groups) {
      const list = byWord.get(g.wordId) ?? []
      for (const c of g.cells) {
        if (!list.some((x) => x.row === c.row && x.col === c.col)) list.push(c)
      }
      byWord.set(g.wordId, list)
    }

    return [...byWord.entries()].map(([wordId, cells]) => ({ wordId, cells }))
  }

  private hasAnyMatch(): boolean {
    return this.findMatches().length > 0
  }

  /** Adjacent swaps that would create at least one match. */
  findHintMoves(): HintMove[] {
    const hints: HintMove[] = []
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const a = { row, col }
        if (!this.get(row, col)) continue

        const neighbors: CellPos[] = []
        if (col + 1 < this.cols) neighbors.push({ row, col: col + 1 })
        if (row + 1 < this.rows) neighbors.push({ row: row + 1, col })

        for (const b of neighbors) {
          if (!this.get(b.row, b.col)) continue
          this.swapCells(a, b)
          const ok = this.hasAnyMatch()
          this.swapCells(a, b)
          if (ok) hints.push({ a, b })
        }
      }
    }
    return hints
  }

  hasValidMove(): boolean {
    return this.findHintMoves().length > 0
  }

  rebuildBoard(): void {
    for (let n = 0; n < 80; n++) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const left1 = this.get(row, col - 1)
          const left2 = this.get(row, col - 2)
          const up1 = this.get(row - 1, col)
          const up2 = this.get(row - 2, col)
          let tile = this.randomTile()
          for (let tries = 0; tries < 24; tries++) {
            const horConflict =
              left1 &&
              left2 &&
              left1.wordId === left2.wordId &&
              left1.wordId === tile.wordId
            const verConflict =
              up1 &&
              up2 &&
              up1.wordId === up2.wordId &&
              up1.wordId === tile.wordId
            if (!horConflict && !verConflict) break
            tile = this.randomTile()
          }
          this.set(row, col, tile)
        }
      }
      if (!this.hasAnyMatch() && this.hasValidMove()) return
    }
  }

  /**
   * Reshuffle existing tiles when the board has no useful swaps.
   * Keeps the same tile multiset when possible.
   */
  shuffleBoard(): void {
    const tiles = this.cells.filter((t): t is Tile => t != null)
    if (tiles.length !== this.cols * this.rows) {
      this.rebuildBoard()
      return
    }

    for (let attempt = 0; attempt < 80; attempt++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!]
      }
      for (let i = 0; i < tiles.length; i++) this.cells[i] = tiles[i]!
      if (!this.hasAnyMatch() && this.hasValidMove()) return
    }

    this.rebuildBoard()
  }

  areAdjacent(a: CellPos, b: CellPos): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
  }

  swapCells(a: CellPos, b: CellPos): void {
    const ta = this.get(a.row, a.col)
    const tb = this.get(b.row, b.col)
    this.set(a.row, a.col, tb)
    this.set(b.row, b.col, ta)
  }

  /** Swap if it creates a match. Consumes one move. Does not clear matches. */
  commitSwap(a: CellPos, b: CellPos): { ok: boolean; matches: MatchGroup[] } {
    if (this.won || this.lost) return { ok: false, matches: [] }
    if (!this.areAdjacent(a, b)) return { ok: false, matches: [] }
    if (!this.get(a.row, a.col) || !this.get(b.row, b.col)) {
      return { ok: false, matches: [] }
    }

    this.swapCells(a, b)
    const matches = this.findMatches()
    if (matches.length === 0) {
      this.swapCells(a, b)
      return { ok: false, matches: [] }
    }

    this.movesLeft -= 1
    this.lastSwap = { a, b }
    return { ok: true, matches }
  }

  grantMoves(amount: number): void {
    if (amount <= 0 || this.won || this.lost) return
    this.movesLeft += amount
  }

  private blastCells(origin: CellPos, special: TileSpecial): CellPos[] {
    const out: CellPos[] = []
    if (special === 'rocket-h') {
      for (let col = 0; col < this.cols; col++) out.push({ row: origin.row, col })
      return out
    }
    if (special === 'rocket-v') {
      for (let row = 0; row < this.rows; row++) out.push({ row, col: origin.col })
      return out
    }
    // bomb — 3×3
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const row = origin.row + dr
        const col = origin.col + dc
        if (inBounds(this.rows, this.cols, row, col)) out.push({ row, col })
      }
    }
    return out
  }

  private pickSpecialAnchor(cells: CellPos[]): CellPos {
    const swap = this.lastSwap
    if (swap) {
      for (const tip of [swap.b, swap.a]) {
        if (cells.some((c) => c.row === tip.row && c.col === tip.col)) return tip
      }
    }
    return cells[Math.floor(cells.length / 2)]!
  }

  /**
   * Expand match cells with special detonations (chain reactions).
   * Does not mutate the board.
   */
  planClear(matches: MatchGroup[]): ClearPlan {
    const seed: CellPos[] = []
    for (const g of matches) {
      for (const c of g.cells) seed.push(c)
    }

    const hit = new Map<string, CellPos>()
    const queue: CellPos[] = []
    const detonated = new Set<string>()

    const enqueue = (c: CellPos) => {
      const k = cellKey(c)
      if (hit.has(k)) return
      hit.set(k, c)
      queue.push(c)
    }

    for (const c of seed) enqueue(c)

    while (queue.length > 0) {
      const c = queue.shift()!
      const k = cellKey(c)
      const tile = this.get(c.row, c.col)
      if (!tile?.special || detonated.has(k)) continue
      detonated.add(k)
      for (const b of this.blastCells(c, tile.special)) enqueue(b)
    }

    const morph: SpecialSpawn[] = []
    const morphKeys = new Set<string>()

    for (const group of matches) {
      const special = specialForMatch(group.cells)
      if (!special) continue
      const anchor = this.pickSpecialAnchor(group.cells)
      const tile = this.get(anchor.row, anchor.col)
      if (!tile || tile.wordId !== group.wordId) continue
      // Don't morph a cell that is about to detonate as an existing special —
      // the blast already consumes it.
      if (tile.special && detonated.has(cellKey(anchor))) continue
      const key = cellKey(anchor)
      if (morphKeys.has(key)) continue
      morphKeys.add(key)
      morph.push({
        row: anchor.row,
        col: anchor.col,
        wordId: tile.wordId,
        kind: tile.kind,
        special,
        uid: tile.uid,
      })
    }

    const fade: CellPos[] = []
    for (const c of hit.values()) {
      if (morphKeys.has(cellKey(c))) continue
      if (!this.get(c.row, c.col)) continue
      fade.push(c)
    }

    const clearedWordIds: string[] = []
    const seen = new Set<string>()
    for (const c of hit.values()) {
      const tile = this.get(c.row, c.col)
      if (!tile || seen.has(tile.wordId)) continue
      // Morphing into a special still counts as collecting that match.
      seen.add(tile.wordId)
      clearedWordIds.push(tile.wordId)
    }

    return { fade, morph, clearedWordIds }
  }

  /** Apply a previously computed clear plan. */
  applyClear(plan: ClearPlan): string[] {
    for (const c of plan.fade) this.set(c.row, c.col, null)

    for (const m of plan.morph) {
      this.set(m.row, m.col, {
        uid: m.uid,
        wordId: m.wordId,
        kind: m.kind,
        special: m.special,
      })
    }

    for (const wordId of plan.clearedWordIds) this.bumpGoal(wordId, 1)
    this.lastSwap = null
    return plan.clearedWordIds
  }

  /** Clear current matches (and chained specials) and update collection goals. */
  clearMatches(matches: MatchGroup[]): string[] {
    const plan = this.planClear(matches)
    return this.applyClear(plan)
  }

  /** Apply gravity and spawn new tiles. */
  settle(): SettleResult {
    const falls: SettleResult['falls'] = []

    for (let col = 0; col < this.cols; col++) {
      let write = this.rows - 1
      for (let row = this.rows - 1; row >= 0; row--) {
        const tile = this.get(row, col)
        if (tile) {
          if (write !== row) {
            falls.push({ uid: tile.uid, col, fromRow: row, toRow: write })
            this.set(write, col, tile)
            this.set(row, col, null)
          }
          write -= 1
        }
      }
    }

    const spawns: TileSpawn[] = []
    for (let col = 0; col < this.cols; col++) {
      const emptyRows: number[] = []
      for (let row = 0; row < this.rows; row++) {
        if (!this.get(row, col)) emptyRows.push(row)
      }
      emptyRows.forEach((row, i) => {
        const tile = this.randomTile()
        this.set(row, col, tile)
        spawns.push({
          uid: tile.uid,
          row,
          col,
          dropRows: emptyRows.length - i,
        })
      })
    }

    return { falls, spawns }
  }

  checkEnd(): void {
    if (this.goals.every((g) => g.current >= g.target)) {
      this.won = true
      return
    }
    if (this.movesLeft <= 0) this.lost = true
  }

  private bumpGoal(wordId: string, amount: number): void {
    const goal = this.goals.find((g) => g.wordId === wordId)
    if (!goal) return
    goal.current = Math.min(goal.target, goal.current + amount)
  }

  reset(): void {
    this.score = 0
    this.movesLeft = this.startingMoves
    this.won = false
    this.lost = false
    this.lastSwap = null
    this.goals = this.buildGoals()
    this.rebuildBoard()
  }
}
