'use client'

import { useState } from 'react'
import { Pyramid } from '@/components/games/match/pyramid'
import {
  bandOf,
  compose,
  lovesPyramid,
  strokePyramid,
  type MatchCopy,
} from '@/components/games/match/shared'
import { fill } from '@/components/games/shared'
import type { NameMatch } from '@/lib/name-match'

/** 두 방향 점수 차이가 이만큼 이하면 "거의 같다"고 말한다 */
const EVEN_GAP = 5

const em = (text: string) => (
  <em className="text-ink not-italic shadow-[inset_0_-0.08em_var(--color-ink-3)]">
    {text}
  </em>
)

/**
 * 결과: 위에 점수 카드, 가운데 한 문단, 근거 피라미드. 획수 궁합은 먼저 쓴
 * 이름에 따라 점수가 달라 두 방향을 모두 보여 주고, 좁은 화면에서는 카드를
 * 눌러 볼 방향을 고른다. 넓은 화면에서는 왼쪽에 점수와 문단, 오른쪽에 피라미드를 둔다.
 */
export function MatchResult({
  copy,
  match: m,
  onEdit,
  onAgain,
}: {
  copy: MatchCopy
  match: NameMatch
  onEdit: () => void
  onAgain: () => void
}) {
  const [dir, setDir] = useState(0)
  const strokes = m.kind === 'strokes'
  const [A, B] = strokes ? m.names.map((n) => n.join('')) : m.names
  const unit = strokes ? copy.unit.strokes : copy.unit.loves
  const card =
    'grid min-w-0 gap-1 border px-3.5 py-2.5 text-left max-sm:px-3 max-sm:py-2'
  const who = 'truncate text-[13px] font-bold text-ink-3'
  const big =
    'font-mono text-[clamp(28px,3.4vw,46px)] leading-none font-medium tracking-[-0.04em] tabular-nums'

  /* 점수 카드 */
  const cards = strokes ? (
    m.readings.map((r, i) => (
      <button
        key={i}
        type="button"
        aria-pressed={dir === i}
        onClick={() => setDir(i)}
        className={`${card} transition-[border-color,transform] duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-[0.98] motion-reduce:transition-none ${
          dir === i ? 'border-ink-3' : 'border-line'
        }`}
      >
        <span className={who}>
          {i ? B : A}
          <span aria-hidden="true" className="mx-1.5 font-mono">
            →
          </span>
          {i ? A : B}
        </span>
        <b className={big}>
          {r.score}
          <small className="ml-[3px] text-[0.4em] text-ink-3">{unit}</small>
        </b>
      </button>
    ))
  ) : (
    <div className={`${card} border-line`}>
      <span className={who}>
        {A} <span aria-hidden="true">♥</span> {B}
      </span>
      <b className={`${big} ${m.reading.endless ? 'text-brand-hi' : ''}`}>
        {m.reading.score === null ? (
          '∞'
        ) : (
          <>
            {m.reading.score}
            <small className="ml-[3px] text-[0.4em] text-ink-3">{unit}</small>
          </>
        )}
      </b>
    </div>
  )

  /* 한 문단 */
  const answer = (() => {
    if (strokes) {
      const [s0, s1] = m.readings.map((r) => r.score)
      const gap = Math.abs(s0 - s1)
      const lead = s0 > s1 ? A : B
      return compose(copy.answer.strokes, {
        a: A,
        b: B,
        band: em(bandOf(copy, Math.max(s0, s1), [A, B])),
        gap:
          gap <= EVEN_GAP
            ? copy.answer.even
            : fill(copy.answer.lead, { lead, gap }),
      })
    }
    const score = m.reading.score
    if (score === null)
      return compose(copy.answer.endless, { band: em(copy.answer.endlessBand) })
    return compose(copy.answer.loves, {
      a: A,
      b: B,
      band: em(bandOf(copy, score, [A, B])),
    })
  })()

  /* 근거 피라미드 */
  const proofs = strokes
    ? m.readings.map((r, i) => ({
        data: strokePyramid(r),
        label: copy.pyramid.strokes,
        name: fill(copy.first, { name: i ? B : A }),
      }))
    : [
        {
          data: lovesPyramid(m.reading),
          label: copy.pyramid.loves,
          name: `${A} LOVES ${B}`,
        },
      ]
  const note = strokes
    ? copy.note.strokes
    : m.reading.endless
      ? copy.note.endless
      : copy.note.loves

  return (
    <div className="grid flex-1 animate-rise-in grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3.5 px-5 py-4 motion-reduce:animate-none sm:gap-[18px] sm:px-7 sm:pt-6 sm:pb-[22px] lg:grid-cols-2 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-x-[clamp(32px,4vw,64px)] xl:px-[clamp(28px,4vw,72px)] xl:pt-[30px] xl:pb-[26px]">
      {/* 페이지 틀을 화면 높이에 고정한다(globals.css의 fit-viewport) */}
      <span className="fit-viewport" aria-hidden="true" />

      <div className="flex flex-wrap gap-2.5 lg:col-start-1 lg:row-start-1">
        {cards}
      </div>

      <p
        data-match-answer
        tabIndex={-1}
        className="max-w-[26em] text-[clamp(18px,4.6vw+2px,24px)] leading-[1.38] font-bold tracking-[-0.035em] break-keep text-ink-2 outline-none sm:text-[clamp(22px,2.4vw+6px,46px)] lg:col-start-1 lg:row-start-2 lg:self-start"
      >
        {answer}
      </p>

      <div className="grid min-h-0 auto-cols-[minmax(0,1fr)] grid-flow-col border-t border-line pt-3.5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-[clamp(24px,3vw,48px)]">
        {proofs.map((p, i) => (
          <div
            key={i}
            /* 좁은 화면에서는 고른 방향 하나만 보인다 */
            className={`h-full min-h-0 min-w-0 ${strokes && i !== dir ? 'max-sm:hidden' : ''}`}
          >
            <Pyramid
              data={p.data}
              copy={copy.pyramid}
              caption={
                <>
                  <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">
                    {p.label}
                  </span>
                  <span>{p.name}</span>
                </>
              }
            />
            {/* 화면 읽기 프로그램용: 줄마다 숫자 */}
            <ol className="sr-only">
              {p.data.rows.map((row, k) => (
                <li key={k}>{row.flat().join(' ')}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 lg:col-span-2">
        <p className="text-[13px] leading-[1.5] break-keep text-ink-3 max-sm:hidden [@media(max-height:700px)]:hidden">
          {note}
        </p>
        <span className="ml-auto flex items-center gap-[18px]">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 text-[13px] font-bold whitespace-nowrap text-ink-2 transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid lit:text-ink"
          >
            <span aria-hidden="true" className="font-mono">
              ←
            </span>
            {copy.edit}
          </button>
          <button
            type="button"
            onClick={onAgain}
            className="inline-flex h-11 shrink-0 items-center border border-line-strong px-[18px] text-sm font-bold whitespace-nowrap text-ink-2 transition-[color,transform] duration-150 ease-out-soft outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:outline-solid active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100 lit:text-ink"
          >
            {copy.again}
          </button>
        </span>
      </div>
    </div>
  )
}
