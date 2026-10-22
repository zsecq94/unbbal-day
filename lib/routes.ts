import type { GameKey } from '@/lib/games'
import type { Locale } from '@/lib/i18n'

/** 로케일의 허브(홈). */
export const hubPath = (locale: Locale) => `/${locale}`

/** 게임 화면. 모든 게임은 `/[lang]/games/[game]` 아래에 있다. */
export const gamePath = (locale: Locale, key: GameKey) =>
  `/${locale}/games/${key}`
