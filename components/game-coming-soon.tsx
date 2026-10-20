import { GameSymbol } from '@/components/game-symbol'
import type { Game } from '@/lib/games'

/** Stage content for a game whose screen isn't built yet. */
export function GameComingSoon({
  game,
  copy,
}: {
  game: Game
  copy: { title: string; tag: string }
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 column-lines px-6 py-20 text-center sm:py-28">
      <GameSymbol
        gameKey={game.key}
        className="size-[clamp(6rem,11vw,9.5rem)] stroke-[1.4] text-ink-3"
      />
      <div className="flex flex-col items-center gap-3">
        <p className="text-[clamp(1.625rem,2.4vw,2.375rem)] leading-tight font-[750] tracking-[-0.045em] break-keep">
          {copy.title}
        </p>
        <p className="max-w-[26rem] text-[15.5px] leading-[1.55] tracking-[-0.015em] break-keep text-ink-2 sm:text-base">
          {game.description}
        </p>
      </div>
      <span className="border border-line-strong px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-ink-3">
        {copy.tag}
      </span>
    </div>
  )
}
