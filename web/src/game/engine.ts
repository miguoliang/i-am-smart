import type {
  CellPos,
  GameSnapshot,
  LevelGoal,
  MatchGroup,
  SettleResult,
  Tile,
  TileKind,
  TileSpawn,
} from './types'

let nextUid = 1

function makeTile(wordId: string, kind: TileKind): Tile {
  return { uid: nextUid++, wordId, kind }
}

function idx(cols: number, row: number, col: number): number {
  return row * cols + col
}

function inBounds(rows: number, cols: number, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < rows && col < cols
}

function randomChoice<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function pickGoals(wordIds: readonly string[], maxGoals: number): string[] {
  const copy = [...wordIds]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy.slice(0, Math.min(maxGoals, copy.length))
}

export class Match3Engine {
  readonly cols: number
  readonly rows: number
  readonly wordIds: readonly string[]
  readonly goalPerWord: number
  readonly maxGoals: number
  readonly startingMoves: number
  cells: Array<Tile | null>
  score = 0
  movesLeft: number
  goals: LevelGoal[]
  won = false
  lost = false

  constructor(options: {
    cols?: number
    rows?: number
    wordIds: string[]
    moves?: number
    goalPerWord?: number
    maxGoals?: number
  }) {
    this.cols = options.cols ?? 8
    this.rows = options.rows ?? 8
    this.wordIds = options.wordIds
    this.startingMoves = options.moves ?? 28
    this.movesLeft = this.startingMoves
    this.goalPerWord = options.goalPerWord ?? 2
    this.maxGoals = options.maxGoals ?? 4
    this.goals = this.buildGoals()
    this.cells = new Array(this.cols * this.rows).fill(null)
    this.rebuildBoard()
  }

  private buildGoals(): LevelGoal[] {
    return pickGoals(this.wordIds, this.maxGoals).map((wordId) => ({
      wordId,
      target: this.goalPerWord,
      current: 0,
    }))
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

  private randomTile(avoid?: { wordId: string; kind: TileKind }[]): Tile {
    for (let attempt = 0; attempt < 40; attempt++) {
      const wordId = randomChoice(this.wordIds)
      const kind: TileKind = Math.random() < 0.55 ? 'image' : 'word'
      if (avoid?.some((a) => a.wordId === wordId && a.kind === kind)) continue
      return makeTile(wordId, kind)
    }
    return makeTile(randomChoice(this.wordIds), Math.random() < 0.5 ? 'image' : 'word')
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
      if (!this.hasAnyMatch()) return
    }
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
    return { ok: true, matches }
  }

  /** Clear current matches and update score/goals. */
  clearMatches(matches: MatchGroup[]): string[] {
    const cleared: string[] = []
    for (const group of matches) {
      cleared.push(group.wordId)
      const points = group.cells.length * 10 + (group.cells.length > 3 ? 20 : 0)
      this.score += points
      this.bumpGoal(group.wordId, 1)
      for (const c of group.cells) this.set(c.row, c.col, null)
    }
    return cleared
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
    this.goals = this.buildGoals()
    this.rebuildBoard()
  }
}
