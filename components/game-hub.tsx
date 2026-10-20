'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { GameSymbol } from '@/components/game-symbol'
import { pad2, type Game, type GameKind } from '@/lib/games'

export type HubCopy = {
  idle: string
  /** Contains a `{name}` placeholder. */
  selected: string
  tileHint: string
  tileSelected: string
  keys: { move: string; select: string; clear: string }
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

export function GameHub({
  hero,
  games,
  copy,
}: {
  hero: ReactNode
  games: Game[]
  copy: HubCopy
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState<string>(games[0].key)
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([])

  const selectedGame = games.find((g) => g.key === selected) ?? null

  useEffect(() => {
    if (!selected) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

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
    (index: number, e: KeyboardEvent<HTMLButtonElement>) => {
      let to = -1
      if (ARROWS[e.key]) {
        const rects = tileRefs.current.map((el) => el!.getBoundingClientRect())
        to = nearestInDirection(rects, index, ARROWS[e.key])
      } else if (e.key === 'Home') to = 0
      else if (e.key === 'End') to = games.length - 1
      else return
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
      index={index}
      size={TILE_SIZE[game.key] ?? 'sm'}
      selected={selected === game.key}
      tabIndex={focusKey === game.key ? 0 : -1}
      copy={copy}
      onSelect={() => {
        setSelected(game.key)
        setFocusKey(game.key)
      }}
      onFocus={() => setFocusKey(game.key)}
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

      <footer className="mt-1 flex min-h-[52px] items-center justify-between gap-6 border-t border-line-strong px-1">
        <p className="flex items-center gap-3.5 text-base tracking-[-0.01em] sm:text-[17px]">
          <span
            aria-hidden="true"
            className={`size-2.5 shrink-0 border transition-colors duration-200 motion-reduce:transition-none ${
              selectedGame ? 'border-brand bg-brand' : 'border-ink-3'
            }`}
          />
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={selectedGame ? 'text-ink' : 'text-ink-2'}
          >
            {selectedGame
              ? copy.selected.replace('{name}', selectedGame.name)
              : copy.idle}
          </span>
        </p>
        <KeyHints labels={copy.keys} />
      </footer>
    </main>
  )
}

function KeyHints({ labels }: { labels: HubCopy['keys'] }) {
  const key =
    'inline-flex h-[22px] min-w-[22px] items-center justify-center border border-line-strong px-1.5 font-mono text-[11px] text-ink-2'
  return (
    <div
      aria-hidden="true"
      className="hidden gap-6 font-mono text-[11.5px] tracking-[0.12em] text-ink-3 lg:[@media(hover:hover)]:flex"
    >
      <span className="inline-flex items-center gap-1.5">
        <kbd className={key}>←</kbd>
        <kbd className={key}>→</kbd>
        <kbd className={key}>↑</kbd>
        <kbd className={key}>↓</kbd>
        <span className="ml-0.5">{labels.move}</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <kbd className={key}>Enter</kbd>
        {labels.select}
      </span>
      <span className="inline-flex items-center gap-2">
        <kbd className={key}>Esc</kbd>
        {labels.clear}
      </span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" fill="currentColor" />
      <path
        d="M4 8.2 L6.8 11 L12 5.2"
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
      />
    </svg>
  )
}

type GameTileProps = {
  ref: (el: HTMLButtonElement | null) => void
  game: Game
  index: number
  size: TileSize
  selected: boolean
  tabIndex: number
  copy: HubCopy
  onSelect: () => void
  onFocus: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
}

function GameTile({
  ref,
  game,
  index,
  size,
  selected,
  tabIndex,
  copy,
  onSelect,
  onFocus,
  onKeyDown,
}: GameTileProps) {
  const kind = copy.kinds[game.kind]
  const nameId = `game-${game.key}-name`
  const descId = `game-${game.key}-desc`
  const big = size !== 'sm'

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      aria-labelledby={nameId}
      aria-describedby={descId}
      tabIndex={tabIndex}
      onClick={onSelect}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      style={{ '--motion': game.motion } as CSSProperties}
      className={[
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-tile border text-left',
        'px-6 pt-6 pb-6 sm:px-7 sm:pt-[26px] sm:pb-7',
        'transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid',
        big
          ? 'min-h-[18rem] md:min-h-[22rem] fit:min-h-0'
          : 'min-h-[14rem] md:min-h-[16rem] fit:min-h-[clamp(14rem,30.5vh,20.75rem)]',
        selected
          ? 'border-brand bg-brand text-white shadow-[0_24px_60px_-24px_rgb(31_91_255/0.7)]'
          : 'border-line bg-tile text-ink lit:border-brand-hi/70 lit:bg-tile-lit',
        PLACEMENT[game.key],
      ].join(' ')}
    >
      {selected ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 column-lines [--column-line:rgb(255_255_255/0.12)]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 spotlight motion-reduce:transition-none group-lit:opacity-100"
        />
      )}

      <span
        aria-hidden="true"
        className={`relative flex items-center justify-between font-mono text-xs font-medium tracking-[0.12em] ${
          selected ? 'text-white/80' : 'text-ink-3'
        }`}
      >
        <span>{pad2(index + 1)}</span>
        {selected ? (
          <span className="inline-flex items-center gap-2 text-white">
            <CheckIcon />
            {copy.tileSelected}
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 font-sans text-[13px] font-bold tracking-normal text-ink-2 group-lit:hidden">
              {kind}
            </span>
            <span className="hidden items-center gap-2 text-brand-hi group-lit:inline-flex">
              {copy.tileHint} <span aria-hidden="true">↵</span>
            </span>
          </>
        )}
      </span>

      <span
        aria-hidden="true"
        className={`relative flex min-h-0 flex-1 items-center justify-center transition-colors ${big ? 'py-5' : 'py-4 fit:py-[clamp(0.5rem,1.5vh,1rem)]'} duration-200 motion-reduce:transition-none ${
          selected ? 'text-white' : 'text-ink-3 group-lit:text-brand-hi'
        }`}
      >
        <GameSymbol
          gameKey={game.key}
          className={[
            SYMBOL_SIZE[size],
            big ? 'stroke-[1.8]' : 'stroke-[1.6]',
            'transition-transform duration-[450ms] ease-out-soft motion-reduce:transition-none',
            selected
              ? ''
              : 'group-lit:[transform:var(--motion)] motion-reduce:group-lit:transform-none',
          ].join(' ')}
        />
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
        className={`relative mt-2.5 block tracking-[-0.015em] break-keep ${
          big
            ? 'text-[clamp(1rem,1vw,1.125rem)] sm:mt-3.5'
            : 'min-h-[3.1em] text-[15.5px] leading-[1.55] xl:max-2xl:min-h-[4.65em] max-md:[&:lang(en)]:min-h-[6.2em]'
        } ${selected ? 'text-white/85' : 'text-ink-2'}`}
      >
        {game.description}
      </span>
    </button>
  )
}
