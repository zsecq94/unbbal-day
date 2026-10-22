'use client'

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DIRECTION_CODES,
  signIndex,
  zodiacIndex,
  type DomainKey,
  type Fortune,
  type Profile,
} from '@/lib/fortune'
import type { Locale } from '@/lib/i18n'
import { Tween, type FortuneCopy } from './fortune-screen'
import {
  blockClock,
  blockLabel,
  dayMaster,
  fill,
  ganji,
  particle,
  pillarWords,
  reasonText,
  useReducedMotion,
} from './shared'

type NoteId = `k${1 | 2 | 3 | 4 | 5}` | `d:${'all' | DomainKey}`

/**
 * 결과 등장 순서(ms). 빛줄기가 훑고 점수가 오르는 동안 문단이 낱말 단위로 떠오르고,
 * 이어서 분야 막대가 하나씩 차오른 뒤 각주 띠가 올라온다.
 */
const REVEAL = {
  score: 1000,
  words: 180,
  perWord: 42,
  afterWords: 160,
  perTrack: 90,
}
const DOMAIN_ORDER: ('all' | DomainKey)[] = [
  'all',
  'money',
  'love',
  'health',
  'work',
  'rel',
]

/**
 * 결과: 각주가 달린 한 문단과 여섯 분야 트랙. 밑줄 친 말이나 트랙을 짚으면
 * 아래 각주 띠에 그 뜻이 열리고, 누르면 고정된다.
 */
export function FortuneResult({
  copy,
  locale,
  profile: p,
  fortune: f,
  onEdit,
}: {
  copy: FortuneCopy
  locale: Locale
  profile: Profile
  fortune: Fortune
  onEdit: () => void
}) {
  const reduced = useReducedMotion()
  const [pinned, setPinned] = useState<NoteId>('k1')
  const [shown, setShown] = useState<NoteId>('k1')
  const [hotHour, setHotHour] = useState<number | null>(null)
  const answerRef = useRef<HTMLParagraphElement>(null)

  const name = (key: 'all' | DomainKey) => copy.domains[key]
  const domain = (key: DomainKey) => f.domains.find((d) => d.key === key)!
  const score = (key: 'all' | DomainKey) =>
    key === 'all' ? f.total : domain(key).score
  const pickText = <T,>(arr: T[], i: number) => arr[i % arr.length]
  const headline = pickText(
    copy.content.headlines[f.tenGod][f.tone],
    f.headline
  )
  /* 오늘의 근거: 일진과 그 천간이 일간에게 갖는 십성 */
  const basis = fill(copy.basis, {
    day: ganji(copy, f.today),
    dm: dayMaster(copy, f.chart),
    god: copy.tenGods[f.tenGod],
  })
  const who = p.name.trim() ? fill(copy.who, { name: p.name.trim() }) : ''
  const direction = fill(copy.direction, {
    name: copy.directions[f.direction],
  })

  /* 문단: 템플릿의 {headline} {time} {top} {low} {direction}이 각주 1–5가 된다 */
  const KW: Record<string, [NoteId, string]> = {
    headline: ['k1', headline],
    time: ['k2', blockLabel(copy, f.best, f.shift)],
    top: ['k3', name(f.top)],
    low: ['k4', name(f.low)],
    direction: ['k5', direction],
  }
  const vars: Record<string, string> = {
    who,
    lowParticle: particle(copy, name(f.low)),
  }
  const answer: ReactNode[] = []
  /* 낱말마다 등장 시각을 하나씩 늦춘다. 밑줄 친 말은 한 덩어리로 떠오른다. */
  let unit = 0
  const appear = (node: ReactNode, key: string) => (
    <span
      key={key}
      className="animate-word-in motion-reduce:animate-none"
      style={{ animationDelay: `${REVEAL.words + unit++ * REVEAL.perWord}ms` }}
    >
      {node}
    </span>
  )
  const pushText = (text: string) =>
    text.split(/(\s+)/).forEach((part, i) => {
      if (!part) return
      answer.push(/^\s+$/.test(part) ? part : appear(part, `w${unit}-${i}`))
    })
  const re = /\{(\w+)\}/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(copy.answer))) {
    if (m.index > last) pushText(copy.answer.slice(last, m.index))
    const kw = KW[m[1]]
    if (kw) {
      const [id, text] = kw
      answer.push(
        appear(
          <Keyword
            key={id}
            id={id}
            text={text}
            n={id.slice(1)}
            pinned={pinned === id}
            hot={shown === id}
            onEnter={() => setShown(id)}
            onLeave={() => setShown(pinned)}
            onPin={() => {
              setPinned(id)
              setShown(id)
            }}
          />,
          id
        )
      )
    } else pushText(vars[m[1]] ?? '')
    last = m.index + m[0].length
  }
  if (last < copy.answer.length) pushText(copy.answer.slice(last))
  const tracksAt = REVEAL.words + unit * REVEAL.perWord + REVEAL.afterWords
  const noteAt = tracksAt + DOMAIN_ORDER.length * REVEAL.perTrack

  /* 문단이 남는 높이에 꼭 맞게 글자 크기를 잡는다 */
  useLayoutEffect(() => {
    const el = answerRef.current
    if (!el) return
    const fit = () => {
      let lo = 16
      let hi = 92
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2)
        el.style.fontSize = `${mid}px`
        if (el.scrollHeight <= el.clientHeight + 1) lo = mid
        else hi = mid
      }
      el.style.fontSize = `${lo}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    document.fonts.ready.then(fit)
    return () => ro.disconnect()
  }, [answer.length, locale])

  /* 대기 효과: 밑줄 하나씩 빛이 스치며 살아 있음을 알린다 */
  useEffect(() => {
    if (reduced) return
    let at = 0
    const timer = setInterval(() => {
      const root = answerRef.current
      if (!root || root.matches(':hover')) return
      const kws = root.querySelectorAll<HTMLElement>('[data-kw]')
      const el = kws[at++ % kws.length]
      if (!el) return
      el.classList.remove('animate-sweep')
      void el.offsetWidth
      el.classList.add('animate-sweep')
    }, 2600)
    return () => clearInterval(timer)
  }, [reduced])

  const note = noteFor(shown)
  function noteFor(id: NoteId): {
    idx: string
    hl: string
    title: string
    sub: string
    text: string
    viz?: ReactNode
  } {
    const dom = (key: 'all' | DomainKey, idx: string, sub: string) => {
      if (key === 'all')
        return {
          idx,
          hl: 'all',
          title: `${name('all')} ${f.total}`,
          sub: basis,
          text: pickText(copy.content.summaries[f.tenGod], f.summary),
        }
      const d = domain(key)
      const line = pickText(copy.content.lines[key][d.level], d.line)
      const advice = pickText(copy.content.advice[key][d.level], d.advice)
      const why = reasonText(copy, d.reason)
      return {
        idx,
        hl: key,
        title: `${name(key)} ${d.score}`,
        sub: sub ? `${sub} · ${why}` : why,
        text: fill(copy.notes.advice, { line, ...advice }),
        viz: (
          <div className="grid h-full content-center gap-1.5 text-[13px] leading-[1.4] text-ink-2">
            <span>
              <b className="mr-2 font-mono text-[10px] font-medium tracking-[0.1em] text-ink-3">
                {copy.notes.do}
              </b>
              {advice.do}
            </span>
            <span>
              <b className="mr-2 font-mono text-[10px] font-medium tracking-[0.1em] text-ink-3">
                {copy.notes.dont}
              </b>
              {advice.dont}
            </span>
          </div>
        ),
      }
    }
    if (id.startsWith('d:')) {
      const key = id.slice(2) as 'all' | DomainKey
      const sub =
        key === f.top ? copy.notes.top : key === f.low ? copy.notes.low : ''
      return dom(key, String(DOMAIN_ORDER.indexOf(key) + 1), sub)
    }
    switch (id) {
      case 'k1':
        return dom('all', '1', '')
      case 'k3':
        return dom(f.top, '3', copy.notes.top)
      case 'k4':
        return dom(f.low, '4', copy.notes.low)
      case 'k5':
        return {
          idx: '5',
          hl: '',
          title: direction,
          sub: copy.notes.direction,
          text: fill(copy.notes.directionText, {
            stem: copy.stems[f.today.stem],
          }),
          viz: <Compass code={DIRECTION_CODES[f.direction]} />,
        }
      default: {
        const i = hotHour ?? f.best
        return {
          idx: '2',
          hl: '',
          title: blockLabel(copy, i, f.shift),
          sub:
            hotHour === null
              ? copy.notes.bestTime
              : fill(copy.notes.points, { n: f.hours[i] }),
          text:
            pickText(copy.content.hourNotes, i) +
            (hotHour === null ? ` ${copy.notes.scrub}` : ''),
          viz: (
            <Hours
              hours={f.hours}
              best={f.best}
              shift={f.shift}
              hot={hotHour}
              onHot={setHotHour}
            />
          ),
        }
      }
    }
  }

  /* 사주 네 기둥 · 띠 · 별자리 · 정확도. 줄은 기둥 사이나 가운뎃점 뒤에서만 갈린다. */
  const whoLine = [
    ...pillarWords(copy, f.chart).map((w, i) => [i > 0 ? ' ' : '', w]),
    ...[
      copy.zodiac[zodiacIndex(+p.year, f.chart)],
      copy.signs[signIndex(f.birth.m, f.birth.d)],
      fill(copy.whoLine.accuracy, { n: f.accuracy }),
    ].map((w) => ['\u00a0· ', w]),
  ].map(([gap, w], i) => (
    <Fragment key={i}>
      {gap}
      <span className="whitespace-nowrap">{w}</span>
    </Fragment>
  ))

  return (
    <div className="@container relative flex min-h-0 flex-1 flex-col gap-3.5 px-5 pt-[18px] pb-5 motion-reduce:animate-none sm:gap-5 sm:px-7 sm:pt-[26px] sm:pb-7 xl:px-[clamp(28px,4vw,72px)] xl:py-8">
      {/* 페이지 틀을 화면 높이에 고정한다(globals.css의 fit-viewport) */}
      <span className="fit-viewport" aria-hidden="true" />
      {/* 등장할 때 빛줄기가 위에서 아래로 한 번 훑는다 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-scan bg-no-repeat motion-reduce:hidden"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, transparent, rgb(79 134 255 / 0.1) 45%, rgb(79 134 255 / 0.22) 50%, rgb(79 134 255 / 0.1) 55%, transparent)',
          backgroundSize: '100% 38%',
        }}
      />
      <div className="flex flex-none animate-rise-in flex-wrap items-center gap-x-5 gap-y-1.5 motion-reduce:animate-none">
        <p className="flex items-baseline gap-2.5">
          <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">
            {copy.total}
          </span>
          <b
            className="animate-score-flash font-mono text-[clamp(34px,2.6vw+18px,60px)] leading-none font-medium tracking-[-0.05em] tabular-nums motion-reduce:animate-none"
            style={{ animationDelay: `${REVEAL.score}ms` }}
          >
            <Tween value={f.total} ms={REVEAL.score} />
          </b>
          <span className="font-mono text-[13px] text-ink-3">/100</span>
        </p>
        <p className="order-3 w-full text-[13px] font-semibold break-keep text-ink-3 md:order-0 md:w-auto">
          {whoLine}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto inline-flex items-center gap-2 text-[13px] font-bold text-ink-2 transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none lit:text-ink"
        >
          <span aria-hidden="true" className="font-mono font-medium">
            ←
          </span>
          {copy.edit}
        </button>
      </div>

      <p
        ref={answerRef}
        lang={locale}
        tabIndex={-1}
        data-fortune-answer
        className="min-h-0 flex-1 [background-clip:content-box] pt-3.5 text-[30px] leading-[1.6] font-bold tracking-[-0.035em] break-keep text-ink-2 outline-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0 calc(1lh - 1px), rgb(255 255 255 / 0.04) calc(1lh - 1px) 1lh)',
          backgroundPosition: '0 14px',
        }}
      >
        {answer}
      </p>

      <div
        role="group"
        aria-label={copy.domainsLabel}
        className="grid flex-none grid-cols-3 gap-x-3 gap-y-1 border-t border-line-strong pt-3.5 sm:grid-cols-6 sm:gap-3.5"
      >
        {DOMAIN_ORDER.map((key, i) => {
          const id: NoteId = `d:${key}`
          const hl = note.hl === key
          const on = pinned === id
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onPointerEnter={() => setShown(id)}
              onPointerLeave={() => setShown(pinned)}
              onFocus={() => setShown(id)}
              onBlur={() => setShown(pinned)}
              onClick={() => {
                setPinned(id)
                setShown(id)
              }}
              className={`grid grid-cols-[auto_auto] justify-between gap-y-2 pt-0.5 pb-1 text-left text-xs font-bold transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none sm:text-[13px] lit:text-ink ${
                hl || on ? 'text-ink' : 'text-ink-3'
              }`}
            >
              <span>{name(key)}</span>
              <b
                className={`font-mono text-xs font-medium tabular-nums ${hl || on ? 'text-ink' : 'text-ink-2'}`}
              >
                {score(key)}
              </b>
              <i
                aria-hidden="true"
                className="col-span-full h-0.5 bg-[length:calc(var(--v)*1%)_100%,100%_1px] bg-position-[0_0,0_50%] bg-no-repeat transition-[background-size] duration-700 ease-out-soft motion-reduce:transition-none starting:bg-[length:0_100%,100%_1px]"
                style={{
                  ['--v' as string]: score(key),
                  transitionDelay: `${tracksAt + i * REVEAL.perTrack}ms`,
                  backgroundImage: `linear-gradient(${hl || on ? 'var(--color-brand-hi), var(--color-brand-hi)' : 'var(--color-ink-2), var(--color-ink-2)'}), linear-gradient(var(--color-line-strong), var(--color-line-strong))`,
                }}
              />
            </button>
          )
        })}
      </div>

      <div
        aria-live="polite"
        style={{ animationDelay: `${noteAt}ms` }}
        className="grid h-[104px] flex-none animate-rise-in grid-cols-[28px_minmax(0,1fr)] grid-rows-[22px_auto] content-start gap-x-3.5 gap-y-2 border-t border-line pt-3 motion-reduce:animate-none @[760px]:h-24 @[760px]:grid-cols-[28px_minmax(0,1fr)_minmax(260px,36%)] @[760px]:gap-x-[18px]"
      >
        <span className="grid h-[22px] w-7 place-items-center border border-line-strong font-mono text-xs font-medium text-brand-hi">
          {note.idx}
        </span>
        <p className="flex min-w-0 items-baseline gap-2.5 text-[15px] leading-[22px] whitespace-nowrap">
          <b className="font-[750]">{note.title}</b>
          <span className="overflow-hidden text-sm font-semibold text-ellipsis text-ink-3">
            {note.sub}
          </span>
        </p>
        <div className="hidden min-w-0 @[760px]:col-start-3 @[760px]:row-span-2 @[760px]:row-start-1 @[760px]:block @[760px]:h-16 @[760px]:self-start">
          {note.viz}
        </div>
        <p className="col-span-full text-sm leading-[1.5] break-keep text-ink-2 @[760px]:col-span-1 @[760px]:col-start-2 @[760px]:text-[15px]">
          {note.text}
        </p>
      </div>
    </div>
  )
}

/** 문단 속 밑줄 친 말. 각주 번호가 위에 붙는다. */
function Keyword({
  id,
  text,
  n,
  pinned,
  hot,
  onEnter,
  onLeave,
  onPin,
}: {
  id: string
  text: string
  n: string
  pinned: boolean
  hot: boolean
  onEnter: () => void
  onLeave: () => void
  onPin: () => void
}) {
  return (
    <span
      data-kw={id}
      role="button"
      tabIndex={0}
      aria-pressed={pinned}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onPin}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPin()
        }
      }}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent, var(--color-ink), transparent), linear-gradient(var(--u), var(--u))',
        backgroundPosition: '-70% 100%, 0 100%',
        backgroundSize: '0 2px, 100% 2px',
        backgroundRepeat: 'no-repeat',
      }}
      className={`relative cursor-pointer pb-[0.06em] text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid ${
        pinned
          ? '[--u:var(--color-ink)]'
          : hot
            ? '[--u:var(--color-ink-2)]'
            : '[--u:rgb(255_255_255/0.22)] lit:[--u:var(--color-ink-2)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-[88%] left-0 font-mono text-[max(10px,0.26em)] leading-none font-medium ${
          pinned ? 'text-brand-hi' : 'text-ink-3'
        }`}
      >
        {n}
      </span>
      {text}
    </span>
  )
}

/** 열두 시진 계단선. 칸을 훑으면 그 시간의 점수와 한마디가 보인다. */
function Hours({
  hours,
  best,
  shift,
  hot,
  onHot,
}: {
  hours: number[]
  best: number
  shift: number
  hot: number | null
  onHot: (i: number | null) => void
}) {
  const w = 240
  const h = 40
  const y = (v: number) => h - (v / 100) * h
  let d = `M0 ${y(hours[0])}`
  hours.forEach((v, i) => {
    d += ` V${y(v)} H${(i + 1) * 20}`
  })
  return (
    <div className="relative flex h-full flex-col gap-1">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="min-h-0 w-full flex-1 overflow-visible"
        onPointerLeave={() => onHot(null)}
      >
        {hours.map((_, i) => (
          <rect
            key={i}
            x={i * 20}
            y={0}
            width={20}
            height={h}
            onPointerEnter={() => onHot(i)}
            className={`cursor-crosshair ${hot === i ? 'fill-white/6' : 'fill-transparent'}`}
          />
        ))}
        <path
          d={d}
          className="fill-none stroke-ink-2 stroke-[1.5] [vector-effect:non-scaling-stroke]"
        />
        <path
          d={`M${best * 20} ${y(hours[best])} H${best * 20 + 20}`}
          className="fill-none stroke-brand-hi stroke-[2.5] [vector-effect:non-scaling-stroke]"
        />
      </svg>
      <span className="flex justify-between font-mono text-[10px] leading-none tracking-[0.06em] text-ink-3">
        {[0, 3, 6, 9, 12].map((i) => (
          <span key={i}>{blockClock(i, shift)}</span>
        ))}
      </span>
    </div>
  )
}

/** 3×3 나침반. */
function Compass({ code }: { code: string }) {
  const order = ['NW', 'N', 'NE', 'W', '', 'E', 'SW', 'S', 'SE']
  const words: Record<string, string> = {
    N: 'NORTH',
    NE: 'NORTHEAST',
    E: 'EAST',
    SE: 'SOUTHEAST',
    S: 'SOUTH',
    SW: 'SOUTHWEST',
    W: 'WEST',
    NW: 'NORTHWEST',
  }
  return (
    <div className="flex h-full items-center gap-3.5">
      <span
        className="grid grid-cols-[repeat(3,14px)] gap-0.5"
        aria-hidden="true"
      >
        {order.map((c, i) => (
          <i
            key={i}
            className={`h-3.5 border ${
              c === ''
                ? 'border-transparent bg-[linear-gradient(var(--color-ink-3),var(--color-ink-3))] bg-[length:4px_4px] bg-center bg-no-repeat'
                : c === code
                  ? 'border-brand-hi bg-brand-hi'
                  : 'border-line-strong'
            }`}
          />
        ))}
      </span>
      <span className="font-mono text-[22px] font-medium text-ink">{code}</span>
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
        {words[code]}
      </span>
    </div>
  )
}
