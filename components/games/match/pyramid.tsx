'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'
import { fill } from '@/components/games/shared'

type Copy = Dictionary['match']['pyramid']

export type PyramidData = {
  /** 맨 위 글자 줄. dim은 상대 이름의 글자(두 이름을 구분한다) */
  letters: { ch: string; dim?: boolean }[]
  /** 줄마다 칸 묶음. 묶음 하나가 두 칸이면 10 이상이라 쪼갠 두 자리다 */
  rows: number[][][]
  /** 마지막 두 칸을 점수로 강조한다. 끝나지 않는 LOVES 쌍은 null */
  score: number | null
  /** 끝나지 않는 LOVES 쌍: 되돌아가는 줄 번호, 또는 계속 길어짐 */
  endless?: { loopTo: number } | 'grow'
}

/** 화면이 좁거나 낮으면 긴 피라미드의 가운데 줄을 접는다. */
const maxRows = () =>
  typeof window === 'undefined'
    ? 20
    : innerHeight < 700
      ? 9
      : innerWidth < 640 || innerHeight < 760
        ? 12
        : 20

/** 피라미드가 그리는 줄 수(글자 줄, 숫자 줄, 끝나지 않을 때의 표시 줄). 계산 화면이 이만큼 연다. */
export function pyramidLines({ rows, endless }: PyramidData) {
  const numbers = Math.min(rows.length, maxRows())
  return 1 + numbers + (endless === 'grow' ? 1 : endless ? 2 : 0)
}

/**
 * 계산 피라미드. 첫 줄(획수나 개수)에서 이웃끼리 더해 두 자리가 될 때까지
 * 줄어드는 과정을 칸으로 그린다. 칸 크기는 상자에 맞춘다. `shown`을 주면 그만큼의
 * 줄만 보이고(계산 화면이 한 줄씩 연다), 나머지는 자리만 차지한다.
 */
export function Pyramid({
  data,
  copy,
  caption,
  shown,
}: {
  data: PyramidData
  copy: Copy
  caption: ReactNode
  shown?: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const pyrRef = useRef<HTMLDivElement>(null)

  /* 줄 목록: 글자 줄, 숫자 줄(길면 가운데를 접음), 끝나지 않으면 표시 줄 */
  const lines: ReactNode[] = []
  const { letters, rows, score, endless } = data
  const max = maxRows()
  let order = rows.map((_, i) => i)
  if (rows.length > max) {
    const head = Math.ceil((max - 1) / 2)
    order = [...order.slice(0, head), -1, ...order.slice(-(max - 1 - head))]
  }
  const folded = rows.length - order.filter((i) => i >= 0).length

  lines.push(
    <Row key="letters">
      {letters.map((l, i) => (
        <Cell key={i} tone={l.dim ? 'letterDim' : 'letter'}>
          {l.ch}
        </Cell>
      ))}
    </Row>
  )
  for (const i of order) {
    if (i < 0) {
      lines.push(<Note key="fold">{fill(copy.skipped, { n: folded })}</Note>)
      continue
    }
    const first = i === 0
    const last = i === rows.length - 1 && score !== null
    lines.push(
      <Row key={i}>
        {rows[i].map((group, gi) =>
          group.length === 1 ? (
            <Cell
              key={gi}
              tone={
                last
                  ? 'score'
                  : first
                    ? letters[gi]?.dim
                      ? 'firstDim'
                      : 'first'
                    : 'plain'
              }
            >
              {group[0]}
            </Cell>
          ) : (
            /* 10 이상이라 쪼갠 두 자리: 밑에 묶음 선을 긋는다 */
            <span
              key={gi}
              className="relative flex gap-px after:absolute after:inset-x-0.5 after:-bottom-[calc(var(--gap)/2+1px)] after:h-px after:bg-brand-hi/60"
            >
              {group.map((n, k) => (
                <Cell key={k} tone="plain">
                  {n}
                </Cell>
              ))}
            </span>
          )
        )}
      </Row>
    )
  }
  if (endless && endless !== 'grow') {
    lines.push(
      <Row key="loop">
        {rows[endless.loopTo].flat().map((n, k) => (
          <Cell key={k} tone="loop">
            {n}
          </Cell>
        ))}
      </Row>,
      <Note key="loop-note">{fill(copy.loop, { n: endless.loopTo + 1 })}</Note>
    )
  }
  if (endless === 'grow') lines.push(<Note key="grow">{copy.grow}</Note>)

  /* 칸 크기: 가장 긴 줄의 칸 수와 줄 수로 상자에 맞춘다 */
  const widest = Math.max(letters.length, ...rows.map((r) => r.flat().length))
  useLayoutEffect(() => {
    const box = boxRef.current
    const pyr = pyrRef.current
    if (!box || !pyr) return
    const size = () => {
      const cap = box.firstElementChild as HTMLElement | null
      const h = box.clientHeight - (cap ? cap.offsetHeight + 10 : 0)
      const byW = box.clientWidth / (widest * 1.14)
      const byH = h / (lines.length * 1.14)
      pyr.style.setProperty(
        '--cell',
        `${Math.max(12, Math.min(44, byW, byH))}px`
      )
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(box)
    return () => ro.disconnect()
  }, [widest, lines.length])

  return (
    <div
      ref={boxRef}
      className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] justify-items-center"
    >
      <p className="mb-2.5 flex max-w-full items-baseline justify-center gap-2.5 text-sm font-bold whitespace-nowrap text-ink-2 [&>span:last-child]:min-w-0 [&>span:last-child]:truncate">
        {caption}
      </p>
      <div
        ref={pyrRef}
        className="grid content-start justify-items-center gap-(--gap) [--cell:32px] [--gap:max(2px,calc(var(--cell)*0.12))]"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              shown === undefined
                ? ''
                : i < shown
                  ? 'animate-menu-in motion-reduce:animate-none'
                  : 'invisible'
            }
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex justify-center gap-(--gap)">{children}</div>
}

/* 칸의 모양. 글꼴과 색 클래스가 겹치지 않게 한 벌씩 고른다 */
const LETTER =
  'border-transparent font-sans text-[calc(var(--cell)*0.56)] font-[750]'
const DIGIT = 'font-mono text-[calc(var(--cell)*0.46)]'
const TONES = {
  letter: `${LETTER} text-ink`,
  letterDim: `${LETTER} text-ink-3`,
  first: `${DIGIT} font-medium border-line-strong text-ink`,
  firstDim: `${DIGIT} font-medium border-line-strong text-ink-3`,
  plain: `${DIGIT} font-medium border-line text-ink-2`,
  score: `${DIGIT} font-bold border-brand-hi bg-brand-hi/12 text-ink`,
  loop: `${DIGIT} font-medium border-dashed border-brand-hi text-brand-hi`,
}

function Cell({
  children,
  tone,
}: {
  children: ReactNode
  tone: keyof typeof TONES
}) {
  return (
    <span
      className={`grid size-(--cell) place-items-center border leading-none ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.1em] whitespace-nowrap text-ink-3">
      {children}
    </p>
  )
}
