'use client'

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  signIndex,
  zodiacIndex,
  type DomainKey,
  type Fortune,
  type Profile,
} from '@/lib/fortune'
import type { Locale } from '@/lib/i18n'
import type { TenGod } from '@/lib/saju/ganji'
import type { Reason } from '@/lib/saju/reading'
import { ElementBars } from './element-bars'
import { Tween, type FortuneCopy } from './fortune-screen'
import {
  blockClock,
  blockLabel,
  dayMaster,
  fill,
  ganji,
  josa,
  pillarWords,
  termText,
  useReducedMotion,
} from './shared'

type Tab = 'all' | DomainKey
type NoteId = `k${1 | 2 | 3 | 4 | 5}`
type Note = {
  idx: string
  title: string
  sub: string
  text: string
  viz?: ReactNode
}

/**
 * 결과 등장 순서(ms). 빛줄기가 훑고 점수가 오르는 동안 분야 탭 막대가 하나씩 차오르고,
 * 이어서 문단이 낱말 단위로 떠오른 뒤 각주 띠가 올라온다.
 * 탭을 바꾸면 문단만 짧게 다시 떠오른다.
 */
const REVEAL = {
  score: 1000,
  tabs: 160,
  perTab: 80,
  words: 520,
  perWord: 42,
  afterWords: 160,
}
const QUICK = { words: 0, perWord: 16 }
const TABS: Tab[] = ['all', 'money', 'love', 'health', 'work', 'rel']

/**
 * 결과: 위에는 여섯 분야 탭, 가운데는 고른 분야의 각주 달린 문단, 아래는 각주 띠.
 * 총운 문단은 하루 전체(좋은 시간, 강한 쪽·약한 쪽, 행운 포인트)를, 분야 문단은
 * 상태와 그 근거(십성·합충), 할 것과 피할 것을 말한다. 밑줄 친 말을 짚으면
 * 각주 띠에 그 뜻이 열리고, 누르면 고정된다.
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
  const [tab, setTab] = useState<Tab>('all')
  /* 처음 한 번은 천천히 드러나고, 탭을 바꾼 뒤로는 짧게 바뀐다 */
  const [quick, setQuick] = useState(false)
  const [pinned, setPinned] = useState<NoteId>('k1')
  const [shown, setShown] = useState<NoteId>('k1')
  const [hotHour, setHotHour] = useState<number | null>(null)
  const answerRef = useRef<HTMLParagraphElement>(null)

  const choose = (next: Tab) => {
    if (next === tab) return
    setTab(next)
    setQuick(true)
    setPinned('k1')
    setShown('k1')
    setHotHour(null)
  }

  const name = (key: Tab) => copy.domains[key]
  const domain = (key: DomainKey) => f.domains.find((d) => d.key === key)!
  const score = (key: Tab) => (key === 'all' ? f.total : domain(key).score)
  const pickText = <T,>(arr: T[], i: number) => arr[i % arr.length]
  const who = p.name.trim() ? fill(copy.who, { name: p.name.trim() }) : ''
  const lineOf = (key: DomainKey) =>
    pickText(copy.content.lines[key][domain(key).level], domain(key).line)
  const adviceOf = (key: DomainKey) =>
    pickText(copy.content.advice[key][domain(key).level], domain(key).advice)

  /* 총운 문단의 재료 */
  const headline = pickText(
    copy.content.headlines[f.tenGod][f.tone],
    f.headline
  )
  const basis = fill(copy.basis, {
    day: ganji(copy, f.today),
    dm: dayMaster(copy, f.chart),
    god: copy.tenGods[f.tenGod],
  })
  const element = copy.elements[f.yong]
  const lucky = pickText(copy.content.lucky[f.yong], f.lucky)

  /*
   * 문단 템플릿과 각주 낱말. 총운은 {headline} {time} {top} {low} {lucky}가 각주 1–5,
   * 분야는 근거 {term}과 할 것 {do}가 각주 1–2다.
   */
  const { template, KW, vars } = (() => {
    if (tab === 'all')
      return {
        template: copy.answer,
        KW: {
          headline: ['k1', headline],
          time: ['k2', blockLabel(copy, f.best, f.shift)],
          top: ['k3', name(f.top)],
          low: ['k4', name(f.low)],
          lucky: ['k5', lucky],
        } as Record<string, [NoteId, string]>,
        vars: {
          who,
          element,
          lowParticle: josa(copy, name(f.low), 'topic'),
          luckyParticle: josa(copy, lucky, 'direction'),
        } as Record<string, string>,
      }
    const d = domain(tab)
    const term = termText(copy, d.reason)
    const advice = adviceOf(tab)
    const why =
      d.reason in copy.tenGods
        ? copy.why.gods[d.reason as TenGod][d.up ? 'up' : 'down']
        : copy.why.relations[d.reason as Reason]
    return {
      template: copy.domainAnswer.replace('{why}', why),
      KW: {
        term: ['k1', term],
        do: ['k2', advice.do],
      } as Record<string, [NoteId, string]>,
      vars: {
        who,
        line: lineOf(tab),
        dont: advice.dont,
        domain: copy.domainWords[tab],
        termParticle: josa(copy, term, 'subject'),
        doParticle: josa(copy, advice.do, 'object'),
        dontParticle: josa(copy, advice.dont, 'object'),
      } as Record<string, string>,
    }
  })()

  /* 문단을 낱말 단위로 쪼개 등장 시각을 하나씩 늦춘다. 밑줄 친 말은 한 덩어리로 떠오른다. */
  const pace = quick ? QUICK : REVEAL
  const answer: ReactNode[] = []
  let unit = 0
  const appear = (node: ReactNode, key: string) => (
    <span
      key={key}
      className="animate-word-in motion-reduce:animate-none"
      style={{ animationDelay: `${pace.words + unit++ * pace.perWord}ms` }}
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
  while ((m = re.exec(template))) {
    if (m.index > last) pushText(template.slice(last, m.index))
    const kw = KW[m[1]]
    if (kw) {
      const [id, text] = kw
      answer.push(
        appear(
          <Keyword
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
  if (last < template.length) pushText(template.slice(last))
  const noteAt = REVEAL.words + unit * REVEAL.perWord + REVEAL.afterWords

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
  }, [tab, locale])

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

  /* 할 것 · 피할 것 두 줄 */
  const doDont = (key: DomainKey) => {
    const advice = adviceOf(key)
    return (
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
    )
  }
  /* 분야 하나의 요약: 상태 문장과 할 것 · 피할 것 */
  const domainNote = (key: DomainKey, idx: string, label: string): Note => ({
    idx,
    title: `${name(key)} ${score(key)}`,
    sub: [label, copy.levels[domain(key).level]].filter(Boolean).join(' · '),
    text: fill(copy.notes.advice, { line: lineOf(key), ...adviceOf(key) }),
    viz: doDont(key),
  })

  const note = noteFor(shown)
  /* 각주 띠가 지금 무엇을 보여 주는가. 같은 각주 안의 변화(시간대 훑기)로는 바뀌지 않는다. */
  const noteKey = `${tab}-${shown}`
  /* 고정한 것과 다른 키워드를 미리보는 중 */
  const previewing = shown !== pinned
  function noteFor(id: NoteId): Note {
    if (tab !== 'all') {
      const d = domain(tab)
      if (id === 'k2') return domainNote(tab, '2', '')
      return {
        idx: '1',
        title: termText(copy, d.reason),
        sub: `${copy.notes.why} · ${name(tab)} ${d.score}`,
        text: copy.glossary[d.reason],
        viz: doDont(tab),
      }
    }
    switch (id) {
      case 'k1':
        return {
          idx: '1',
          title: `${name('all')} ${f.total}`,
          sub: basis,
          text: pickText(copy.content.summaries[f.tenGod], f.summary),
        }
      case 'k3':
        return domainNote(f.top, '3', copy.notes.top)
      case 'k4':
        return domainNote(f.low, '4', copy.notes.low)
      case 'k5':
        return {
          idx: '5',
          title: lucky,
          sub: copy.notes.lucky,
          text: fill(copy.notes.luckyText, { element }),
          viz: (
            <div className="flex h-full items-center text-[26px]">
              <ElementBars
                counts={f.elements}
                names={copy.elements}
                mark={f.yong}
                reduced
              />
            </div>
          ),
        }
      default: {
        const i = hotHour ?? f.best
        return {
          idx: '2',
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
    ].map((w) => [' · ', w]),
  ].map(([gap, w], i) => (
    <Fragment key={i}>
      {gap}
      <span className="whitespace-nowrap">{w}</span>
    </Fragment>
  ))

  /* 탭은 좌우 화살표로도 옮겨 다닌다 */
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length]
    choose(next)
    document.getElementById(`fortune-tab-${next}`)?.focus()
  }

  return (
    <div className="@container relative flex min-h-0 flex-1 flex-col gap-3.5 px-5 pt-[18px] pb-5 sm:gap-5 sm:px-7 sm:pt-[26px] sm:pb-7 xl:px-[clamp(28px,4vw,72px)] xl:py-8">
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

      <div
        role="tablist"
        aria-label={copy.domainsLabel}
        onKeyDown={onTabKey}
        className="grid flex-none grid-cols-3 gap-x-3 gap-y-1 sm:grid-cols-6 sm:gap-3.5"
      >
        {TABS.map((key, i) => {
          const on = tab === key
          return (
            <button
              key={key}
              id={`fortune-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="fortune-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => choose(key)}
              className={`grid grid-cols-[auto_auto] justify-between gap-y-2 pt-0.5 pb-1 text-left text-xs font-bold transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink focus-visible:outline-solid motion-reduce:transition-none sm:text-[13px] lit:text-ink ${
                on ? 'text-ink' : 'text-ink-3'
              }`}
            >
              <span>{name(key)}</span>
              <b
                className={`font-mono text-xs font-medium tabular-nums ${on ? 'text-ink' : 'text-ink-2'}`}
              >
                {score(key)}
              </b>
              <i
                aria-hidden="true"
                className="col-span-full h-0.5 bg-[length:calc(var(--v)*1%)_100%,100%_1px] bg-position-[0_0,0_50%] bg-no-repeat transition-[background-size] duration-700 ease-out-soft motion-reduce:transition-none starting:bg-[length:0_100%,100%_1px]"
                style={{
                  ['--v' as string]: score(key),
                  transitionDelay: `${REVEAL.tabs + i * REVEAL.perTab}ms`,
                  backgroundImage: `linear-gradient(${on ? 'var(--color-brand-hi), var(--color-brand-hi)' : 'var(--color-ink-2), var(--color-ink-2)'}), linear-gradient(var(--color-line-strong), var(--color-line-strong))`,
                }}
              />
            </button>
          )
        })}
      </div>

      <p
        key={tab}
        ref={answerRef}
        id="fortune-panel"
        role="tabpanel"
        aria-labelledby={`fortune-tab-${tab}`}
        lang={locale}
        tabIndex={-1}
        data-fortune-answer
        className="min-h-0 flex-1 [background-clip:content-box] pt-1 text-[30px] leading-[1.6] font-bold tracking-[-0.035em] break-keep text-ink-2 outline-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0 calc(1lh - 1px), rgb(255 255 255 / 0.04) calc(1lh - 1px) 1lh)',
          backgroundPosition: '0 4px',
        }}
      >
        {answer}
      </p>

      <div
        aria-live="polite"
        style={{ animationDelay: `${noteAt}ms` }}
        className="grid h-[104px] flex-none animate-rise-in grid-cols-[28px_minmax(0,1fr)] grid-rows-[22px_auto] content-start gap-x-3.5 gap-y-2 border-t border-line pt-3 motion-reduce:animate-none @[760px]:h-24 @[760px]:grid-cols-[28px_minmax(0,1fr)_minmax(260px,36%)] @[760px]:gap-x-[18px]"
      >
        {/* 번호 칸은 열린 키워드와 같은 색이다. 선택한 말은 파랑, 미리보는 말은 흰색으로 채운다. */}
        <span
          className={`grid h-[22px] w-7 place-items-center border font-mono text-xs font-medium transition-colors duration-150 motion-reduce:transition-none ${
            previewing
              ? 'border-ink bg-ink text-canvas'
              : 'border-line-strong text-brand-hi'
          }`}
        >
          {note.idx}
        </span>
        <p
          key={`${noteKey}-title`}
          className="flex min-w-0 animate-note-in items-baseline gap-2.5 text-[15px] leading-[22px] whitespace-nowrap motion-reduce:animate-none"
        >
          <b className="font-[750]">{note.title}</b>
          <span className="overflow-hidden text-sm font-semibold text-ellipsis text-ink-3">
            {note.sub}
          </span>
        </p>
        <div
          key={`${noteKey}-viz`}
          className="hidden min-w-0 animate-note-in motion-reduce:animate-none @[760px]:col-start-3 @[760px]:row-span-2 @[760px]:row-start-1 @[760px]:block @[760px]:h-16 @[760px]:self-start"
        >
          {note.viz}
        </div>
        <p
          key={`${noteKey}-text`}
          className="col-span-full animate-note-in text-sm leading-[1.5] break-keep text-ink-2 motion-reduce:animate-none @[760px]:col-span-1 @[760px]:col-start-2 @[760px]:text-[15px]"
        >
          {note.text}
        </p>
      </div>
    </div>
  )
}

/**
 * 문단 속 밑줄 친 말. 각주 번호가 위에 붙는다. 선택(고정)한 말은 밑줄과 번호가 늘 파랗고,
 * 마우스를 올려 미리보는 말은 흰색이다. 각주 띠의 번호 칸도 같은 색을 따른다.
 */
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
          ? '[--u:var(--color-brand-hi)]'
          : hot
            ? '[--u:var(--color-ink)]'
            : '[--u:rgb(255_255_255/0.22)] lit:[--u:var(--color-ink-2)]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-[88%] left-0 font-mono text-[max(10px,0.26em)] leading-none font-medium transition-colors duration-150 motion-reduce:transition-none ${
          pinned ? 'text-brand-hi' : hot ? 'text-ink' : 'text-ink-3'
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
