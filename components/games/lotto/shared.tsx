import type { CSSProperties, ReactNode, Ref } from 'react'
import type { Dictionary } from '@/app/[lang]/dictionaries'
import { blockClock } from '@/components/games/fortune/shared'
import { fill } from '@/components/games/shared'
import { ballTone, type BallTone, type Move } from '@/lib/lotto'
import type { Chart } from '@/lib/saju/chart'
import type { Pillar } from '@/lib/saju/ganji'

export type LottoCopy = Dictionary['lotto']
/** 운세 사전에서 빌려 쓰는 간지·오행·시진 이름 */
export type SajuCopy = Pick<
  Dictionary['fortune'],
  'stems' | 'branches' | 'elements' | 'chart' | 'hours'
>

/** 한자는 언어와 무관하다 */
const STEMS_HANJA = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES_HANJA = '子丑寅卯辰巳午未申酉戌亥'
export const hanjaOf = (m: Move) =>
  m.side === 'stem' ? STEMS_HANJA[m.index] : BRANCHES_HANJA[m.index]
export const pillarHanja = (p: Pillar) =>
  STEMS_HANJA[p.stem] + BRANCHES_HANJA[p.branch]

export const pad2 = (n: number) => String(n).padStart(2, '0')

/** 걸음의 글자(갑, 술 …) */
export const charOf = (saju: SajuCopy, m: Move) =>
  m.side === 'stem' ? saju.stems[m.index] : saju.branches[m.index]
/** 걸음의 자리(년간, 일지 …) */
export const moveLabel = (copy: LottoCopy, m: Move) =>
  fill(copy.walk.label, {
    pillar: copy.walk.pillars[m.pillar],
    side: copy.walk.sides[m.side],
  })
export const ganji = (saju: SajuCopy, p: Pillar) =>
  fill(saju.chart.ganji, { s: saju.stems[p.stem], b: saju.branches[p.branch] })
/** 경오일 */
export const dayName = (copy: LottoCopy, saju: SajuCopy, p: Pillar) =>
  fill(copy.sky.day, { g: ganji(saju, p) })
/** 갑술년 기사월 무술일 을묘시 */
export const chartText = (saju: SajuCopy, chart: Chart) =>
  (['year', 'month', 'day', 'hour'] as const)
    .filter((k) => chart[k])
    .map((k) => fill(saju.chart[k], { p: ganji(saju, chart[k]!) }))
    .join(' ')
/** 오시 11:30–13:30의 범위 */
export const blockRange = (i: number, shift: number) =>
  `${blockClock(i, shift)}–⁠${blockClock(i + 1, shift)}`

/** 받침에 맞는 조사(한국어). 다른 언어는 사전이 빈칸을 준다. */
export function josa(copy: LottoCopy, word: string) {
  const [withFinal, without] = copy.particles.topic
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code >= 11172) return without
  return code % 28 ? withFinal : without
}

export const b = (text: ReactNode) => (
  <b className="font-bold text-ink">{text}</b>
)

const TONE: Record<BallTone, string> = {
  yellow: 'bg-ball-yellow',
  blue: 'bg-ball-blue',
  red: 'bg-ball-red',
  gray: 'bg-ball-gray',
  green: 'bg-ball-green',
}

/** 로또 공. 실제 6/45 공의 번호대 색이다. */
export function Ball({
  n,
  className = '',
  style,
  dataKey,
  ref,
}: {
  n: number
  className?: string
  style?: CSSProperties
  /** 자리 바꿈 애니메이션(useFlip)이 짝짓는 열쇠 */
  dataKey?: number
  ref?: Ref<HTMLSpanElement>
}) {
  return (
    <span
      ref={ref}
      style={style}
      data-key={dataKey}
      className={`inline-grid aspect-square flex-none place-items-center rounded-full font-mono font-semibold tracking-[-0.02em] text-canvas tabular-nums ${TONE[ballTone(n)]} ${className}`}
    >
      {pad2(n)}
    </span>
  )
}

/** 공 색 클래스(버튼 공처럼 Ball을 쓰지 못할 때) */
export const toneClass = (n: number) => TONE[ballTone(n)]
