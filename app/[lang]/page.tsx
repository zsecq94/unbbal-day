import { GameHub } from '@/components/game-hub'
import { Hero } from '@/components/hero'
import { GAMES } from '@/lib/games'
import { getDictionary } from './dictionaries'

export default async function Home() {
  const dict = await getDictionary()
  const games = GAMES.map((game) => ({ ...game, ...dict.games[game.key] }))

  return (
    <GameHub
      hero={<Hero />}
      games={games}
      copy={{ ...dict.hub, kinds: dict.kinds }}
    />
  )
}
