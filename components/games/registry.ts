import type { ComponentType } from 'react'
import type { Game, GameKey } from '@/lib/games'
import type { Locale } from '@/lib/i18n'

export type GameScreenProps = {
  game: Game
  locale: Locale
}

/**
 * Game screens by key, rendered inside the stage frame of
 * `app/[lang]/games/[game]/page.tsx`. A key without an entry shows the
 * coming-soon stage. Register a game here once its screen exists:
 *
 *   fortune: FortuneScreen,
 */
export const GAME_SCREENS: Partial<
  Record<GameKey, ComponentType<GameScreenProps>>
> = {}
