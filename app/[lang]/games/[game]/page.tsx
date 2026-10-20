import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameComingSoon } from '@/components/game-coming-soon'
import { GameFrame } from '@/components/game-frame'
import { GAME_SCREENS } from '@/components/games/registry'
import { PageTransition } from '@/components/page-transition'
import { GAMES, isGameKey } from '@/lib/games'
import { LOCALES } from '@/lib/i18n'
import { gamePath } from '@/lib/routes'
import { getDictionary, getLocale } from '../../dictionaries'

type Props = PageProps<'/[lang]/games/[game]'>

/* Every game page is prerendered for every locale. */
export function generateStaticParams() {
  return GAMES.map(({ key }) => ({ game: key }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { game } = await params
  if (!isGameKey(game)) notFound()
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])
  const { name, description } = dict.games[game]
  return {
    title: name,
    description,
    alternates: {
      canonical: gamePath(locale, game),
      languages: Object.fromEntries(LOCALES.map((l) => [l, gamePath(l, game)])),
    },
  }
}

export default async function GamePage({ params }: Props) {
  const { game: key } = await params
  if (!isGameKey(key)) notFound()

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])
  const index = GAMES.findIndex((g) => g.key === key)
  const game = { ...GAMES[index], ...dict.games[key] }
  const Screen = GAME_SCREENS[key]

  return (
    <PageTransition>
      <GameFrame
        locale={locale}
        game={game}
        index={index}
        copy={{
          brand: dict.brand.name,
          kind: dict.kinds[game.kind],
          back: dict.nav.back,
          backLabel: dict.nav.backLabel,
          localeSwitch: dict.localeSwitch,
        }}
      >
        {Screen ? (
          <Screen game={game} locale={locale} />
        ) : (
          <GameComingSoon game={game} copy={dict.game.comingSoon} />
        )}
      </GameFrame>
    </PageTransition>
  )
}
