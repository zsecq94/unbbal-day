'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pyramid, pyramidLines } from '@/components/games/match/pyramid'
import {
  lovesPyramid,
  strokePyramid,
  type MatchCopy,
} from '@/components/games/match/shared'
import { fill, useReducedMotion } from '@/components/games/shared'
import type { NameMatch } from '@/lib/name-match'

/** 줄 하나가 열리는 간격, 다 열린 뒤 결과로 넘어가기 전 머무는 시간 */
const STEP_MS = 240
const START_MS = 200
const SETTLE_MS = 700
/** 동작 줄이기: 모든 줄을 한 번에 보여 주고 읽을 만큼만 머문다 */
const REDUCED_MS = 1400

/**
 * 궁합 보기를 누른 뒤의 계산 화면. 실제 피라미드를 한 줄씩 연다. 획수 궁합은
 * 먼저 쓴 이름 쪽을 다 연 뒤 순서를 바꾼 쪽을 연다. 위 띠의 단계 표시가 지금
 * 하는 일(번갈아 쓰기 → 획수 세기 → 줄여 가기 → 순서 바꿔 한 번 더)을 따라간다.
 * 건너뛰기를 누르거나 Enter를 치면 바로 결과로 간다.
 */
export function MatchAnalyzing({
  copy,
  match: m,
  onDone,
}: {
  copy: MatchCopy
  match: NameMatch
  onDone: () => void
}) {
  const reduced = useReducedMotion()
  const a = copy.analyzing
  const parts = useMemo(
    () =>
      m.kind === 'strokes'
        ? m.readings.map((r, i) => ({
            data: strokePyramid(r),
            caption: fill(copy.first, { name: m.names[i].join('') }),
          }))
        : [
            {
              data: lovesPyramid(m.reading),
              caption: `${m.names[0]} LOVES ${m.names[1]}`,
            },
          ],
    [copy.first, m]
  )
  const counts = parts.map((p) => pyramidLines(p.data))
  const total = counts.reduce((x, y) => x + y, 0)
  const steps = m.kind === 'strokes' ? a.strokes : a.loves

  /* 연 줄 수. 동작 줄이기에서는 처음부터 다 연 것으로 본다. */
  const [open, setOpen] = useState(0)
  const shown = reduced ? total : open
  useEffect(() => {
    const t = reduced
      ? setTimeout(onDone, REDUCED_MS)
      : open < total
        ? setTimeout(() => setOpen(open + 1), open === 0 ? START_MS : STEP_MS)
        : setTimeout(onDone, SETTLE_MS)
    return () => clearTimeout(t)
  }, [open, total, reduced, onDone])

  /* Enter로 건너뛴다(건너뛰기 단추에 초점이 없어도) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return
      e.preventDefault()
      onDone()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onDone])

  /* 마지막으로 연 줄로 지금 단계를 정한다. 첫 줄은 글자, 둘째 줄은 획수(또는 개수)다. */
  const last = shown - 1
  const step =
    shown >= total
      ? steps.length
      : m.kind === 'loves'
        ? last <= 1
          ? 0
          : 1
        : last >= counts[0]
          ? 3
          : Math.max(0, Math.min(last, 2))

  return (
    <div className="flex flex-1 animate-rise-in flex-col motion-reduce:animate-none">
      {/* 페이지 틀을 화면 높이에 고정한다(globals.css의 fit-viewport) */}
      <span className="fit-viewport" aria-hidden="true" />
      <ol className="flex flex-wrap gap-x-[22px] gap-y-2 border-b border-line px-5 py-4 sm:px-7">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 text-[13.5px] font-bold transition-colors duration-200 motion-reduce:transition-none ${
              i === step ? 'text-ink' : i < step ? 'text-ink-2' : 'text-ink-3'
            }`}
          >
            <i
              className={`font-mono text-[11px] font-medium not-italic ${
                i === step ? 'text-brand-hi' : ''
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </i>
            {s}
          </li>
        ))}
      </ol>
      <p role="status" className="sr-only">
        {steps[Math.min(step, steps.length - 1)]}
      </p>

      <div
        aria-hidden="true"
        className="grid min-h-0 flex-1 auto-cols-[minmax(0,1fr)] grid-flow-col items-center p-5"
      >
        {parts.map((p, i) => {
          const before = counts.slice(0, i).reduce((x, y) => x + y, 0)
          return (
            <div key={i} className="h-full min-h-0 min-w-0">
              <Pyramid
                data={p.data}
                copy={copy.pyramid}
                caption={<span>{p.caption}</span>}
                shown={Math.max(0, Math.min(counts[i], shown - before))}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-7 sm:py-[18px]">
        <p className="text-sm leading-[1.5] break-keep text-ink-3">{a.hint}</p>
        <button
          type="button"
          data-match-skip
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
