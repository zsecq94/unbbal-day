'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  b,
  Ball,
  blockRange,
  charOf,
  chartText,
  dayName,
  ganji,
  hanjaOf,
  josa,
  moveLabel,
  pad2,
  pillarHanja,
  toneClass,
  type LottoCopy,
  type SajuCopy,
} from '@/components/games/lotto/shared'
import { GAME_COLORS, Sky } from '@/components/games/lotto/sky'
import {
  compose,
  fill,
  rich,
  useReducedMotion,
} from '@/components/games/shared'
import type { Profile } from '@/lib/fortune'
import type { Locale } from '@/lib/i18n'
import {
  HADO_DIGITS,
  luckyDraw,
  nextDraw,
  startCell,
  TOTAL,
  type LuckyDraw,
  type Move,
} from '@/lib/lotto'
import { currentHandoff, markWalked } from '@/lib/lotto/handoff'
import {
  drawRandom,
  GAME_LABELS,
  MAX_EXCLUDED,
  MAX_FIXED,
  MAX_GAMES,
  type Game,
} from '@/lib/lotto/random'
import { gamePath } from '@/lib/routes'
import { todayOf, type Today } from '@/lib/saju/chart'
import { localZone } from '@/lib/saju/time'
import { NAV_BACK, NAV_FORWARD } from '@/lib/transitions'
import { s } from './sky-classes'
import './sky.css'

type Mode = 'fortune' | 'random'
type View = 'gate' | 'walk' | 'result'
type CellState = 'fixed' | 'excluded'
type Landed = { n: number; from: DOMRect | null }
type Round = { games: Game[]; shown: number[]; done: boolean }

/** 운세와 같은 시간대: 오늘은 방문자 시간대, 태어난 곳은 한국어면 서울 */
const zonesFor = (locale: Locale) => {
  const zone = localZone()
  return { zone, birthZone: locale === 'ko' ? 'Asia/Seoul' : zone }
}

/** 안내 화면의 예시 별자리를 그리는 원국 */
const EXAMPLE: Profile = {
  year: '1994',
  month: '05',
  day: '12',
  time: '07',
  calendar: 'solar',
  gender: '',
  name: '',
}

const FOCUS =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid'
const PRESS =
  'transition-[color,transform] duration-150 ease-out-soft active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100'
const BTN = `inline-flex h-[38px] shrink-0 items-center gap-2.5 border border-line-strong bg-[rgb(6_8_16/0.5)] px-4 text-sm font-bold whitespace-nowrap text-ink-2 lit:text-ink ${FOCUS} ${PRESS}`
const BTN_PRIMARY = `inline-flex h-[38px] shrink-0 items-center gap-2.5 bg-ink px-5 text-sm font-bold whitespace-nowrap text-canvas ${FOCUS} ${PRESS}`
const LINK = `inline-flex items-center gap-2 text-[13px] font-bold whitespace-nowrap text-ink-2 transition-colors duration-200 lit:text-ink motion-reduce:transition-none ${FOCUS}`
const SEG = 'inline-flex w-fit border border-line-strong bg-[rgb(6_8_16/0.6)]'
const SEG_ITEM = `px-3.5 text-[13px] font-bold whitespace-nowrap transition-[color,transform] duration-150 ease-out-soft not-first:border-l not-first:border-line-strong active:scale-[0.97] motion-reduce:transition-none ${FOCUS}`
const segState = (on: boolean) =>
  on ? 'bg-ink text-canvas' : 'text-ink-3 lit:text-ink'

/**
 * 로또 번호 뽑기. 45개 번호가 밤하늘의 별이다.
 * 운세로 뽑기: 오늘의 운세에서 넘겨받은 원국으로 상생 궤도를 걸어 별자리를 그리고,
 * 내려앉은 별이 로또 공이 되어 아래 자리로 떨어진다. 넘겨받은 원국이 없으면 운세로 안내한다.
 * 그냥 뽑기: 같은 하늘에 별똥별이 떨어진다(고정·제외 반영, 1–5게임).
 */
export function LottoScreen({
  copy,
  saju,
  locale,
}: {
  copy: LottoCopy
  saju: SajuCopy
  locale: Locale
}) {
  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  const [mode, setMode] = useState<Mode>('fortune')
  const [view, setView] = useState<View>('gate')
  const [draw, setDraw] = useState<LuckyDraw | null>(null)
  const [today, setToday] = useState<Today | null>(null)
  const [example, setExample] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  /* 걷기 */
  const [caption, setCaption] = useState<ReactNode[]>([])
  const [landed, setLanded] = useState<Landed[]>([])
  const [reveal, setReveal] = useState(false)

  /* 그냥 뽑기 */
  const [games, setGames] = useState(1)
  const [cells, setCells] = useState<Map<number, CellState>>(new Map())
  const [hint, setHint] = useState<{ text: ReactNode; bad: boolean } | null>(
    null
  )
  const [round, setRound] = useState<Round | null>(null)
  const [history, setHistory] = useState<Game[][]>([])
  const [boardOpen, setBoardOpen] = useState(true)

  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const skyRef = useRef<Sky | null>(null)
  const [skyReady, setSkyReady] = useState(0)
  const [drawDay, setDrawDay] = useState<ReturnType<typeof nextDraw> | null>(
    null
  )
  const seenRef = useRef(0)

  /* ── 걷기 ── */
  const finish = useCallback(() => {
    setView('result')
    setReveal(false)
  }, [])

  const startWalk = useCallback(
    (d: LuckyDraw) => {
      const sky = skyRef.current
      setSelected(null)
      setLanded([])
      setReveal(false)
      if (!sky || reducedRef.current) {
        setView('result')
        return
      }
      setView('walk')
      const o = d.orbit
      setCaption([
        <span key="s" className="swap">
          {rich(
            copy.walk.start.map((p) =>
              typeof p === 'string'
                ? p
                : {
                    b: fill(p.b, {
                      day: dayName(copy, saju, d.today),
                      n: o.start,
                    }),
                  }
            )
          )}
        </span>,
        <span key="g" className="swap">
          {fill(copy.walk.gi, { el: saju.elements[o.gi] })}
        </span>,
      ])
      sky.walk(o, {
        onMove: (k) => setCaption(moveCaption(copy, saju, o.moves[k])),
        onSkip: (k, cell, why) =>
          setCaption((c) => [
            ...c,
            <span key={`k${k}-${cell}`} className="swap">
              {fill(why === 'gi' ? copy.walk.skipGi : copy.walk.skipTaken, {
                n: cell,
              })}
            </span>,
          ]),
        onEnd: (k, i) => {
          const m = o.moves[k]
          setCaption((c) => [
            ...c,
            <span key={`e${k}`} className="swap text-[#b9cbff]">
              {fill(i == null ? copy.walk.restart : copy.walk.land, {
                n: m.to,
              })}
            </span>,
          ])
          if (i != null)
            setLanded((l) => [...l, { n: m.to, from: sky.starRect(m.to) }])
        },
        onClimax: () => {
          setReveal(true)
          setCaption([
            <span key="c" className="swap">
              {rich(copy.walk.climax)}
            </span>,
          ])
        },
        onFinish: finish,
      })
    },
    [copy, saju, finish]
  )

  const skip = useCallback(() => {
    if (!draw) return
    skyRef.current?.paintFortune(draw.orbit)
    finish()
  }, [draw, finish])

  /* ── 하늘 만들기(숨겨졌다 다시 보이면 새로 만든다) ──
     첫 배치가 끝나면 오늘·예시 별자리·추첨일을 정하고, 운세에서 넘겨받은 원국이 있으면 걷는다. */
  const onSkyReady = useEffectEvent(() => {
    const zones = zonesFor(locale)
    setToday(todayOf(Date.now(), zones.zone))
    setExample(luckyDraw(EXAMPLE, zones).orbit.picks)
    setDrawDay(nextDraw())
    setSkyReady((v) => v + 1)
    const h = currentHandoff()
    if (!h || h.id === seenRef.current) return
    seenRef.current = h.id
    const d = luckyDraw(h.profile, zones)
    setDraw(d)
    setMode('fortune')
    if (h.walked) setView('result')
    else {
      markWalked(h.id)
      startWalk(d)
    }
  })
  useEffect(() => {
    const sky = new Sky(
      hostRef.current!,
      sceneRef.current!,
      bgRef.current!,
      () => reducedRef.current,
      onSkyReady
    )
    skyRef.current = sky
    return () => {
      sky.destroy()
      skyRef.current = null
    }
  }, [])

  /* ── 하늘 맞추기: 상태가 바뀌거나 하늘을 새로 만들면 그린다(걷는 중은 엔진이 그린다) ── */
  useEffect(() => {
    const sky = skyRef.current
    if (!sky) return
    if (mode === 'random') {
      sky.stopWalk()
      sky.setMode('random')
      sky.setCalm(false)
      for (let n = 1; n <= TOTAL; n++) sky.setCell(n, cells.get(n) ?? null)
      return
    }
    if (view === 'gate') {
      sky.setMode('preview')
      sky.setCalm(true)
      if (today) sky.preview(startCell(today.day), example)
    } else if (view === 'result' && draw) {
      sky.setMode('fortune')
      sky.setCalm(true)
      sky.paintFortune(draw.orbit)
    } else if (view === 'walk') {
      sky.setMode('fortune')
      sky.setCalm(false)
    }
  }, [skyReady, mode, view, draw, today, example, cells])

  /* 그냥 뽑기의 하늘: 뽑아 둔 게임을 다시 칠한다(뽑는 중은 엔진이 그린다) */
  useEffect(() => {
    const sky = skyRef.current
    if (!sky || mode !== 'random') return
    if (round?.done) sky.paintRandom(round.games)
    else if (!round) sky.clearRandom()
    // 뽑는 중(round && !done)에는 dropRandom이 그린다
  }, [skyReady, mode, round])

  useEffect(() => {
    if (view === 'result' && draw && mode === 'fortune')
      skyRef.current?.select(draw.orbit, selected)
  }, [selected, view, draw, mode, skyReady])

  /* 하늘의 읽는 이름 */
  useEffect(() => {
    const sky = skyRef.current
    if (!sky) return
    if (mode === 'random')
      sky.setAriaLabel(
        round?.done
          ? fill(copy.sky.ariaRandom, {
              list: round.games.map((g) => g.numbers.join(', ')).join(' / '),
            })
          : copy.sky.ariaEmpty
      )
    else if (draw && view !== 'gate')
      sky.setAriaLabel(
        fill(copy.sky.ariaConstellation, { list: draw.orbit.picks.join(', ') })
      )
    else if (today)
      sky.setAriaLabel(fill(copy.sky.ariaPreview, { n: startCell(today.day) }))
  }, [skyReady, mode, view, draw, today, round, copy])

  /* Enter로 걷기를 건너뛴다 */
  useEffect(() => {
    if (mode !== 'fortune' || view !== 'walk') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return
      if ((e.target as Element).closest?.('button, a')) return
      e.preventDefault()
      skip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, view, skip])

  const changeMode = (next: Mode) => {
    if (next === mode) return
    if (next === 'random' && view === 'walk' && draw) {
      skyRef.current?.paintFortune(draw.orbit)
      finish()
    }
    setMode(next)
  }

  /* ── 그냥 뽑기 ── */
  const fixed = [...cells].filter(([, v]) => v === 'fixed').map(([n]) => n)
  const excluded = [...cells]
    .filter(([, v]) => v === 'excluded')
    .map(([n]) => n)
  const drawing = !!round && !round.done

  const toggleCell = (n: number) => {
    if (drawing) return
    const cur = cells.get(n)
    let next: CellState | null =
      cur === 'fixed' ? 'excluded' : cur === 'excluded' ? null : 'fixed'
    let h: typeof hint = null
    if (next === 'fixed' && fixed.length >= MAX_FIXED) {
      next = 'excluded'
      h = {
        text: fill(copy.random.board.maxFixed, { max: MAX_FIXED, n }),
        bad: true,
      }
    }
    if (next === 'excluded' && excluded.length >= MAX_EXCLUDED) {
      next = null
      h = {
        text: fill(copy.random.board.maxExcluded, { max: MAX_EXCLUDED }),
        bad: true,
      }
    }
    const map = new Map(cells)
    if (next) map.set(n, next)
    else map.delete(n)
    setCells(map)
    setHint(h)
  }

  const doDraw = () => {
    if (drawing) return
    const sky = skyRef.current
    if (round?.done) setHistory((hs) => [round.games, ...hs].slice(0, 8))
    const list = Array.from({ length: games }, () =>
      drawRandom({ fixed, excluded })
    )
    /* 좁은 화면: 판을 접어 하늘을 보여 준다 */
    if (!matchMedia('(width >= 900px)').matches) setBoardOpen(false)
    if (!sky || reducedRef.current) {
      setRound({ games: list, shown: list.map(() => 6), done: true })
      return
    }
    setRound({ games: list, shown: list.map(() => 0), done: false })
    sky.dropRandom(
      list,
      (gi) =>
        setRound((r) =>
          r && r.games === list
            ? { ...r, shown: r.shown.map((v, i) => (i === gi ? v + 1 : v)) }
            : r
        ),
      () => setRound((r) => (r && r.games === list ? { ...r, done: true } : r))
    )
  }

  /* ── 복사 ── */
  const [copied, setCopied] = useState<string | null>(null)
  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
    } catch {
      setCopied(`${key}:fail`)
    }
    setTimeout(() => setCopied(null), 1400)
  }

  /* ── 하늘 머리글 ── */
  const o = draw?.orbit
  let skyName: ReactNode = null
  let skySource: ReactNode = null
  if (mode === 'random') {
    skyName = copy.sky.random
    skySource = copy.sky.randomSource
  } else if (view === 'gate' || !draw) {
    if (today) {
      skyName = (
        <>
          {fill(copy.sky.today, { day: dayName(copy, saju, today.day) })}
          <span className={s.hanja}>{pillarHanja(today.day)}</span>
        </>
      )
      skySource = rich(
        copy.sky.todayStart.map((p) =>
          typeof p === 'string'
            ? p
            : { b: fill(p.b, { n: startCell(today.day) }) }
        )
      )
    }
  } else {
    skyName = (
      <>
        {fill(copy.sky.constellation, { day: dayName(copy, saju, draw.today) })}
        <span className={s.hanja}>{pillarHanja(draw.today)}</span>
      </>
    )
    skySource = (
      <>
        <span className="min-[700px]:hidden">
          {compose(copy.sky.sourceShort, {
            chart: b(chartText(saju, draw.chart)),
          })}
        </span>
        <span className="hidden min-[700px]:inline">
          {compose(copy.sky.source, { chart: b(chartText(saju, draw.chart)) })}
        </span>
      </>
    )
  }

  const sceneView = mode === 'random' ? 'random' : view

  return (
    <div className={s.root}>
      {/* 페이지 틀을 화면 높이에 고정한다(globals.css의 fit-viewport) */}
      <span className="fit-viewport" aria-hidden="true" />
      <div ref={bgRef} className={s.bg} aria-hidden="true" />

      <TopBand copy={copy} mode={mode} onMode={changeMode} />

      <div
        ref={sceneRef}
        className={s.scene}
        data-view={sceneView}
        data-open={String(boardOpen)}
      >
        <div className={s.head}>
          <p
            className={s.cname}
            data-dim={String(mode === 'fortune' && view === 'walk' && !reveal)}
            data-reveal={String(reveal)}
          >
            {skyName}
          </p>
          <p className={s.src}>{skySource}</p>
        </div>
        <div ref={hostRef} className={s.fieldWrap} />
        {mode === 'random' && (
          <Board
            copy={copy}
            cells={cells}
            open={boardOpen}
            onOpen={setBoardOpen}
            onCell={toggleCell}
            hint={hint}
            fixed={fixed.length}
            excluded={excluded.length}
          />
        )}
      </div>

      <div
        data-lotto-bands
        className="relative z-[3] grid flex-none border-t border-white/7 bg-linear-to-b from-[rgb(5_7_14/0.5)] to-[rgb(5_7_14/0.82)]"
      >
        {mode === 'random' ? (
          <RandomBand
            copy={copy}
            games={games}
            onGames={setGames}
            round={round}
            history={history}
            onDraw={doDraw}
            drawing={drawing}
            copied={copied}
            onCopy={() =>
              round?.done
                ? copyText(
                    'all',
                    round.games
                      .map(
                        (g, i) =>
                          `${GAME_LABELS[i]} ${g.numbers.map(pad2).join(' ')}`
                      )
                      .join('\n')
                  )
                : setHint({ text: copy.random.drawFirst, bad: false })
            }
          />
        ) : view === 'gate' ? (
          <GateBand
            copy={copy}
            locale={locale}
            onRandom={() => changeMode('random')}
          />
        ) : (
          draw &&
          o && (
            <>
              <WalkBand
                copy={copy}
                hidden={view !== 'walk'}
                landed={landed}
                caption={caption}
                onSkip={skip}
              />
              <ResultBand
                copy={copy}
                saju={saju}
                locale={locale}
                draw={draw}
                drawDay={drawDay}
                hidden={view !== 'result'}
                selected={selected}
                onSelect={(n) => setSelected((cur) => (cur === n ? null : n))}
                onReplay={() => startWalk(draw)}
                onRandom={() => changeMode('random')}
                copied={copied}
                onCopy={() =>
                  copyText(
                    'picks',
                    fill(copy.result.copyText, {
                      m: draw.date.m,
                      d: draw.date.d,
                      day: dayName(copy, saju, draw.today),
                      numbers: o.numbers.map(pad2).join(' '),
                    })
                  )
                }
              />
            </>
          )
        )}
      </div>
    </div>
  )
}

/* ─── 걸음 자막 ──────────────────────────────────────────────── */
function moveCaption(copy: LottoCopy, saju: SajuCopy, m: Move): ReactNode[] {
  const head = [
    <span key="h" className="swap">
      <b className="text-[22px] leading-none font-bold text-ink">
        {hanjaOf(m)}
      </b>
    </span>,
    <span key="l" className="swap">
      {b(`${moveLabel(copy, m)} ${charOf(saju, m)}`)} · {saju.elements[m.el]}
    </span>,
  ]
  if (!m.land)
    return [
      ...head,
      <span key="st" className="swap">
        {fill(copy.walk.hourSteps, { n: m.steps })}
      </span>,
    ]
  return [
    ...head,
    <span key="st" className="swap">
      {compose(copy.walk.steps, {
        expr: (
          <span className="font-mono font-semibold text-ink">
            {m.value}+{m.plus}={m.steps}
          </span>
        ),
      })}
    </span>,
    <span key="rd" className="swap">
      {fill(copy.walk.relDir, {
        rel: copy.walk.relations[m.rel],
        dir: copy.walk.directions[m.dir > 0 ? 'up' : 'down'],
      })}
    </span>,
  ]
}

/* ─── 위 띠: 모드와 계산 방식 ─────────────────────────────────── */
function TopBand({
  copy,
  mode,
  onMode,
}: {
  copy: LottoCopy
  mode: Mode
  onMode: (m: Mode) => void
}) {
  const [rules, setRules] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, rules, () => setRules(false))
  const method = copy.method[mode]
  return (
    <div
      ref={ref}
      className="relative z-[5] flex flex-none items-center gap-x-[18px] gap-y-3 border-b border-white/6 px-4 py-2.5 sm:px-7 sm:py-3"
    >
      <div role="group" aria-label={copy.modesLabel} className={SEG}>
        {(['fortune', 'random'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => onMode(m)}
            className={`h-[34px] ${SEG_ITEM} ${segState(mode === m)}`}
          >
            {copy.modes[m]}
          </button>
        ))}
      </div>
      <p className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-3 min-[900px]:block">
        <b className="mr-2 font-[750] text-ink-2">{method.title}</b>
        <span>{method.text}</span>
      </p>
      {mode === 'fortune' && (
        <button
          type="button"
          aria-expanded={rules}
          aria-controls="lotto-rules"
          onClick={() => setRules(!rules)}
          className={`ml-auto ${LINK}`}
        >
          {copy.rules.button}
        </button>
      )}
      {rules && mode === 'fortune' && (
        <div
          id="lotto-rules"
          className="absolute top-[calc(100%-1px)] right-3 left-3 z-20 ml-auto grid max-w-[560px] animate-menu-in gap-3 border border-line-strong bg-[#070910] px-5 pt-[18px] pb-5 text-[13.5px] leading-[1.6] text-ink-2 sm:right-7"
        >
          <p>{rich(copy.rules.intro)}</p>
          <ol className="grid list-decimal gap-1.5 pl-5">
            {copy.rules.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p>{copy.rules.outro}</p>
        </div>
      )}
    </div>
  )
}

/** 바깥을 누르거나 Esc를 치면 닫는다 */
function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void
) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, close])
}

/* ─── 안내: 넘겨받은 원국이 없을 때 ─────────────────────────────── */
function GateBand({
  copy,
  locale,
  onRandom,
}: {
  copy: LottoCopy
  locale: Locale
  onRandom: () => void
}) {
  return (
    <div className="grid animate-rise-in gap-2.5 px-4 pt-3.5 pb-4 motion-reduce:animate-none min-[700px]:grid-cols-[minmax(0,1fr)_auto] min-[700px]:items-end min-[700px]:gap-x-10 sm:px-7 sm:pt-[18px] sm:pb-5">
      <div className="grid gap-2">
        <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">
          {copy.gate.label}
        </span>
        <p className="text-[clamp(20px,1.4vw+12px,34px)] leading-[1.3] font-[750] tracking-[-0.035em] break-keep text-ink">
          {copy.gate.title}
        </p>
        <p className="max-w-[40em] text-[13px] leading-[1.55] break-keep text-ink-2 sm:text-sm sm:leading-[1.6]">
          {copy.gate.aside}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <Link
          id="to-fortune"
          href={gamePath(locale, 'fortune')}
          prefetch={true}
          transitionTypes={[NAV_FORWARD]}
          className={`h-11 ${BTN_PRIMARY}`}
        >
          {copy.gate.toFortune}
          <span aria-hidden="true" className="font-mono text-xs opacity-70">
            →
          </span>
        </Link>
        <button type="button" onClick={onRandom} className={LINK}>
          {copy.gate.toRandom}
          <span aria-hidden="true" className="font-mono">
            →
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─── 걷기 ───────────────────────────────────────────────────── */
function WalkBand({
  copy,
  hidden,
  landed,
  caption,
  onSkip,
}: {
  copy: LottoCopy
  hidden: boolean
  landed: Landed[]
  caption: ReactNode[]
  onSkip: () => void
}) {
  return (
    <div
      aria-hidden={hidden}
      className={`col-start-1 row-start-1 grid grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-4 gap-y-2.5 px-4 py-3 [grid-template-areas:'slots_skip'_'cap_cap'] min-[700px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[700px]:gap-x-7 min-[700px]:px-7 min-[700px]:py-4 min-[700px]:[grid-template-areas:'slots_cap_skip'] ${hidden ? 'invisible' : ''}`}
    >
      <div
        data-walk-slots
        className="flex gap-1.5 [grid-area:slots] min-[700px]:gap-2"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }, (_, i) =>
          landed[i] ? (
            <FlyBall key={landed[i].n} n={landed[i].n} from={landed[i].from} />
          ) : (
            <span
              key={`slot${i}`}
              className="size-[30px] flex-none rounded-full shadow-[inset_0_0_0_1px_var(--color-line-strong)] min-[700px]:size-10"
            />
          )
        )}
      </div>
      <p
        aria-live="polite"
        className="flex min-h-[3.1em] flex-wrap content-center items-baseline gap-x-2 gap-y-0.5 text-sm leading-[1.5] text-ink-2 [grid-area:cap] *:whitespace-nowrap min-[700px]:min-h-0 min-[700px]:justify-center min-[700px]:text-center min-[700px]:text-[15px] [&_.swap]:animate-rise-in motion-reduce:[&_.swap]:animate-none"
      >
        {caption}
      </p>
      <button
        type="button"
        data-lotto-skip
        onClick={onSkip}
        tabIndex={hidden ? -1 : 0}
        className={`[grid-area:skip] ${BTN}`}
      >
        {copy.walk.skip}
        <span
          aria-hidden="true"
          className="hidden font-mono text-xs opacity-70 min-[700px]:inline"
        >
          Enter
        </span>
      </button>
    </div>
  )
}

/** 별에서 공 자리로 날아와 앉는 공 */
function FlyBall({ n, from }: { n: number; from: DOMRect | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !from || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const to = el.getBoundingClientRect()
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
        {
          transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 40}px) scale(0.75)`,
          opacity: 1,
          offset: 0.45,
        },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 720, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)' }
    )
  }, [from])
  return (
    <Ball
      ref={ref}
      n={n}
      dataKey={n}
      className="size-[30px] text-xs shadow-[0_0_18px_rgb(200_215_255/0.28)] min-[700px]:size-10 min-[700px]:text-base"
    />
  )
}

/* ─── 결과 ───────────────────────────────────────────────────── */
function ResultBand({
  copy,
  saju,
  locale,
  draw: d,
  drawDay,
  hidden,
  selected,
  onSelect,
  onReplay,
  onRandom,
  copied,
  onCopy,
}: {
  copy: LottoCopy
  saju: SajuCopy
  locale: Locale
  draw: LuckyDraw
  drawDay: ReturnType<typeof nextDraw> | null
  hidden: boolean
  selected: number | null
  onSelect: (n: number) => void
  onReplay: () => void
  onRandom: () => void
  copied: string | null
  onCopy: () => void
}) {
  const r = copy.result
  const o = d.orbit
  const [notes, setNotes] = useState(false)
  /* 걷기가 끝나 결과가 드러나면, 공이 내려앉은 순서의 자리에서 오름차순 자리로 미끄러져 온다 */
  const picksRef = useRef<HTMLDivElement>(null)
  const wasHidden = useRef(hidden)
  useLayoutEffect(() => {
    const was = wasHidden.current
    wasHidden.current = hidden
    const box = picksRef.current
    if (hidden || !was || !box) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const band = box.closest('[data-lotto-bands]')
    for (const pick of Array.from(box.children) as HTMLElement[]) {
      const n = pick.dataset.n
      const from = band?.querySelector(`[data-walk-slots] [data-key="${n}"]`)
      if (!from) continue
      const a = from.getBoundingClientRect()
      const b2 = pick.getBoundingClientRect()
      if (!a.width) continue
      pick.animate(
        [
          {
            transform: `translate(${a.left + a.width / 2 - (b2.left + b2.width / 2)}px, ${a.top + a.height / 2 - (b2.top + b2.height / 2)}px) scale(${a.width / b2.width})`,
          },
          { transform: 'none' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
      )
    }
  }, [hidden])
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, notes, () => setNotes(false))

  const star = (n: number) => b(fill(r.star, { n }))
  const el = (e: number) => saju.elements[e]
  const day = dayName(copy, saju, d.today)
  const pre = o.moves.filter((m) => !m.land)

  const summary = compose(r.summary, {
    day,
    start: star(o.start),
    pre: pre.length
      ? compose(r.summaryPre, {
          hour: d.chart.hour ? ganji(saju, d.chart.hour) : '',
          n: star(pre[pre.length - 1].to),
        })
      : '',
    el: el(o.gi),
    digits: HADO_DIGITS[o.gi],
  })
  const summaryShort = compose(r.summaryShort, {
    day,
    start: star(o.start),
    el: el(o.gi),
  })

  const why = (m: Move) => {
    const char = charOf(saju, m)
    const head = b(`${moveLabel(copy, m)} ${char}(${hanjaOf(m)})`)
    const vars = {
      head,
      expr: `${m.value}+${m.plus}=${m.steps}`,
      from: m.from,
      fromEl: el(m.fromEl),
      char,
      el: el(m.el),
      topic: josa(copy, el(m.el)),
      rel: copy.walk.relations[m.rel],
      dir: copy.walk.directions[m.dir > 0 ? 'up' : 'down'],
      to: star(m.to),
    }
    const long = compose(r.why, {
      ...vars,
      end: m.skipped.length
        ? compose(r.whySkip, {
            skips: m.skipped
              .map((x) =>
                fill(x.why === 'gi' ? r.skipGi : r.skipTaken, {
                  n: x.cell,
                  el: el(o.gi),
                })
              )
              .join(', '),
            to: star(m.to),
          })
        : compose(r.whyLand, { to: star(m.to) }),
    })
    const short = compose(r.whyShort, {
      ...vars,
      skips: m.skipped.length
        ? fill(r.skipShort, { list: m.skipped.map((x) => x.cell).join('·') })
        : '',
    })
    return [short, long]
  }
  const sel =
    selected == null ? null : o.moves.find((m) => m.land && m.to === selected)
  const [short, long] = sel ? why(sel) : [summaryShort, summary]

  return (
    <div
      ref={ref}
      aria-hidden={hidden}
      className={`relative col-start-1 row-start-1 ${hidden ? 'invisible' : ''}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2 px-4 py-3 [grid-template-areas:'picks'_'why'_'meta'_'acts'] min-[700px]:grid-cols-[auto_minmax(0,1fr)] min-[700px]:items-center min-[700px]:gap-x-8 min-[700px]:gap-y-3.5 min-[700px]:px-7 min-[700px]:py-4 min-[700px]:[grid-template-areas:'picks_why'_'meta_acts']">
        <div
          ref={picksRef}
          role="group"
          aria-label={r.picksLabel}
          className="flex gap-2 [grid-area:picks] min-[700px]:gap-2.5"
        >
          {o.numbers.map((n, i) => {
            const m = o.moves.find((x) => x.land && x.to === n)!
            const on = selected === n
            return (
              <button
                key={n}
                type="button"
                data-i={i}
                data-n={n}
                tabIndex={hidden ? -1 : 0}
                aria-pressed={on}
                aria-label={fill(r.pickAria, {
                  n,
                  label: moveLabel(copy, m),
                  char: charOf(saju, m),
                })}
                onClick={() => onSelect(n)}
                className={`inline-grid size-9 flex-none place-items-center rounded-full font-mono text-sm font-semibold tracking-[-0.02em] text-canvas tabular-nums transition-[translate,scale,box-shadow] duration-200 ease-out-soft active:scale-[0.92] motion-reduce:transition-none min-[700px]:size-10 min-[700px]:text-base min-[1100px]:size-11 lit:-translate-y-0.5 ${FOCUS} ${toneClass(n)} ${
                  on
                    ? '-translate-y-[3px] shadow-[0_0_0_2px_#05070e,0_0_0_3.5px_var(--color-ink),0_0_26px_rgb(200_215_255/0.5)]'
                    : 'shadow-[0_0_18px_rgb(200_215_255/0.25)]'
                }`}
              >
                {pad2(n)}
              </button>
            )
          })}
        </div>
        <p
          aria-live="polite"
          className="h-[4.65em] text-[13px] leading-[1.55] break-keep text-ink-2 [grid-area:why] min-[700px]:h-auto min-[700px]:min-h-[3.1em] min-[700px]:text-[14.5px]"
        >
          <span className="min-[1100px]:hidden">{short}</span>
          <span className="hidden min-[1100px]:inline">{long}</span>
        </p>
        <div className="grid min-w-0 gap-1 [grid-area:meta]">
          <p className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-[12.5px] leading-[1.5] text-ink-3 *:whitespace-nowrap">
            <span>{compose(r.money, { score: b(d.money) })}</span>
            <span>
              {compose(r.best, {
                name: b(saju.hours.names[d.best]),
                range: blockRange(d.best, d.shift),
              })}
            </span>
            {drawDay && (
              <span>
                {drawDay.days
                  ? compose(r.drawIn, {
                      m: drawDay.m,
                      d: drawDay.d,
                      days: b(drawDay.days),
                    })
                  : b(r.drawToday)}
              </span>
            )}
          </p>
          <p className="hidden text-xs leading-[1.5] text-ink-3 min-[1100px]:[@media(height>=760px)]:block">
            {r.notesText[0]}
          </p>
        </div>
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 [grid-area:acts] min-[700px]:justify-end min-[700px]:gap-x-5">
          <Link
            id="back"
            href={gamePath(locale, 'fortune')}
            prefetch={true}
            transitionTypes={[NAV_BACK]}
            tabIndex={hidden ? -1 : 0}
            className={LINK}
          >
            <span aria-hidden="true" className="font-mono">
              ←
            </span>
            {r.back}
          </Link>
          <button
            type="button"
            onClick={onReplay}
            tabIndex={hidden ? -1 : 0}
            className={LINK}
          >
            {r.replay}
          </button>
          <button
            type="button"
            onClick={onRandom}
            tabIndex={hidden ? -1 : 0}
            className={`max-[1099px]:hidden ${LINK}`}
          >
            {r.toRandom}
            <span aria-hidden="true" className="font-mono">
              →
            </span>
          </button>
          <button
            type="button"
            aria-expanded={notes}
            aria-controls="lotto-notes"
            onClick={() => setNotes(!notes)}
            tabIndex={hidden ? -1 : 0}
            className={LINK}
          >
            {r.notes}
          </button>
          <button
            type="button"
            onClick={onCopy}
            tabIndex={hidden ? -1 : 0}
            className={`h-[34px] px-3 min-[700px]:h-[38px] min-[700px]:px-4 ${BTN}`}
          >
            {copied === 'picks'
              ? r.copied
              : copied === 'picks:fail'
                ? r.copyFailed
                : r.copy}
          </button>
        </span>
      </div>
      {notes && (
        <div
          id="lotto-notes"
          className="absolute right-3 bottom-[calc(100%+8px)] left-3 z-10 ml-auto grid max-w-[460px] animate-menu-in gap-2 border border-line-strong bg-[#070910] px-4 py-3.5 text-[12.5px] leading-[1.55] break-keep text-ink-2 sm:right-7"
        >
          {r.notesText.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── 그냥 뽑기 ──────────────────────────────────────────────── */
function Board({
  copy,
  cells,
  open,
  onOpen,
  onCell,
  hint,
  fixed,
  excluded,
}: {
  copy: LottoCopy
  cells: Map<number, CellState>
  open: boolean
  onOpen: (open: boolean) => void
  onCell: (n: number) => void
  hint: { text: ReactNode; bad: boolean } | null
  fixed: number
  excluded: number
}) {
  const bd = copy.random.board
  return (
    <div
      className={s.board}
      data-open={String(open)}
      aria-label={bd.label}
      role="group"
    >
      <div className="flex flex-none items-center gap-3">
        {open && (
          <span className="font-mono text-[11.5px] font-medium whitespace-nowrap text-ink-2">
            {fill(bd.count, { fixed, excluded })}
          </span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="lotto-board"
          onClick={() => onOpen(!open)}
          className={`ml-auto h-[22px] ${LINK}`}
        >
          {open ? bd.fold : bd.open}
        </button>
      </div>
      {open && (
        <>
          <div id="lotto-board" className={s.grid}>
            {Array.from({ length: TOTAL }, (_, i) => {
              const n = i + 1
              const st = cells.get(n)
              return (
                <button
                  key={n}
                  type="button"
                  className={s.cell}
                  data-n={n}
                  data-state={st}
                  aria-label={fill(
                    st === 'fixed'
                      ? bd.cellFixed
                      : st === 'excluded'
                        ? bd.cellExcluded
                        : bd.cell,
                    { n }
                  )}
                  onClick={() => onCell(n)}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <p
            aria-live="polite"
            className={`flex-none text-xs leading-[1.45] ${hint?.bad ? 'text-warn' : 'text-ink-3'}`}
          >
            {hint
              ? hint.text
              : compose(bd.hint, {
                  fix: (
                    <i
                      aria-hidden="true"
                      className={`${s.glyph} ${s.glyphFix}`}
                    />
                  ),
                  skip: (
                    <i
                      aria-hidden="true"
                      className={`${s.glyph} ${s.glyphSkip}`}
                    />
                  ),
                })}
          </p>
        </>
      )}
    </div>
  )
}

function RandomBand({
  copy,
  games,
  onGames,
  round,
  history,
  onDraw,
  drawing,
  copied,
  onCopy,
}: {
  copy: LottoCopy
  games: number
  onGames: (n: number) => void
  round: Round | null
  history: Game[][]
  onDraw: () => void
  drawing: boolean
  copied: string | null
  onCopy: () => void
}) {
  const r = copy.random
  return (
    <div className="grid animate-rise-in gap-2 px-4 pt-2.5 pb-3 [grid-template-areas:'ctl'_'tk'_'foot'] motion-reduce:animate-none min-[900px]:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)] min-[900px]:content-start min-[900px]:gap-x-8 min-[900px]:gap-y-2.5 min-[900px]:px-7 min-[900px]:py-3.5 min-[900px]:[grid-template-areas:'ctl_tk'_'foot_tk']">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 [grid-area:ctl]">
        <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase max-[420px]:hidden">
          {r.games}
        </span>
        <div role="group" aria-label={r.games} id="games" className={SEG}>
          {Array.from({ length: MAX_GAMES }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              data-n={n}
              aria-pressed={games === n}
              onClick={() => onGames(n)}
              className={`h-8 px-[11px] ${SEG_ITEM} ${segState(games === n)}`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          id="draw"
          type="button"
          onClick={onDraw}
          disabled={drawing}
          className={`${BTN_PRIMARY} disabled:opacity-60`}
        >
          {r.draw}
        </button>
      </div>
      <div className="relative h-[clamp(40px,calc((100dvh-500px)*0.5),200px)] overflow-clip [grid-area:tk]">
        <div
          aria-live="polite"
          className="grid h-full [scrollbar-width:thin] content-start gap-1 overflow-y-auto overscroll-contain"
        >
          {round ? (
            round.games.map((g, gi) => (
              <Ticket
                key={`${gi}-${g.order.join('.')}`}
                label={GAME_LABELS[gi]}
                aria={fill(r.gameAria, { label: GAME_LABELS[gi] })}
                color={GAME_COLORS[gi]}
                numbers={round.done ? g.numbers : g.order}
                shown={round.done ? 6 : round.shown[gi]}
                fixed={g.fixed}
              />
            ))
          ) : (
            <p className="text-[13px] leading-[1.55] break-keep text-ink-3">
              {fill(r.empty, { n: games })}
            </p>
          )}
          {history.length > 0 && (
            <>
              <p className="mt-2 font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">
                {r.past}
              </p>
              {history.map((h, hi) =>
                h.map((g, gi) => (
                  <Ticket
                    key={`h${hi}-${gi}`}
                    label={GAME_LABELS[gi]}
                    aria={fill(r.gameAria, { label: GAME_LABELS[gi] })}
                    numbers={g.numbers}
                    shown={6}
                    fixed={[]}
                    past
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-4 gap-y-1.5 [grid-area:foot] min-[900px]:flex-col min-[900px]:items-start">
        <p className="text-[11.5px] leading-[1.5] break-keep text-ink-3 min-[900px]:text-xs">
          {r.note}
        </p>
        <button
          id="copy-all"
          type="button"
          onClick={onCopy}
          className={`flex-none ${LINK}`}
        >
          {copied === 'all'
            ? copy.result.copied
            : copied === 'all:fail'
              ? copy.result.copyFailed
              : r.copyAll}
        </button>
      </div>
    </div>
  )
}

/** 게임 한 줄. 뽑는 동안은 뽑힌 순서로, 다 뽑으면 오름차순으로 자리를 바꾼다. */
function Ticket({
  label,
  aria,
  color,
  numbers,
  shown,
  fixed,
  past = false,
}: {
  label: string
  aria: string
  color?: string
  numbers: number[]
  shown: number
  fixed: number[]
  past?: boolean
}) {
  const row = useRef<HTMLSpanElement>(null)
  useFlip(row)
  return (
    <div
      className={`ticket flex items-center gap-2.5 ${past ? 'min-h-[30px]' : 'min-h-9'}`}
      aria-label={aria}
      role="group"
    >
      <span
        className="inline-flex w-[30px] items-center gap-1.5 font-mono text-[13px] font-semibold before:h-0.5 before:w-2.5 before:bg-current"
        style={{ color: past ? 'var(--color-ink-3)' : color }}
      >
        {label}
      </span>
      <span ref={row} className="flex gap-1.5">
        {numbers.map((n, j) =>
          j < shown ? (
            <Ball
              key={n}
              n={n}
              dataKey={n}
              className={`${past ? 'size-6 text-[10px] opacity-70' : 'size-[30px] text-xs'} ${
                fixed.includes(n)
                  ? 'shadow-[0_0_0_2px_#05070e,0_0_0_3px_var(--color-ink-2)]'
                  : ''
              } ${!past ? 'animate-rise-in motion-reduce:animate-none' : ''}`}
            />
          ) : (
            <span
              key={`s${j}`}
              className="size-[30px] flex-none rounded-full shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
            />
          )
        )}
      </span>
    </div>
  )
}

/** 자식의 자리가 바뀌면 이전 자리에서 미끄러져 오게 한다(data-key로 짝짓는다) */
function useFlip(ref: RefObject<HTMLElement | null>) {
  const last = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const now = new Map<string, number>()
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const c of Array.from(el.children) as HTMLElement[]) {
      const key = c.dataset.key
      if (!key) continue
      const x = c.getBoundingClientRect().left
      now.set(key, x)
      const was = last.current.get(key)
      if (was != null && was !== x && !reduce)
        c.animate(
          [{ transform: `translateX(${was - x}px)` }, { transform: 'none' }],
          { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        )
    }
    last.current = now
  })
}
