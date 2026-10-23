import { Fragment, type ReactNode } from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'
import type { PyramidData } from '@/components/games/match/pyramid'
import type { LovesReading } from '@/lib/name-match/loves'
import type { StrokeReading } from '@/lib/name-match/strokes'

export type MatchCopy = Dictionary['match']

/** 사전의 강조 배열(`["…", { "b": "…" }]`)을 그린다. */
export function rich(parts: (string | { b: string })[]) {
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <Fragment key={i}>{p}</Fragment>
    ) : (
      <b key={i} className="font-bold text-ink">
        {p.b}
      </b>
    )
  )
}

/** `{name}` 자리에 글이나 요소를 넣는다. */
export function compose(template: string, vars: Record<string, ReactNode>) {
  return template
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1]
      return key ? <Fragment key={i}>{vars[key]}</Fragment> : part
    })
    .filter((p) => p !== '')
}

/** 앞 이름의 받침에 맞는 '과/와'. 한글이 아니거나 비었으면 둘 다 적는다. */
export function andParticle(copy: MatchCopy, name: string) {
  const code = name.charCodeAt(name.length - 1) - 0xac00
  if (!name || code < 0 || code >= 11172) return copy.andUnknown
  return code % 28 ? copy.and[0] : copy.and[1]
}

/** 점수 구간. 사전의 bands와 같은 순서다(100, 90, 70, 50, 30, 0점 이상). */
const LEVELS = [100, 90, 70, 50, 30, 0]

/** 점수 구간의 문구 하나. 같은 두 이름이면 언제나 같은 문구가 나오도록 이름으로 고른다. */
export function bandOf(copy: MatchCopy, score: number, names: string[]) {
  const phrases = copy.bands[LEVELS.findIndex((min) => score >= min)]
  let h = 2166136261
  for (const ch of names.join('|'))
    h = Math.imul(h ^ ch.codePointAt(0)!, 16777619)
  return phrases[(h >>> 0) % phrases.length]
}

/** 획수 궁합 한 방향을 피라미드로. 뒤에 쓴 이름의 글자는 흐리게 그린다. */
export const strokePyramid = (r: StrokeReading): PyramidData => ({
  letters: r.letters.map((ch, i) => ({ ch, dim: r.owners[i] === 1 })),
  rows: r.rows.map((row) => row.map((n) => [n])),
  score: r.score,
})

const LOVES_HEAD = [...'LOVES'].map((ch) => ({ ch }))

/** LOVES 놀이를 피라미드로. 맨 위에 L·O·V·E·S를 적는다. */
export const lovesPyramid = (r: LovesReading): PyramidData => ({
  letters: LOVES_HEAD,
  rows: r.rows,
  score: r.score,
  endless:
    r.endless === 'cycle'
      ? { loopTo: r.loopTo }
      : r.endless === 'grow'
        ? 'grow'
        : undefined,
})
