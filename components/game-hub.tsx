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
import { LocaleText } from '@/components/locale-text'
import { pad2, type Game, type GameKind } from '@/lib/games'
import type { Locale } from '@/lib/i18n'
import { gamePath } from '@/lib/routes'
import {
  NAV_FORWARD,
  SHARE_GROW,
  SHARE_MORPH,
  symbolTransition,
  tileTransition,
} from '@/lib/transitions'

export type HubCopy = {
  idle: string
  tileHint: string
  copyright: string
  kinds: Record<GameKind, string>
}

/** lg: 운세, half: 위 줄에 위아래로 쌓는 혼자 게임, sm: 아래 줄 함께 게임 */
type TileSize = 'lg' | 'half' | 'sm'

const TILE_SIZE: Record<string, TileSize> = {
  fortune: 'lg',
  lotto: 'half',
  match: 'half',
}

/*
 * 화면 폭별 그리드 배치. 위 줄은 소개와 혼자 하는 게임, 아래 줄은 함께하는 게임이다.
 * 위 줄: 데스크톱은 48칸 중 소개 18 · 운세 15 · 로또/궁합 15(위아래로 쌓음)라 운세와
 * 쌓인 열이 같은 폭이다. 소개를 이만큼 좁혀야 영어 운세 이름이 1280px부터 한 줄에
 * 들어간다. 태블릿은 소개가 한 줄을 다 쓰고 그 아래 운세 6 · 로또/궁합 6이다.
 * 아래 줄: 모바일 2열, 태블릿 3+2, 데스크톱 5칸.
 */
const PLACEMENT: Record<string, string> = {
  fortune: 'md:col-span-6 md:row-span-2 xl:col-span-15',
  lotto: 'md:col-span-6 xl:col-span-15',
  match: 'md:col-span-6 xl:col-span-15',
  pinball: 'md:col-span-2 xl:col-span-1',
  ladder: 'md:col-span-2 xl:col-span-1',
  wheel: 'md:col-span-2 xl:col-span-1',
  horse: 'md:col-span-3 xl:col-span-1',
  racing: 'col-span-2 md:col-span-3 xl:col-span-1',
}

const NAME_SIZE: Record<TileSize, string> = {
  lg: 'text-[clamp(2.5rem,3.2vw,4.25rem)] tracking-[-0.05em]',
  half: 'text-[clamp(1.875rem,2.2vw,2.75rem)] tracking-[-0.045em]',
  sm: 'text-[clamp(1.625rem,1.8vw,2.125rem)] tracking-[-0.035em]',
}

const SYMBOL_SIZE: Record<TileSize, string> = {
  lg: 'size-[clamp(7.5rem,min(10vw,17.6vh),11.875rem)]',
  half: 'size-[clamp(3rem,min(5vw,7vh),6rem)]',
  sm: 'size-[clamp(4rem,min(5vw,8.9vh),6rem)] fit:size-[clamp(3rem,min(4vw,6.4vh),6rem)]',
}

const ARROWS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

/** 누른 방향에서 가장 가까운 타일. 그려진 위치로 잰다. */
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
 * 허브는 타일 그리드이고, 타일마다 게임으로 가는 링크다. 화살표 키로 그리드를
 * 돌아다니고(roving tabindex), Enter/Space로 링크를 따라간다. 타일을 누르면
 * 모션으로만 답한다. 버튼처럼 살짝 눌린 뒤 프레임이 게임 스테이지로 자라난다
 * (`GameStage` 참고).
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
  /** 마우스 포인터 아래 타일. 하단 상태 줄이 이 타일 이름을 보여 준다. */
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  /** 하나뿐인 탭 정지점을 가진 타일. */
  const [focusKey, setFocusKey] = useState<string>(games[0].key)
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const hoverIndex = games.findIndex((g) => g.key === hoverKey)
  const hovered = hoverIndex === -1 ? null : games[hoverIndex]

  // 게임이 열려 있는 동안 Next는 허브를 언마운트하지 않고 숨겨 둔다. 나갈 때는
  // 호버 상태를 비우고, 돌아올 때는 누른 시점에 저장한 스크롤 위치와 초점을
  // 되살려(`launch` 참고) 스테이지가 실제로 화면에 보이는 타일로 줄어들게 한다.
  // 한 번만 되살린다. 언어를 바꿨다 돌아올 때(이 허브도 숨었다 다시 보인다)는
  // 지금 스크롤을 그대로 둔다.
  const saved = useRef<{ scrollY: number; index: number } | null>(null)
  useLayoutEffect(() => {
    if (saved.current) {
      window.scrollTo(0, saved.current.scrollY)
      tileRefs.current[saved.current.index]?.focus({ preventScroll: true })
      saved.current = null
    }
    return () => setHoverKey(null)
  }, [])

  const launch = (index: number) => {
    // 게임 페이지가 DOM에 들어오기 전에 스크롤 위치를 읽는다. 들어온 뒤에는
    // 스크롤 앵커링이 새 페이지 높이만큼 `scrollY`를 옮겨 버린다.
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
        // 링크는 Space를 무시한다. 그리드가 버튼처럼 느껴지게 직접 누른다.
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
      {/* 쌓인 두 칸(로또·궁합)은 운세 높이를 반씩 나눠 갖는다 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-[auto_1fr_1fr] xl:grid-cols-48 xl:grid-rows-[1fr_1fr] fit:min-h-0 fit:flex-1">
        {hero}
        {games
          .filter((g) => g.kind === 'solo')
          .map((g) => renderTile(g, games.indexOf(g)))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6 xl:grid-cols-5 fit:flex-none">
        {games
          .filter((g) => g.kind === 'together')
          .map((g) => renderTile(g, games.indexOf(g)))}
      </div>

      {/* 상태 줄: 포인터 아래 타일 이름을 타일의 번호·종류 줄과 같은 말투로
          보여 준다. 장식일 뿐이라 보조 기술에서는 숨긴다. */}
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
            <LocaleText name="status">
              <span className="truncate font-sans text-[13px] font-medium tracking-normal text-ink-2">
                {copy.idle}
              </span>
            </LocaleText>
          )}
        </p>
        <LocaleText name="copyright" align="end">
          <small className="shrink-0 font-mono text-xs tracking-[0.12em] text-ink-3">
            {copy.copyright}
          </small>
        </LocaleText>
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
 * 타일은 링크다. 프레임은 스테이지 프레임으로 자라나는 이름 붙은 공유 요소이고,
 * 심볼은 스테이지 헤더로 날아간다(`GameStage` 참고). URL에 따라 달라지는 게임
 * 내용이 클릭 전에 준비되도록 `prefetch`를 명시한다. 그러지 않으면 스테이지가
 * 서스펜드되어 모프 짝이 생기지 않는다.
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
        /* 한 화면 모드에서 아래 줄은 위 줄 타일보다 낮게: 여백·심볼을 화면 높이에 맞춰 줄인다 */
        size === 'sm'
          ? 'fit:pt-[clamp(1.125rem,2.2vh,1.625rem)] fit:pb-[clamp(1.25rem,2.4vh,1.75rem)]'
          : '',
        'transition-transform duration-150 ease-out-soft active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid',
        size === 'half'
          ? 'min-h-[14rem] md:min-h-[12rem] fit:min-h-0'
          : big
            ? 'min-h-[18rem] md:min-h-[22rem] fit:min-h-0'
            : 'min-h-[14rem] md:min-h-[16rem] fit:min-h-[clamp(12rem,24vh,18rem)]',
        PLACEMENT[game.key],
      ].join(' ')}
    >
      {/* 프레임만 공유 요소다. 평평한 사각형은 깔끔하게 늘어나고,
          그 위의 글자는 페이지와 함께 흐려진다. */}
      <ViewTransition
        name={tileTransition(game.key)}
        share={SHARE_GROW}
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
        <LocaleText name={`kind-${game.key}`} align="end">
          <span className="inline-flex items-center gap-2 font-sans text-[13px] font-bold tracking-normal text-ink-2 group-lit:hidden">
            {kind}
          </span>
        </LocaleText>
        <span className="hidden items-center gap-2 text-brand-hi group-lit:inline-flex">
          {copy.tileHint} <span aria-hidden="true">↵</span>
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`relative flex min-h-0 flex-1 items-center justify-center text-ink-3 transition-colors duration-200 motion-reduce:transition-none group-lit:text-brand-hi ${
          size === 'lg'
            ? 'py-5'
            : size === 'half'
              ? 'py-4 fit:py-[clamp(0.25rem,1vh,1rem)]'
              : 'py-4 fit:py-[clamp(0.25rem,0.9vh,0.75rem)]'
        }`}
      >
        <ViewTransition
          name={symbolTransition(game.key)}
          share={SHARE_MORPH}
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

      {/* 이름과 설명은 언어를 바꿀 때 한 덩어리로 갈아 끼운다 */}
      <LocaleText name={`tile-${game.key}`}>
        <span className="relative block">
          <span
            id={nameId}
            className={`relative block leading-[1.12] font-[750] break-keep ${NAME_SIZE[size]} ${
              big
                ? ''
                : 'max-md:[&:lang(en)]:flex max-md:[&:lang(en)]:min-h-[2.24em] max-md:[&:lang(en)]:items-end xl:max-[1340px]:[&:lang(en)]:flex xl:max-[1340px]:[&:lang(en)]:min-h-[2.24em] xl:max-[1340px]:[&:lang(en)]:items-end'
            }`}
          >
            {game.name}
          </span>
          <span
            id={descId}
            className={`relative mt-2.5 block tracking-[-0.015em] break-keep text-ink-2 ${
              big
                ? 'text-[clamp(1rem,1vw,1.125rem)] sm:mt-3.5'
                : 'min-h-[3.1em] text-[15.5px] leading-[1.55] xl:max-[1340px]:min-h-[4.65em] max-md:[&:lang(en)]:min-h-[6.2em]'
            }`}
          >
            {game.description}
          </span>
        </span>
      </LocaleText>
    </Link>
  )
}
