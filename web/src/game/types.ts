export type TileKind = 'image' | 'word'

/** Candy-crush-style boosters created from big matches. */
export type TileSpecial = 'rocket-h' | 'rocket-v' | 'bomb'

export interface Tile {
  uid: number
  wordId: string
  kind: TileKind
  special?: TileSpecial
}

export interface CellPos {
  row: number
  col: number
}

export interface MatchGroup {
  wordId: string
  cells: CellPos[]
}

export interface LevelGoal {
  wordId: string
  target: number
  current: number
}

export interface GameSnapshot {
  cols: number
  rows: number
  cells: Array<Tile | null>
  score: number
  movesLeft: number
  goals: LevelGoal[]
  won: boolean
  lost: boolean
}

export interface TileFall {
  uid: number
  col: number
  fromRow: number
  toRow: number
}

export interface TileSpawn {
  uid: number
  row: number
  col: number
  dropRows: number
}

export interface SettleResult {
  falls: TileFall[]
  spawns: TileSpawn[]
}

export interface HintMove {
  a: CellPos
  b: CellPos
}

export interface SpecialSpawn {
  row: number
  col: number
  wordId: string
  kind: TileKind
  special: TileSpecial
  /** Keep uid so the slot can morph without a spawn fall. */
  uid: number
}

/** Planned clear for one cascade wave (matches + special blasts). */
export interface ClearPlan {
  /** Cells that become empty (fade out). */
  fade: CellPos[]
  /** Cells that turn into a new special in place. */
  morph: SpecialSpawn[]
  /** Word ids that progress goals this wave (once each). */
  clearedWordIds: string[]
}
