import { ViewTransition, type ReactNode } from 'react'
import { GameSymbol } from '@/components/game-symbol'
import { pad2, type Game } from '@/lib/games'
import { symbolTransition, tileTransition } from '@/lib/transitions'

const FRAME = 'absolute inset-0 rounded-tile border border-line bg-tile'
const SECTION =
  'relative flex min-h-0 flex-1 flex-col overflow-clip rounded-tile'

/**
 * The stage a game plays on, laid out like an enlarged hub tile (index,
 * symbol, name, kind). Its frame is the shared element the pressed tile's
 * frame grows into; the symbol is the one that flew out of the tile.
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

/** Same footprint as the stage, shown only if the game content isn't ready. */
export function GameStageFallback() {
  return (
    <section aria-busy="true" className={SECTION}>
      <span aria-hidden="true" className={FRAME} />
      <div className="relative h-[61px] border-b border-line" />
    </section>
  )
}
