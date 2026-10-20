export type GameKind = 'solo' | 'together'

/** Language-independent game metadata. Copy lives in the locale dictionaries. */
export type GameMeta = {
  key: GameKey
  kind: GameKind
  /** Hover motion for the line symbol, as a CSS transform. */
  motion: string
}

export type GameKey =
  'fortune' | 'lotto' | 'pinball' | 'ladder' | 'wheel' | 'horse' | 'racing'

export type Game = GameMeta & { name: string; description: string }

export const GAMES: GameMeta[] = [
  { key: 'fortune', kind: 'solo', motion: 'rotate(-10deg) scale(1.04)' },
  { key: 'lotto', kind: 'solo', motion: 'rotate(120deg)' },
  { key: 'pinball', kind: 'together', motion: 'translateY(5px) rotate(-6deg)' },
  { key: 'ladder', kind: 'together', motion: 'translateY(-6px)' },
  { key: 'wheel', kind: 'together', motion: 'rotate(90deg)' },
  { key: 'horse', kind: 'together', motion: 'translateY(-5px)' },
  { key: 'racing', kind: 'together', motion: 'translate(6px, -4px)' },
]

export const SOLO_COUNT = GAMES.filter((g) => g.kind === 'solo').length
export const TOGETHER_COUNT = GAMES.length - SOLO_COUNT

export const pad2 = (n: number) => String(n).padStart(2, '0')
