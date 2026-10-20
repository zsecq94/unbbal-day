import Link from 'next/link'
import { ViewTransition, type ReactNode } from 'react'
import { GameSymbol } from '@/components/game-symbol'
import { LocaleSwitch } from '@/components/locale-switch'
import { Logo } from '@/components/logo'
import { pad2, type Game } from '@/lib/games'
import type { Locale } from '@/lib/i18n'
import { hubPath } from '@/lib/routes'
import {
  BRAND_TRANSITION,
  NAV_BACK,
  symbolTransition,
  tileTransition,
} from '@/lib/transitions'

export type GameFrameCopy = {
  brand: string
  kind: string
  back: string
  backLabel: string
  localeSwitch: { label: string } & Record<Locale, string>
}

/**
 * Shared chrome around a game: a top bar with the way back, and the stage.
 * The stage is laid out like an enlarged hub tile (index, symbol, name, kind)
 * so the tile → stage morph reads as the same object growing.
 */
export function GameFrame({
  locale,
  game,
  index,
  copy,
  children,
}: {
  locale: Locale
  game: Game
  index: number
  copy: GameFrameCopy
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 xl:px-10 xl:py-10">
      <header className="flex h-10 items-center gap-4 sm:gap-5">
        <Link
          href={hubPath(locale)}
          transitionTypes={[NAV_BACK]}
          aria-label={copy.backLabel}
          className="inline-flex h-9 items-center gap-2.5 border border-line-strong px-3 text-ink-2 transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none lit:border-ink lit:text-ink"
        >
          <span aria-hidden="true" className="font-mono text-sm">
            ←
          </span>
          <span className="text-[13px] font-bold">{copy.back}</span>
        </Link>

        <ViewTransition name={BRAND_TRANSITION} share="morph" default="none">
          <Logo name={copy.brand} />
        </ViewTransition>

        <span className="ml-auto">
          <LocaleSwitch current={locale} labels={copy.localeSwitch} />
        </span>
      </header>

      <ViewTransition
        name={tileTransition(game.key)}
        share="grow"
        default="none"
      >
        <section
          aria-labelledby="game-title"
          className="relative flex flex-1 flex-col overflow-hidden rounded-tile border border-line bg-tile"
        >
          <header className="flex items-center gap-4 border-b border-line px-6 py-4 sm:gap-5 sm:px-7">
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
              {copy.kind}
            </span>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </section>
      </ViewTransition>
    </main>
  )
}
