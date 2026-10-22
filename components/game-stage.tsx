import { ViewTransition, type ReactNode } from 'react'
import { GameSymbol } from '@/components/game-symbol'
import { pad2, type Game } from '@/lib/games'
import { symbolTransition, tileTransition } from '@/lib/transitions'

const FRAME = 'absolute inset-0 rounded-tile border border-line bg-tile'
const SECTION =
  'relative flex min-h-0 flex-1 flex-col overflow-clip rounded-tile'

/**
 * 게임이 펼쳐지는 스테이지. 허브 타일을 크게 키운 모양(번호, 심볼, 이름,
 * 종류)이다. 프레임은 누른 타일의 프레임이 자라나 닿는 공유 요소이고,
 * 심볼은 타일에서 날아온 그 심볼이다.
 */
export function GameStage({
  game,
  index,
  kind,
  children,
}: {
  game: Game
  index: number
  kind: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby="game-title" className={SECTION}>
      <ViewTransition
        name={tileTransition(game.key)}
        share="grow"
        default="none"
      >
        <span aria-hidden="true" className={FRAME} />
      </ViewTransition>

      <header className="relative flex items-center gap-4 border-b border-line px-6 py-4 sm:gap-5 sm:px-7">
        <span
          aria-hidden="true"
          className="font-mono text-xs font-medium tracking-[0.12em] text-ink-3"
        >
          {pad2(index + 1)}
        </span>
        <span className="flex min-w-0 items-center gap-3 text-brand-hi">
          <ViewTransition
            name={symbolTransition(game.key)}
            share="morph"
            default="none"
          >
            <GameSymbol
              gameKey={game.key}
              className="size-7 shrink-0 stroke-[2.4]"
            />
          </ViewTransition>
          <h1
            id="game-title"
            className="truncate text-[17px] leading-none font-[750] tracking-[-0.03em] text-ink sm:text-lg"
          >
            {game.name}
          </h1>
        </span>
        <span className="ml-auto shrink-0 text-[13px] font-bold text-ink-2">
          {kind}
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

/** 스테이지와 같은 자리를 차지한다. 게임 내용이 준비되지 않았을 때만 보인다. */
export function GameStageFallback() {
  return (
    <section aria-busy="true" className={SECTION}>
      <span aria-hidden="true" className={FRAME} />
      <div className="relative h-[61px] border-b border-line" />
    </section>
  )
}
