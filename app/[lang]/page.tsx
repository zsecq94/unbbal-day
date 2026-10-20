import { GameHub } from '@/components/game-hub'
import { Hero } from '@/components/hero'
import { PageTransition } from '@/components/page-transition'
import { GAMES } from '@/lib/games'
import { getDictionary, getLocale } from './dictionaries'

export default async function Home() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])
  const games = GAMES.map((game) => ({ ...game, ...dict.games[game.key] }))

  return (
    <PageTransition>
      <GameHub
        hero={<Hero />}
        games={games}
        locale={locale}
        copy={{ ...dict.hub, kinds: dict.kinds }}
      />
    </PageTransition>
  )
}
