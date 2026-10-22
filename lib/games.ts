export type GameKind = 'solo' | 'together'

/** 언어와 무관한 게임 메타데이터. 문구는 로케일 사전에 있다. */
export type GameMeta = {
  key: GameKey
  kind: GameKind
  /** 라인 심볼의 호버 모션(CSS transform). */
  motion: string
}

export type GameKey =
  | 'fortune'
  | 'lotto'
  | 'match'
  | 'pinball'
  | 'ladder'
  | 'wheel'
  | 'horse'
  | 'racing'

export type Game = GameMeta & { name: string; description: string }

export const GAMES: GameMeta[] = [
  { key: 'fortune', kind: 'solo', motion: 'rotate(-10deg) scale(1.04)' },
  { key: 'lotto', kind: 'solo', motion: 'rotate(120deg)' },
  { key: 'match', kind: 'solo', motion: 'translateY(4px) scale(1.06)' },
  { key: 'pinball', kind: 'together', motion: 'translateY(5px) rotate(-6deg)' },
  { key: 'ladder', kind: 'together', motion: 'translateY(-6px)' },
  { key: 'wheel', kind: 'together', motion: 'rotate(90deg)' },
  { key: 'horse', kind: 'together', motion: 'translateY(-5px)' },
  { key: 'racing', kind: 'together', motion: 'translate(6px, -4px)' },
]

export const GAME_KEYS = GAMES.map((g) => g.key)

export const isGameKey = (value: string): value is GameKey =>
  GAME_KEYS.includes(value as GameKey)

export const SOLO_COUNT = GAMES.filter((g) => g.kind === 'solo').length
export const TOGETHER_COUNT = GAMES.length - SOLO_COUNT

export const pad2 = (n: number) => String(n).padStart(2, '0')
