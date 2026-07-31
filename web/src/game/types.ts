export type TileKind = 'image' | 'word'

export interface Tile {
  uid: number
  wordId: string
  kind: TileKind
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
