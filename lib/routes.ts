import type { GameKey } from '@/lib/games'
import type { Locale } from '@/lib/i18n'

/** Hub (home) for a locale. */
export const hubPath = (locale: Locale) => `/${locale}`

/** Game screen. Every game lives under `/[lang]/games/[game]`. */
export const gamePath = (locale: Locale, key: GameKey) =>
  `/${locale}/games/${key}`
