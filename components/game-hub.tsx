'use client'

import Link from 'next/link'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { GameSymbol } from '@/components/game-symbol'
import { pad2, type Game, type GameKind } from '@/lib/games'
import type { Locale } from '@/lib/i18n'
import { gamePath } from '@/lib/routes'
import {
  NAV_FORWARD,
  symbolTransition,
  tileTransition,
} from '@/lib/transitions'

export type HubCopy = {
  idle: string
  tileHint: string
  copyright: string
  kinds: Record<GameKind, string>
}

type TileSize = 'lg' | 'md' | 'sm'

const TILE_SIZE: Record<string, TileSize> = { fortune: 'lg', lotto: 'md' }

/* Grid placement per breakpoint. Bottom band: mobile 2 cols, tablet 3+2, desktop 5. */
const PLACEMENT: Record<string, string> = {
  fortune: 'md:col-span-7 xl:col-span-4',
  lotto: 'md:col-span-5 xl:col-span-3',
  pinball: 'md:col-span-2 xl:col-span-1',
  ladder: 'md:col-span-2 xl:col-span-1',
  wheel: 'md:col-span-2 xl:col-span-1',
  horse: 'md:col-span-3 xl:col-span-1',
  racing: 'col-span-2 md:col-span-3 xl:col-span-1',
}

const NAME_SIZE: Record<TileSize, string> = {
  lg: 'text-[clamp(2.5rem,3.55vw,4.25rem)] tracking-[-0.05em]',
  md: 'text-[clamp(2.125rem,2.7vw,3.25rem)] tracking-[-0.05em]',
  sm: 'text-[clamp(1.625rem,1.8vw,2.125rem)] tracking-[-0.035em]',
}

const SYMBOL_SIZE: Record<TileSize, string> = {
  lg: 'size-[clamp(7.5rem,min(10vw,17.6vh),11.875rem)]',
  md: 'size-[clamp(7.5rem,min(10vw,17.6vh),11.875rem)]',
  sm: 'size-[clamp(4rem,min(5vw,8.9vh),6rem)]',
}

const ARROWS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

/** Closest tile in the pressed direction, measured from rendered positions. */
function nearestInDirection(
  rects: DOMRect[],
  from: number,
  [dx, dy]: [number, number]
) {
  const a = rects[from]
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let best = -1
  let bestScore = Infinity
  rects.forEach((b, i) => {
    if (i === from) return
    const vx = b.left + b.width / 2 - ax
    const vy = b.top + b.height / 2 - ay
    const along = vx * dx + vy * dy
    if (along <= 8) return
    const score = along + Math.abs(vx * dy - vy * dx) * 2
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

/**
 * The hub is a grid of tiles, each a link into its game. Arrow keys roam the
 * grid (roving tabindex), Enter/Space follow the link. Pressing a tile is
 * answered by motion alone: it dips like a button, then its frame grows into
 * the game stage (see `GameStage`).
 */
export function GameHub({
  hero,
  games,
  locale,
  copy,
}: {
  hero: ReactNode
  games: Game[]
  locale: Locale
  copy: HubCopy
}) {
  /** Tile under the mouse pointer; the footer status line names it. */
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  /** Tile that owns the single tab stop. */
  const [focusKey, setFocusKey] = useState<string>(games[0].key)
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const hoverIndex = games.findIndex((g) => g.key === hoverKey)
  const hovered = hoverIndex === -1 ? null : games[hoverIndex]

  // Next keeps the hub mounted (hidden) while a game is open. Clear the
  // hover status on the way out, and on the way back restore the scroll
  // position and focus saved at press time (see `launch`) so the stage
  // shrinks into a tile that is actually on screen.
  const saved = useRef<{ scrollY: number; index: number } | null>(null)
  useLayoutEffect(() => {
    if (saved.current) {
      window.scrollTo(0, saved.current.scrollY)
      tileRefs.current[saved.current.index]?.focus({ preventScroll: true })
    }
    return () => setHoverKey(null)
  }, [])

  const launch = (index: number) => {
    // Read the scroll position before the game page enters the DOM: once it
    // does, scroll anchoring shifts `scrollY` by the new page's height.
    saved.current = { scrollY: window.scrollY, index }
  }

  const moveFocus = useCallback(
    (to: number) => {
      const el = tileRefs.current[to]
      if (!el) return
      setFocusKey(games[to].key)
      el.focus()
    },
    [games]
  )

  const onTileKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLAnchorElement>) => {
      let to = -1
      if (ARROWS[e.key]) {
        const rects = tileRefs.current.map((el) => el!.getBoundingClientRect())
        to = nearestInDirection(rects, index, ARROWS[e.key])
      } else if (e.key === 'Home') to = 0
      else if (e.key === 'End') to = games.length - 1
      else if (e.key === ' ') {
        // Links ignore Space; make the grid feel like buttons.
        e.preventDefault()
        e.currentTarget.click()
        return
      } else return
      e.preventDefault()
      if (to > -1) moveFocus(to)
    },
    [games.length, moveFocus]
  )

  const renderTile = (game: Game, index: number) => (
    <GameTile
      key={game.key}
      ref={(el) => {
        tileRefs.current[index] = el
      }}
      game={game}
      href={gamePath(locale, game.key)}
      index={index}
      size={TILE_SIZE[game.key] ?? 'sm'}
      tabIndex={focusKey === game.key ? 0 : -1}
      copy={copy}
      onNavigate={() => launch(index)}
      onFocus={() => setFocusKey(game.key)}
      onHover={(over) =>
        setHoverKey((k) => (over ? game.key : k === game.key ? null : k))
      }
      onKeyDown={(e) => onTileKeyDown(index, e)}
    />
  )

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 xl:px-10 xl:py-10 fit:h-dvh fit:py-[clamp(1.25rem,3.7vh,2.5rem)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 fit:flex-1">
        {hero}
        {games.slice(0, 2).map((g, i) => renderTile(g, i))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6 xl:grid-cols-5 fit:flex-none">
        {games.slice(2).map((g, i) => renderTile(g, i + 2))}
      </div>

      {/* Status line: names the tile under the pointer, in the same voice as
          the tiles' own index/kind row. Decorative only, so hidden from AT. */}
      <footer className="mt-1 flex min-h-[52px] items-center justify-between gap-6 border-t border-line-strong px-1">
        <p
          aria-hidden="true"
          className="flex min-w-0 items-center gap-3.5 font-mono text-xs font-medium tracking-[0.12em] text-ink-3"
        >
          <span
            className={`size-2.5 shrink-0 border transition-colors duration-200 motion-reduce:transition-none ${
              hovered ? 'border-brand bg-brand' : 'border-ink-3'
            }`}
          />
          {hovered ? (
            <span className="flex min-w-0 items-center gap-3">
              <span>{pad2(hoverIndex + 1)}</span>
              <span className="truncate font-sans text-[13px] font-bold tracking-normal text-ink">
                {hovered.name}
              </span>
              <span className="ml-1 font-sans text-[13px] font-bold tracking-normal text-ink-3">
                {copy.kinds[hovered.kind]}
              </span>
            </span>
          ) : (
            <span className="truncate font-sans text-[13px] font-medium tracking-normal text-ink-2">
              {copy.idle}
            </span>
          )}
        </p>
        <small className="shrink-0 font-mono text-xs tracking-[0.12em] text-ink-3">
          {copy.copyright}
        </small>
      </footer>
    </main>
  )
}

type GameTileProps = {
  ref: (el: HTMLAnchorElement | null) => void
  game: Game
  href: string
  index: number
  size: TileSize
  tabIndex: number
  copy: HubCopy
  onNavigate: () => void
  onFocus: () => void
  onHover: (over: boolean) => void
  onKeyDown: (e: KeyboardEvent<HTMLAnchorElement>) => void
}

/**
 * A tile is a link. Its frame is a named shared element that grows into the
 * stage frame, and its symbol flies to the stage header (see `GameStage`).
 * `prefetch` is explicit so the game's own content (which depends on the URL)
 * is ready before the click; otherwise the stage would suspend and no morph
 * pair would form.
 */
function GameTile({
  ref,
  game,
  href,
  index,
  size,
  tabIndex,
  copy,
  onNavigate,
  onFocus,
  onHover,
  onKeyDown,
}: GameTileProps) {
  const kind = copy.kinds[game.kind]
  const nameId = `game-${game.key}-name`
  const descId = `game-${game.key}-desc`
  const big = size !== 'sm'

  const onPointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={true}
      transitionTypes={[NAV_FORWARD]}
      aria-labelledby={nameId}
      aria-describedby={descId}
      tabIndex={tabIndex}
      onNavigate={onNavigate}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(true)}
      onPointerLeave={() => onHover(false)}
      style={{ '--motion': game.motion } as CSSProperties}
      className={[
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-tile text-left text-ink',
        'px-6 pt-6 pb-6 sm:px-7 sm:pt-[26px] sm:pb-7',
        'transition-transform duration-150 ease-out-soft active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid',
        big
          ? 'min-h-[18rem] md:min-h-[22rem] fit:min-h-0'
          : 'min-h-[14rem] md:min-h-[16rem] fit:min-h-[clamp(14rem,30.5vh,20.75rem)]',
        PLACEMENT[game.key],
      ].join(' ')}
    >
      {/* The frame alone is the shared element: a flat rect scales cleanly,
          while the text above it fades with the page. */}
      <ViewTransition
        name={tileTransition(game.key)}
        share="grow"
        default="none"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-tile border border-line bg-tile transition-[background-color,border-color] duration-200 motion-reduce:transition-none group-lit:border-brand-hi/70 group-lit:bg-tile-lit"
        />
      </ViewTransition>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 spotlight motion-reduce:transition-none group-lit:opacity-100"
      />

      <span
        aria-hidden="true"
        className="relative flex items-center justify-between font-mono text-xs font-medium tracking-[0.12em] text-ink-3"
      >
        <span>{pad2(index + 1)}</span>
        <span className="inline-flex items-center gap-2 font-sans text-[13px] font-bold tracking-normal text-ink-2 group-lit:hidden">
          {kind}
        </span>
        <span className="hidden items-center gap-2 text-brand-hi group-lit:inline-flex">
          {copy.tileHint} <span aria-hidden="true">↵</span>
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`relative flex min-h-0 flex-1 items-center justify-center text-ink-3 transition-colors duration-200 motion-reduce:transition-none group-lit:text-brand-hi ${
          big ? 'py-5' : 'py-4 fit:py-[clamp(0.5rem,1.5vh,1rem)]'
        }`}
      >
        <ViewTransition
          name={symbolTransition(game.key)}
          share="morph"
          default="none"
        >
          <GameSymbol
            gameKey={game.key}
            className={[
              SYMBOL_SIZE[size],
              big ? 'stroke-[1.8]' : 'stroke-[1.6]',
              'transition-transform duration-[450ms] ease-out-soft motion-reduce:transition-none',
              'group-lit:[transform:var(--motion)] motion-reduce:group-lit:transform-none',
            ].join(' ')}
          />
        </ViewTransition>
      </span>

      <span
        id={nameId}
        className={`relative block leading-[1.12] font-[750] break-keep ${NAME_SIZE[size]} ${
          big
            ? ''
            : 'max-md:[&:lang(en)]:flex max-md:[&:lang(en)]:min-h-[2.24em] max-md:[&:lang(en)]:items-end xl:max-2xl:[&:lang(en)]:flex xl:max-2xl:[&:lang(en)]:min-h-[2.24em] xl:max-2xl:[&:lang(en)]:items-end'
        }`}
      >
        {game.name}
      </span>
      <span
        id={descId}
        className={`relative mt-2.5 block tracking-[-0.015em] break-keep text-ink-2 ${
          big
            ? 'text-[clamp(1rem,1vw,1.125rem)] sm:mt-3.5'
            : 'min-h-[3.1em] text-[15.5px] leading-[1.55] xl:max-2xl:min-h-[4.65em] max-md:[&:lang(en)]:min-h-[6.2em]'
        }`}
      >
        {game.description}
      </span>
    </Link>
  )
}
