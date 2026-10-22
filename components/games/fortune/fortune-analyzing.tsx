'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Fortune } from '@/lib/fortune'
import { Tween, type FortuneCopy } from './fortune-screen'
import {
  blockLabel,
  fill,
  ganji,
  pillarWords,
  scramble,
  useReducedMotion,
} from './shared'

const STEPS = ['chart', 'elements', 'yong', 'today', 'hours'] as const
/**
 * 단계 하나가 끝나는 간격. 다 끝나면 마지막 값이 그려지길 기다렸다가(SETTLE),
 * 완료 표시로 잠깐 머문 뒤(READY), 화면이 흐려지며 빠져나간다(LEAVE).
 */
const STEP_MS = 480
const SETTLE_MS = 500
const READY_MS = 520
const LEAVE_MS = 280
/** 동작 줄이기: 모든 단계를 한 번에 보여 주고 읽을 만큼만 머문다 */
const REDUCED_MS = 1400
/** 결과 글자가 자리 잡기 전에 섞이는 글자들 */
const GANJI_POOL = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'

/**
 * 운세 보기를 누른 뒤 결과로 넘어가기 전의 분석 화면.
 * 실제 계산 단계(원국 → 오행 → 용신 → 일진 → 시간대)를 하나씩 열며 그 값을 보여 준다.
 * 다 끝나면 눈금에 불이 지나가는 완료 표시를 잠깐 보여 주고 결과로 넘어간다.
 * 건너뛰기를 누르거나 Enter를 치면 바로 결과로 간다.
 */
export function FortuneAnalyzing({
  copy,
  fortune: f,
  onDone,
}: {
  copy: FortuneCopy
  fortune: Fortune
  onDone: () => void
}) {
  const reduced = useReducedMotion()
  const a = copy.analyzing
  /* 끝난 단계 수. 동작 줄이기에서는 처음부터 다 끝난 것으로 본다. */
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'steps' | 'ready' | 'leaving'>('steps')
  const done = reduced ? STEPS.length : count

  useEffect(() => {
    const next: [() => void, number] = reduced
      ? [onDone, REDUCED_MS]
      : phase === 'steps'
        ? count < STEPS.length
          ? [() => setCount(count + 1), STEP_MS]
          : [() => setPhase('ready'), SETTLE_MS]
        : phase === 'ready'
          ? [() => setPhase('leaving'), READY_MS]
          : [onDone, LEAVE_MS]
    const t = setTimeout(...next)
    return () => clearTimeout(t)
  }, [count, phase, reduced, onDone])

  const values: Record<(typeof STEPS)[number], ReactNode> = {
    chart: (
      <Scrambled
        text={pillarWords(copy, f.chart).join(' ')}
        reduced={reduced}
      />
    ),
    elements: (
      <Elements
        counts={f.elements}
        names={copy.elements}
        mark={done > 2 ? f.yong : null}
        reduced={reduced}
      />
    ),
    yong: (
      <Scrambled
        text={fill(a.yong, { element: copy.elements[f.yong] })}
        reduced={reduced}
      />
    ),
    today: (
      <Scrambled
        text={fill(a.today, {
          day: ganji(copy, f.today),
          god: copy.tenGods[f.tenGod],
        })}
        reduced={reduced}
      />
    ),
    hours: (
      <span className="flex items-center gap-4">
        <Spark hours={f.hours} best={f.best} reduced={reduced} />
        <Scrambled
          text={fill(a.best, { time: blockLabel(copy, f.best, f.shift) })}
          reduced={reduced}
          className="text-[0.62em] text-ink-2"
        />
      </span>
    ),
  }
  const finished = done >= STEPS.length
  const ready = reduced || phase !== 'steps'

  return (
    <div
      className={`flex flex-1 flex-col motion-reduce:animate-none ${
        phase === 'leaving' ? 'animate-leave' : 'animate-rise-in'
      }`}
    >
      <div className="sticky top-0 z-[5] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line bg-tile px-5 py-3.5 sm:px-7 lg:gap-x-7">
        <Progress value={done / STEPS.length} flash={ready && !reduced} />
        <span className="flex items-baseline gap-2 font-mono text-xl font-medium tracking-[-0.02em] tabular-nums">
          <span className="text-[11px] tracking-[0.12em] text-ink-3 uppercase">
            {ready ? a.done : a.label}
          </span>
          <Tween value={Math.round((done / STEPS.length) * 100)} ms={STEP_MS} />
          <small className="text-xs text-ink-3">%</small>
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-7 sm:py-12 lg:px-[clamp(28px,6vw,104px)]">
        <p role="status" className="sr-only">
          {finished ? a.done : a.steps[STEPS[done]]}
        </p>
        <ol className="grid max-w-[44em] gap-[clamp(14px,2.2vh,26px)]">
          {STEPS.slice(0, Math.min(done + 1, STEPS.length)).map((step, i) => {
            const active = i === done
            return (
              <li
                key={step}
                className="grid animate-rise-in grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 motion-reduce:animate-none sm:grid-cols-[2.75rem_minmax(0,1fr)]"
              >
                <span
                  className={`pt-0.5 font-mono text-xs font-medium tracking-[0.08em] transition-colors duration-300 motion-reduce:transition-none ${
                    active || ready ? 'text-brand-hi' : 'text-ink-3'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`text-sm leading-[1.4] font-semibold break-keep transition-colors duration-300 motion-reduce:transition-none sm:text-[15px] ${
                    active ? 'text-ink' : 'text-ink-3'
                  }`}
                >
                  {a.steps[step]}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="ml-1.5 inline-block h-[1em] w-[0.45em] translate-y-[0.18em] animate-blink bg-ink-2"
                    />
                  )}
                </span>
                <span className="col-start-2 min-h-[1.3em] text-[clamp(20px,1.4vw+12px,30px)] leading-[1.3] font-bold tracking-[-0.03em] break-keep text-ink">
                  {i < done && values[step]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-7 sm:py-[18px]">
        <p className="text-sm leading-[1.5] break-keep text-ink-3">
          {a.privacy}
        </p>
        <button
          type="button"
          data-fortune-skip
          onClick={onDone}
          className="inline-flex h-11 shrink-0 items-center gap-2.5 border border-line-strong px-[18px] text-sm font-bold whitespace-nowrap text-ink-2 transition-[color,transform] duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100 lit:text-ink"
        >
          {a.skip}
          <span aria-hidden="true" className="font-mono text-xs opacity-70">
            ↵
          </span>
        </button>
      </div>
    </div>
  )
}

/** 진행 눈금 50개. 단계가 끝날 때마다 차오르고, 완료되면 불이 왼쪽부터 지나간다. */
function Progress({ value, flash }: { value: number; flash: boolean }) {
  const lit = Math.round(value * 50)
  return (
    <span
      aria-hidden="true"
      className="flex h-3.5 max-w-[440px] items-end justify-between"
    >
      {Array.from({ length: 50 }, (_, i) => (
        <i
          key={i}
          style={{
            transitionDelay: `${(i % 10) * 24}ms`,
            animationDelay: flash ? `${i * 8}ms` : undefined,
          }}
          className={[
            'w-0.5 transition-colors duration-200 motion-reduce:transition-none',
            flash ? 'animate-flash' : '',
            i % 5 === 4 ? 'h-3.5' : 'h-[9px]',
            i < lit
              ? 'bg-ink-2'
              : i === lit
                ? 'animate-breathe bg-line-strong motion-reduce:animate-none'
                : 'bg-line-strong',
          ].join(' ')}
        />
      ))}
    </span>
  )
}

/** 값이 간지 글자로 잠깐 섞였다가 자리를 잡는다. */
function Scrambled({
  text,
  reduced,
  className = '',
}: {
  text: string
  reduced: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    return scramble(el, text, { ms: 420, pool: GANJI_POOL })
  }, [text, reduced])
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}

/** 오행 다섯 막대. 용신이 정해지면 그 막대에 불이 들어온다. */
function Elements({
  counts,
  names,
  mark,
  reduced,
}: {
  counts: number[]
  names: string[]
  mark: number | null
  reduced: boolean
}) {
  const max = Math.max(...counts, 1)
  return (
    <span className="flex h-[1.6em] items-end gap-[0.7em]">
      {counts.map((c, i) => (
        <span key={i} className="flex h-full items-end gap-1.5">
          <i
            aria-hidden="true"
            style={{
              height: c ? `${(c / max) * 100}%` : '2px',
              animationDelay: reduced ? undefined : `${i * 70}ms`,
            }}
            className={`w-[0.32em] origin-bottom transition-colors duration-300 motion-reduce:animate-none ${
              reduced ? '' : 'animate-grow'
            } ${mark === i ? 'bg-brand-hi' : c ? 'bg-ink-2' : 'bg-line-strong'}`}
          />
          <span
            className={`font-mono text-[0.48em] leading-none font-medium transition-colors duration-300 ${
              mark === i ? 'text-brand-hi' : 'text-ink-3'
            }`}
          >
            {names[i]} {c}
          </span>
        </span>
      ))}
    </span>
  )
}

/** 열두 시진 흐름이 그려지고, 가장 좋은 칸에 불이 들어온다. */
function Spark({
  hours,
  best,
  reduced,
}: {
  hours: number[]
  best: number
  reduced: boolean
}) {
  const h = 24
  const y = (v: number) => h - (v / 100) * h
  let d = `M0 ${y(hours[0])}`
  hours.forEach((v, i) => {
    d += ` V${y(v)} H${(i + 1) * 10}`
  })
  return (
    <svg
      viewBox={`0 0 120 ${h}`}
      aria-hidden="true"
      className="h-[1.1em] w-[5.5em] shrink-0 overflow-visible"
    >
      <path
        d={d}
        pathLength={1}
        strokeDasharray={1}
        className={`fill-none stroke-ink-2 stroke-[1.5] [vector-effect:non-scaling-stroke] ${
          reduced ? '' : 'animate-draw'
        }`}
      />
      <path
        d={`M${best * 10} ${y(hours[best])} H${best * 10 + 10}`}
        style={{ animationDelay: reduced ? undefined : '700ms' }}
        className={`fill-none stroke-brand-hi stroke-[3] [vector-effect:non-scaling-stroke] ${
          reduced ? '' : 'animate-rise-in'
        }`}
      />
    </svg>
  )
}
