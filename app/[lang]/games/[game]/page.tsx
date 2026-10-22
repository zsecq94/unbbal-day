import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { GameComingSoon } from '@/components/game-coming-soon'
import { GameStage, GameStageFallback } from '@/components/game-stage'
import { GAME_SCREENS } from '@/components/games/registry'
import { PageFrame } from '@/components/page-frame'
import { PageTransition } from '@/components/page-transition'
import { TopBar } from '@/components/top-bar'
import { GAMES, isGameKey } from '@/lib/games'
import { LOCALES } from '@/lib/i18n'
import { gamePath } from '@/lib/routes'
import { getDictionary, getLocale } from '../../dictionaries'

type Props = PageProps<'/[lang]/games/[game]'>

/* 모든 게임 페이지를 모든 로케일로 미리 렌더한다. */
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

/**
 * 상단바는 URL과 무관해서 공용 앱 셸에 둔다. 어떤 게임을 보여 줄지는 URL에
 * 달려 있어서 그 부분은 Suspense 안에서 읽는다. 허브 타일이 링크마다 미리
 * 받아 두므로 클릭 전에 스테이지가 준비된다.
 */
export default function GamePage({ params }: Props) {
  return (
    <PageTransition>
      <PageFrame>
        <TopBar />
        <Suspense fallback={<GameStageFallback />}>
          <Stage params={params} />
        </Suspense>
      </PageFrame>
    </PageTransition>
  )
}

async function Stage({ params }: Pick<Props, 'params'>) {
  const { game: key } = await params
  if (!isGameKey(key)) notFound()

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()])
  const index = GAMES.findIndex((g) => g.key === key)
  const game = { ...GAMES[index], ...dict.games[key] }
  const Screen = GAME_SCREENS[key]

  return (
    <GameStage game={game} index={index} kind={dict.kinds[game.kind]}>
      {Screen ? (
        <Screen game={game} locale={locale} />
      ) : (
        <GameComingSoon game={game} copy={dict.game.comingSoon} />
      )}
    </GameStage>
  )
}
