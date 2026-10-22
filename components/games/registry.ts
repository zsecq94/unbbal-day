import type { ComponentType } from 'react'
import { FortuneGame } from '@/components/games/fortune'
import type { Game, GameKey } from '@/lib/games'
import type { Locale } from '@/lib/i18n'

export type GameScreenProps = {
  game: Game
  locale: Locale
}

/**
 * 키별 게임 화면. `app/[lang]/games/[game]/page.tsx`의 스테이지 프레임 안에
 * 그려진다. 등록이 없는 키는 준비 중 화면이 나온다. 화면이 생기면 여기에
 * 등록한다:
 *
 *   fortune: FortuneScreen,
 */
export const GAME_SCREENS: Partial<
  Record<GameKey, ComponentType<GameScreenProps>>
> = { fortune: FortuneGame }
